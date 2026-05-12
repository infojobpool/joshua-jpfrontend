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
    <div className="overflow-hidden rounded-[1.25rem] border border-white/70 bg-white/50 p-4 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.12)] backdrop-blur-md ring-1 ring-slate-200/30 sm:p-5">
      <div className="flex gap-3 sm:gap-4">
        <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-gradient-to-br from-slate-200/90 to-slate-100/50 sm:h-14 sm:w-14" />
        <div className="min-w-0 flex-1 space-y-3">
          <div className="h-4 max-w-[min(100%,280px)] animate-pulse rounded-md bg-slate-200/60" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-100/80" />
          <div className="h-3 max-w-[65%] animate-pulse rounded bg-slate-100/80" />
          <div className="mt-4 h-9 max-w-[108px] animate-pulse rounded-full bg-slate-200/50" />
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
        return "bg-gradient-to-br from-amber-50/95 to-orange-100/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-amber-200/50";
      case "message":
        return "bg-gradient-to-br from-white/90 to-sky-50/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-blue-200/40";
      case "system":
        return "bg-gradient-to-br from-violet-50/95 to-purple-100/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] ring-1 ring-violet-200/45";
      default:
        return "bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-slate-200/60";
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
    <div className="relative min-h-screen min-w-0 w-full max-w-full overflow-x-hidden bg-slate-100 pb-[calc(env(safe-area-inset-bottom)+6.5rem))]">
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(59,130,246,0.14),transparent_50%),radial-gradient(ellipse_90%_60%_at_100%_0%,rgba(139,92,246,0.1),transparent_45%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_55%,#f1f5f9_100%)]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-2xl min-w-0 px-4 pt-4 sm:px-5 sm:pt-8">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          className="-ml-2 mb-3 h-10 gap-1.5 rounded-full border border-transparent text-slate-600 hover:border-slate-200/80 hover:bg-white/70 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Back
        </Button>

        <div className="mb-6 overflow-hidden rounded-[1.35rem] border border-white/80 bg-white/70 shadow-[0_20px_50px_-24px_rgba(30,58,138,0.28)] backdrop-blur-xl ring-1 ring-slate-200/50">
          <div className="relative border-b border-slate-200/40 bg-gradient-to-br from-white/90 via-blue-50/30 to-indigo-50/40 px-4 py-5 sm:px-6 sm:py-6">
            <div
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(255,255,255,0.35)_50%,transparent_60%)] opacity-60"
              aria-hidden
            />
            <h1 className="relative bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-800 bg-clip-text text-2xl font-bold tracking-tight text-transparent sm:text-[1.75rem]">
              Notifications
            </h1>
            <p className="relative mt-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Inbox</p>
            <div className="relative mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-slate-200/60 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                {sortedNotifications.length} total
              </span>
              {unreadCount > 0 ? (
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-blue-500/25">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-emerald-200/80 bg-emerald-50/90 px-3.5 py-1.5 text-xs font-medium text-emerald-900">
                  All caught up
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-white/40 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-2 sm:p-4">
            {unreadCount > 0 ? (
              <Button
                type="button"
                onClick={() => void handleMarkAllRead()}
                className="h-10 w-full justify-center gap-2 rounded-full border border-emerald-600/20 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-teal-700 sm:w-auto sm:min-w-[10rem]"
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
                    className="h-10 w-full gap-2 rounded-full border-slate-200/80 bg-white/90 shadow-sm hover:bg-white sm:w-auto sm:min-w-[10rem]"
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
            <Card className="overflow-hidden rounded-[1.25rem] border border-white/80 bg-white/60 shadow-[0_16px_48px_-24px_rgba(15,23,42,0.15)] backdrop-blur-md ring-1 ring-slate-200/40">
              <CardContent className="flex flex-col items-center px-6 py-16 text-center">
                <div className="mb-5 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-slate-200/60">
                  <Inbox className="h-9 w-9 text-slate-400" aria-hidden />
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">You are all set</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                  New bids, messages, and task updates will appear here when they arrive.
                </p>
              </CardContent>
            </Card>
          ) : (
            groupedSections.map(({ label, items }) => (
              <section key={label} className="space-y-3 sm:space-y-4">
                <div className="sticky top-0 z-[1] -mx-0.5 flex items-center gap-3 bg-[linear-gradient(180deg,rgba(248,250,252,0.92)_60%,transparent)] py-2 backdrop-blur-sm">
                  <h2 className="shrink-0 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                    {label}
                  </h2>
                  <div className="h-px min-w-0 flex-1 bg-gradient-to-r from-slate-300/80 to-transparent" aria-hidden />
                </div>
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
                          "group relative overflow-hidden rounded-[1.25rem] border transition-all duration-300",
                          unread
                            ? "border-blue-200/50 bg-white/55 shadow-[0_16px_44px_-18px_rgba(37,99,235,0.35)] backdrop-blur-md ring-1 ring-blue-500/10 hover:border-blue-300/60 hover:shadow-[0_20px_48px_-18px_rgba(37,99,235,0.4)]"
                            : "border-white/70 bg-white/45 shadow-[0_12px_36px_-20px_rgba(15,23,42,0.12)] backdrop-blur-md ring-1 ring-slate-200/30 hover:border-slate-200/90 hover:bg-white/60 hover:shadow-[0_16px_40px_-20px_rgba(15,23,42,0.14)]"
                        )}
                      >
                        {unread ? (
                          <div
                            className="pointer-events-none absolute left-0 top-0 h-full w-[3px] rounded-l-[1.25rem] bg-gradient-to-b from-blue-500 via-indigo-500 to-violet-500 opacity-95"
                            aria-hidden
                          />
                        ) : null}
                        <CardContent className="relative p-4 pl-5 sm:p-5 sm:pl-6">
                          <div className="flex gap-3 sm:gap-4">
                            <div
                              className={cn(
                                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-sm sm:h-[3.25rem] sm:w-[3.25rem]",
                                iconShellClass(type)
                              )}
                            >
                              {iconForType(type)}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="min-w-0 max-w-full break-words text-[0.95rem] font-semibold leading-snug tracking-tight text-slate-900 sm:text-[1.02rem]">
                                      {n.title || "Notification"}
                                    </h3>
                                    {unread ? (
                                      <Badge className="h-5 rounded-full border-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-2.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white shadow-sm">
                                        New
                                      </Badge>
                                    ) : null}
                                  </div>
                                  {desc ? (
                                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-slate-600 sm:text-sm">
                                      {desc}
                                    </p>
                                  ) : null}
                                  {hint ? (
                                    <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                                      <span className="h-1 w-1 rounded-full bg-slate-300" aria-hidden />
                                      {hint}
                                    </p>
                                  ) : null}
                                </div>

                                {link ? (
                                  <Link href={link} className="shrink-0 sm:pt-0.5">
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="mt-2 h-10 w-full rounded-full bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 px-6 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 ring-2 ring-white/40 transition hover:shadow-xl hover:shadow-blue-600/30 active:scale-[0.98] sm:mt-0 sm:h-9 sm:w-auto"
                                    >
                                      Open
                                    </Button>
                                  </Link>
                                ) : null}
                              </div>

                              <div className="mt-3.5 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-slate-200/50 pt-3 text-[11px] text-slate-500">
                                <span className="font-semibold text-slate-700">{relative}</span>
                                {absolute ? (
                                  <>
                                    <span className="text-slate-300" aria-hidden>
                                      ·
                                    </span>
                                    <span className="hidden font-medium tabular-nums tracking-wide text-slate-400 sm:inline">
                                      {absolute}
                                    </span>
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

        <p className="mx-auto mt-10 max-w-md pb-6 text-center text-[11px] leading-relaxed text-slate-500 sm:text-sm">
          Updates sync in the background. Tap Open to go to the task or conversation.
        </p>
      </div>
    </div>
  );
}
