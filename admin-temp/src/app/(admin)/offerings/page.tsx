"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare, Store, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosInstance";

interface OfferingRow {
  id: string;
  user_id: string;
  title: string;
  type: string;
  category: string | null;
  status: string;
  admin_hidden: boolean;
  provider_display_name: string | null;
  updated_at: string | null;
  chat_count?: number;
}

interface UserBrief {
  user_id: string;
  user_name: string | null;
  user_email: string | null;
}

interface OfferingChat {
  chat_id: string;
  opened_at: string | null;
  participants: UserBrief[];
  enquirers: UserBrief[];
  message_count: number;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender_user_id: string | null;
  messages?: {
    messagesid: number;
    sender_user_id: string;
    description: string;
    tstamp: string | null;
    readstatus: boolean;
  }[] | null;
}

interface OfferingChatTracking {
  offering: {
    id: string;
    title: string;
    status: string;
    owner: UserBrief;
    created_at: string | null;
  };
  summary: {
    chat_count: number;
    unique_enquirer_count: number;
    total_messages: number;
  };
  chats: OfferingChat[];
}

interface ChatSummaryListing {
  offering_id: string;
  title: string;
  status: string;
  owner_user_id: string;
  owner_name: string | null;
  owner_email: string | null;
  chat_count: number;
}

