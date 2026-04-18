"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNow, isValid, isToday, isYesterday } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  MessageSquare,
  Gavel,
  ArrowLeft,
  CheckCheck,
  Clock,
  Trash2,
  Inbox,
  MoreVertical,
} from "lucide-react";
import useStore from "@/lib/Zustand";
import { useNotifications, type NotificationItem as ApiNotificationRow } from "@/lib/useNotifications";
import { cn } from "@/lib/utils";

function parseRowDate(n: ApiNotificationRow & Record<string, unknown>): Date | null {
  const raw = (n as { created_at?: string }).created_at ?? (n as { createdAt?: string }).createdAt;
  if (raw == null || raw === "") return null;
  const d = new Date(String(raw));
  return isValid(d) ? d : null;
}

function dayBucket(d: Date | null): "Today" | "Yesterday" | "Earlier" {
  if (!d) return "Earlier";
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return "Earlier";
}

function rowTimeLabels(n: ApiNotificationRow & Record<string, unknown>): { relative: string; absolute: string } {
  const d = parseRowDate(n);
  if (!d) return { relative: "—", absolute: "" };
  return {
    relative: formatDistanceToNow(d, { addSuffix: true }),
    absolute: format(d, "d MMM yyyy · HH:mm"),
  };
}

function rowDescription(n: ApiNotificationRow & Record<string, unknown>): string {
  return String((n as { description?: string }).description ?? (n as { body?: string }).body ?? "").trim();
}

function rowLink(n: ApiNotificationRow & Record<string, unknown>): string | undefined {
  const link = (n as { link?: string }).link;
  if (link && String(link).trim()) return String(link).trim();
  return undefined;
}

/** Short hint for where the deep link goes (no external URLs shown raw). */
function linkDestinationHint(href: string): string | undefined {
  try {
    const path = href.startsWith("http") ? new URL(href).pathname : href.split("?")[0];
    const p = path.toLowerCase();
    if (p.includes("/messages")) return "Opens your messages";
    if (p.includes("/wallet")) return "Opens wallet";
    if (p.includes("/dashboard")) return "Opens dashboard";
    if (p.includes("/task") || p.includes("/browse") || p.includes("/post-task")) return "Opens task or listing";
    if (p.includes("/profile")) return "Opens profile";
    if (p.startsWith("/")) return "Opens in app";
  } catch {
    return undefined;
  }
  return undefined;
}

function NotificationRowSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white/70 p-4 shadow-sm sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-slate-200/70 sm:h-14 sm:w-14" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-4 max-w-[min(100%,280px)] animate-pulse rounded-md bg-slate-200/70" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-3 max-w-[65%] animate-pulse rounded bg-slate-100" />
          <div className="mt-4 h-8 max-w-[120px] animate-pulse rounded-full bg-slate-200/60" />
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const userId = useStore((s) => s.userId);
  const checkAuth = useStore((s) => s.checkAuth);
  const [authReady, setAuthReady] = useState(false);
  const pollEnabled = authReady && !!userId;
  const {
    items: liveItems,
    unreadCount,
    loading: notifLoading,
    markAsRead,
    clearOldKeepLatest,
    clearAll,
  } = useNotifications(pollEnabled);

  const sortedNotifications = useMemo(() => {
    return [...liveItems].sort(
      (a, b) =>
        new Date((b as { created_at?: string }).created_at ?? (b as { createdAt?: string }).createdAt ?? 0).getTime() -
        new Date((a as { created_at?: string }).created_at ?? (a as { createdAt?: string }).createdAt ?? 0).getTime()
    );
  }, [liveItems]);

  const groupedSections = useMemo(() => {
    const buckets: Record<"Today" | "Yesterday" | "Earlier", ApiNotificationRow[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };
    for (const row of sortedNotifications) {
      const n = row as ApiNotificationRow & Record<string, unknown>;
      buckets[dayBucket(parseRowDate(n))].push(row);
    }
    const order: ("Today" | "Yesterday" | "Earlier")[] = ["Today", "Yesterday", "Earlier"];
    return order.filter((label) => buckets[label].length > 0).map((label) => ({ label, items: buckets[label] }));
  }, [sortedNotifications]);

  useEffect(() => {
    checkAuth();
    const t = setTimeout(() => setAuthReady(true), 150);
    return () => clearTimeout(t);
  }, [checkAuth]);

  useEffect(() => {
    if (!authReady) return;
    if (!userId) {
      router.push("/signin");
    }
  }, [authReady, userId, router]);

  const handleMarkAllRead = async () => {
    await markAsRead(null);
  };

  const iconForType = (type: string) => {
    switch (type) {
      case "bid":
        return <Gavel className="h-5 w-5 text-amber-700" aria-hidden />;
      case "message":
        return <MessageSquare className="h-5 w-5 text-blue-700" aria-hidden />;
      case "system":
        return <Bell className="h-5 w-5 text-violet-700" aria-hidden />;
      default:
        return <Bell className="h-5 w-5 text-slate-600" aria-hidden />;
    }
  };

  const iconShellClass = (type: string) => {
    switch (type) {
      case "bid":
        return "bg-gradient-to-br from-amber-50 to-orange-100/80 ring-1 ring-amber-200/80 shadow-inner";
      case "message":
        return "bg-gradient-to-br from-blue-50 to-sky-100/80 ring-1 ring-blue-200/80 shadow-inner";
      case "system":
        return "bg-gradient-to-br from-violet-50 to-purple-100/70 ring-1 ring-violet-200/70 shadow-inner";
      default:
        return "bg-slate-100 ring-1 ring-slate-200/80";
    }
  };

  const spinner = (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
      <div
        className="h-11 w-11 animate-spin rounded-full border-[3px] border-blue-200 border-t-blue-600"
        aria-hidden
      />
      <p className="text-sm text-slate-600">Loading…</p>
    </div>
  );

  if (!authReady) {
    return (
      <div className="min-h-screen bg-[linear-gradient(165deg,#eff6ff_0%,#f5f3ff_45%,#eef2ff_100%)]">{spinner}</div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-[linear-gradient(165deg,#eff6ff_0%,#f5f3ff_45%,#eef2ff_100%)]">{spinner}</div>
    );
  }

  const showInitialSkeleton = notifLoading && sortedNotifications.length === 0;
  const hasMoreMenu = sortedNotifications.length > 0;

  return (
    <div className="min-h-screen bg-[linear-gradient(165deg,#eff6ff_0%,#f8fafc_38%,#f5f3ff_100%)] pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-2xl px-4 pt-4 sm:px-5 sm:pt-8">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="-ml-2 mb-3 h-10 gap-1.5 rounded-xl text-slate-600 hover:bg-white/80 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back
        </Button>

        <div className="mb-5 overflow-hidden rounded-2xl border border-white/90 bg-white/85 shadow-[0_8px_30px_-12px_rgba(30,64,175,0.2)] backdrop-blur-sm ring-1 ring-slate-200/40">
          <div className="border-b border-slate-100/90 bg-gradient-to-r from-blue-600/5 via-indigo-50/40 to-violet-600/5 px-4 py-4 sm:px-5 sm:py-5">
            <h1 className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-3xl">
              Notifications
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-slate-200/80">
                {sortedNotifications.length} total
              </span>
              {unreadCount > 0 ? (
                <span className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white shadow-sm ring-1 ring-blue-500/30">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/80">
                  All caught up
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2 sm:p-4">
            {unreadCount > 0 ? (
              <Button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="h-10 w-full justify-center gap-2 rounded-xl bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 sm:w-auto sm:min-w-[9.5rem]"
              >
                <CheckCheck className="h-4 w-4 shrink-0" />
                Mark all read
              </Button>
            ) : null}

            {hasMoreMenu ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full gap-2 rounded-xl border-slate-200 bg-white/90 hover:bg-slate-50 sm:w-auto sm:min-w-[10rem]"
                    aria-label="More notification actions"
                  >
                    <MoreVertical className="h-4 w-4 shrink-0 text-slate-600" />
                    More
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {sortedNotifications.length > 10 ? (
                    <DropdownMenuItem
                      onClick={() => clearOldKeepLatest()}
                      className="cursor-pointer gap-2"
                    >
                      <Clock className="h-4 w-4 text-slate-500" />
                      <div className="flex flex-col gap-0.5">
                        <span>Clear old</span>
                        <span className="text-xs font-normal text-muted-foreground">Keep 10 newest on this device</span>
                      </div>
                    </DropdownMenuItem>
                  ) : null}
                  {sortedNotifications.length > 10 ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem
                    onClick={() => clearAll()}
                    className="cursor-pointer gap-2 text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <div className="flex flex-col gap-0.5">
                      <span>Clear all</span>
                      <span className="text-xs font-normal text-red-600/80">Clears list until next sync</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {showInitialSkeleton ? (
            <div className="space-y-3 sm:space-y-4" aria-busy aria-label="Loading notifications">
              {Array.from({ length: 6 }).map((_, i) => (
                <NotificationRowSkeleton key={i} />
              ))}
            </div>
          ) : sortedNotifications.length === 0 ? (
            <Card className="overflow-hidden rounded-2xl border-slate-200/80 bg-white/90 shadow-sm">
              <CardContent className="flex flex-col items-center px-6 py-14 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 ring-1 ring-slate-200/80">
                  <Inbox className="h-8 w-8 text-slate-400" aria-hidden />
                </div>
                <h2 className="text-lg font-semibold text-slate-800">You are all set</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                  New bids, messages, and task updates will show up here when they arrive.
                </p>
              </CardContent>
            </Card>
          ) : (
            groupedSections.map(({ label, items }) => (
              <section key={label} className="space-y-3 sm:space-y-4">
                <h2 className="sticky top-0 z-[1] -mx-1 px-1 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-500 backdrop-blur-sm sm:text-[0.7rem]">
                  {label}
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  {items.map((notification) => {
                    const n = notification as ApiNotificationRow & Record<string, unknown>;
                    const type = String(n.type ?? "system");
                    const desc = rowDescription(n);
                    const link = rowLink(n);
                    const unread = !n.read;
                    const { relative, absolute } = rowTimeLabels(n);
                    const hint = link ? linkDestinationHint(link) : undefined;

                    return (
                      <Card
                        key={String(n.id)}
                        className={cn(
                          "overflow-hidden rounded-2xl border transition-shadow duration-200 hover:shadow-md",
                          unread
                            ? "border-blue-200/90 bg-gradient-to-br from-white via-white to-blue-50/50 shadow-[0_4px_20px_-8px_rgba(37,99,235,0.25)] ring-1 ring-blue-500/10"
                            : "border-slate-200/70 bg-white/95 shadow-sm ring-1 ring-slate-100/80"
                        )}
                      >
                        <div
                          className={cn(
                            "h-1 w-full",
                            unread ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" : "bg-transparent"
                          )}
                        />
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex gap-3 sm:gap-4">
                            <div
                              className={cn(
                                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl sm:h-14 sm:w-14",
                                iconShellClass(type)
                              )}
                            >
                              {iconForType(type)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-[0.95rem] font-semibold leading-snug text-slate-900 sm:text-base">
                                      {n.title || "Notification"}
                                    </h3>
                                    {unread ? (
                                      <Badge className="h-5 border-0 bg-blue-600 px-2 text-[10px] font-semibold uppercase tracking-wide text-white">
                                        New
                                      </Badge>
                                    ) : null}
                                  </div>
                                  {desc ? (
                                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">{desc}</p>
                                  ) : null}
                                  {hint ? (
                                    <p className="mt-1.5 text-xs font-medium text-slate-500">{hint}</p>
                                  ) : null}
                                </div>

                                {link ? (
                                  <Link href={link} className="shrink-0 sm:pt-0.5">
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="mt-2 h-9 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg sm:mt-0 sm:w-auto sm:rounded-full"
                                    >
                                      Open
                                    </Button>
                                  </Link>
                                ) : null}
                              </div>

                              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                                <span className="font-medium text-slate-600">{relative}</span>
                                {absolute ? (
                                  <>
                                    <span className="hidden text-slate-300 sm:inline" aria-hidden>
                                      ·
                                    </span>
                                    <span className="hidden text-slate-500 sm:inline">{absolute}</span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        <p className="mx-auto mt-10 max-w-md pb-6 text-center text-xs leading-relaxed text-slate-500 sm:text-sm">
          Updates sync automatically. Open any item to jump to the task or message.
        </p>
      </div>
    </div>
  );
}