type VisibilityFilter = "all" | "visible" | "hidden";

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function AdminOfferingsPage() {
  const [rows, setRows] = useState<OfferingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [visibility, setVisibility] = useState<VisibilityFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [topChats, setTopChats] = useState<ChatSummaryListing[]>([]);
  const [tracking, setTracking] = useState<OfferingChatTracking | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [includeMessages, setIncludeMessages] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("limit", "100");
      params.set("offset", "0");
      params.set("include_chat_stats", "true");
      if (visibility === "hidden") params.set("admin_hidden", "true");
      if (visibility === "visible") params.set("admin_hidden", "false");
      const response = await axiosInstance.get(`admin/offerings/?${params.toString()}`);
      if (response.data.status_code === 200 && response.data.data) {
        setRows(response.data.data.offerings ?? []);
        setTotal(response.data.data.total ?? 0);
      } else {
        toast.error(response.data.message || "Failed to load listings");
      }
    } catch {
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
    }
  }, [visibility]);

  const fetchChatSummary = useCallback(async () => {
    try {
      const response = await axiosInstance.get("admin/offerings-chat-summary/", {
        params: { limit: 20 },
      });
      if (response.data.status_code === 200 && response.data.data) {
        setTopChats(response.data.data.listings ?? []);
      }
    } catch {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    fetchList();
    fetchChatSummary();
  }, [fetchList, fetchChatSummary]);

  const setHidden = async (offeringId: string, adminHidden: boolean) => {
    try {
      setBusyId(offeringId);
      const response = await axiosInstance.patch(`admin/offerings/${offeringId}/visibility/`, {
        admin_hidden: adminHidden,
      });
      if (response.data.status_code === 200) {
        toast.success(adminHidden ? "Listing hidden from public" : "Listing visible again");
        await fetchList();
      } else {
        toast.error(response.data.message || "Update failed");
      }
    } catch {
      toast.error("Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const openChatTracking = async (offeringId: string, withMessages = includeMessages) => {
    try {
      setTrackingLoading(true);
      const response = await axiosInstance.get(`admin/offerings/${offeringId}/chats/`, {
        params: {
          include_messages: withMessages,
          message_limit: 30,
        },
        timeout: 60000,
      });
      if (response.data.status_code === 200 && response.data.data) {
        setTracking(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load chat tracking");
      }
    } catch {
      toast.error("Failed to load chat tracking");
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <Toaster />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Store className="h-6 w-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Service listings</h1>
            <p className="text-sm text-muted-foreground">
              Hide/unhide listings and track how many chats each listing opened, by whom.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Visibility</span>
          <Select
            value={visibility}
            onValueChange={(v) => setVisibility(v as VisibilityFilter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="visible">Public only</SelectItem>
              <SelectItem value="hidden">Hidden only</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchList();
              fetchChatSummary();
            }}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </div>

      {topChats.length > 0 && (
        <div className="rounded-md border p-4">
          <div className="mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Most contacted listings</h2>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Chats</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topChats.map((l) => (
                  <TableRow key={l.offering_id}>
                    <TableCell className="max-w-[220px] truncate font-medium">
                      {l.title}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-sm">
                      {l.owner_name || l.owner_email || l.owner_user_id}
                    </TableCell>
                    <TableCell>{l.chat_count}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openChatTracking(l.offering_id)}
                      >
                        View chats
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        {loading ? "Loading…" : `${total} listing(s)`}
      </p>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Public</TableHead>
              <TableHead>Chats</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No listings match this filter.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="max-w-[220px] truncate font-medium">{o.title}</TableCell>
                  <TableCell className="max-w-[140px] truncate">
                    {o.provider_display_name || "—"}
                  </TableCell>
                  <TableCell className="max-w-[120px] truncate font-mono text-xs">{o.user_id}</TableCell>
                  <TableCell>{o.status}</TableCell>
                  <TableCell>{o.admin_hidden ? "Hidden" : "Shown"}</TableCell>
                  <TableCell>{o.chat_count ?? 0}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openChatTracking(o.id)}
                    >
                      Chats
                    </Button>
                    {o.admin_hidden ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === o.id}
                        onClick={() => setHidden(o.id, false)}
                      >
                        Unhide
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === o.id}
                        onClick={() => setHidden(o.id, true)}
                      >
                        Hide
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {(tracking || trackingLoading) && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="flex h-full w-full max-w-xl flex-col bg-background shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h2 className="text-lg font-semibold">Listing chat tracking</h2>
                {tracking && (
                  <p className="text-sm text-muted-foreground">{tracking.offering.title}</p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setTracking(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {trackingLoading && !tracking ? (
                <p className="text-sm text-muted-foreground">Loading chats…</p>
              ) : tracking ? (
                <>
                  <div className="grid grid-cols-3 gap-3 rounded-md border p-3 text-center">
                    <div>
                      <div className="text-2xl font-bold">{tracking.summary.chat_count}</div>
                      <div className="text-xs text-muted-foreground">Chats opened</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {tracking.summary.unique_enquirer_count}
                      </div>
                      <div className="text-xs text-muted-foreground">Unique people</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{tracking.summary.total_messages}</div>
                      <div className="text-xs text-muted-foreground">Messages</div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Owner: </span>
                    {tracking.offering.owner.user_name ||
                      tracking.offering.owner.user_email ||
                      tracking.offering.owner.user_id}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={includeMessages}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setIncludeMessages(next);
                          if (tracking?.offering.id) {
                            openChatTracking(tracking.offering.id, next);
                          }
                        }}
                      />
                      Load full recent messages
                    </label>
                  </div>
                  {tracking.chats.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No chats opened for this listing yet.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {tracking.chats.map((c) => (
                        <div key={c.chat_id} className="rounded-md border p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-medium">
                              {c.enquirers.length
                                ? c.enquirers
                                    .map((e) => e.user_name || e.user_email || e.user_id)
                                    .join(", ")
                                : "Unknown enquirer"}
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {c.message_count} msg
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Opened: {formatWhen(c.opened_at)} · Last:{" "}
                            {formatWhen(c.last_message_at)}
                          </div>
                          {c.enquirers[0]?.user_email && (
                            <div className="text-xs text-muted-foreground">
                              {c.enquirers[0].user_email}
                            </div>
                          )}
                          {c.last_message_preview && (
                            <p className="text-sm line-clamp-2">&ldquo;{c.last_message_preview}&rdquo;</p>
                          )}
                          {c.messages && c.messages.length > 0 && (
                            <div className="mt-2 max-h-48 overflow-y-auto rounded bg-muted/40 p-2 space-y-1">
                              {c.messages.map((m) => (
                                <div key={m.messagesid} className="text-xs">
                                  <span className="font-mono text-muted-foreground">
                                    {m.sender_user_id.slice(0, 8)}…
                                  </span>{" "}
                                  {m.description}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="font-mono text-[10px] text-muted-foreground">
                            chat: {c.chat_id}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
