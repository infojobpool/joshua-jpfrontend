"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { getApiErrorMessage } from "@/lib/apiError";
import { useCanAdminWrite } from "@/lib/adminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiErrorMessage, formatAxiosApiError } from "@/lib/apiError";
import { Loader2, Eye, EyeOff, Pencil } from "lucide-react";

const PAGE_LIMIT = 50;

type StatusFilter = "all" | "draft" | "published" | "paused";
type AdminHiddenFilter = "all" | "visible" | "hidden";

interface AdminOfferingRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  category: string;
  description: string;
  location_text: string;
  starting_price_inr: number;
  photo_urls: string[];
  status: string;
  attestation_accepted: boolean;
  admin_hidden: boolean;
  created_at: string;
  updated_at: string;
  provider_display_name: string | null;
}

function pickStr(r: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = r[k];
    if (v != null && typeof v === "string") return v;
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

function normalizeRow(raw: Record<string, unknown>): AdminOfferingRow | null {
  const id = pickStr(raw, "id");
  if (!id) return null;
  const photos = raw.photo_urls ?? raw.photoUrls;
  const photo_urls = Array.isArray(photos)
    ? (photos as unknown[]).filter((u): u is string => typeof u === "string")
    : [];
  const priceRaw = raw.starting_price_inr ?? raw.startingPriceInr;
  const starting_price_inr =
    typeof priceRaw === "number" && Number.isFinite(priceRaw)
      ? priceRaw
      : typeof priceRaw === "string"
        ? parseFloat(priceRaw) || 0
        : 0;
  const nameRaw = raw.provider_display_name ?? raw.providerDisplayName;
  return {
    id,
    user_id: pickStr(raw, "user_id", "userId"),
    type: pickStr(raw, "type") || "service",
    title: pickStr(raw, "title"),
    category: pickStr(raw, "category"),
    description: pickStr(raw, "description"),
    location_text: pickStr(raw, "location_text", "locationText"),
    starting_price_inr,
    photo_urls,
    status: (pickStr(raw, "status") || "draft").toLowerCase(),
    attestation_accepted: Boolean(raw.attestation_accepted ?? raw.attestationAccepted),
    admin_hidden: Boolean(raw.admin_hidden ?? raw.adminHidden),
    created_at: pickStr(raw, "created_at", "createdAt"),
    updated_at: pickStr(raw, "updated_at", "updatedAt"),
    provider_display_name:
      typeof nameRaw === "string" && nameRaw.trim() ? nameRaw.trim() : null,
  };
}

function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "published") return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
  if (s === "paused") return "bg-amber-100 text-amber-800 hover:bg-amber-100";
  return "bg-slate-100 text-slate-700 hover:bg-slate-100";
}

function filterHttpsPhotoUrls(urls: string[]): string[] {
  return urls.filter((u) => typeof u === "string" && /^https?:\/\//i.test(u.trim()));
}

type OfferingStatusEdit = "draft" | "published" | "paused";
type OfferingTypeEdit = "service" | "product";

interface EditDraft {
  offeringId: string;
  type: OfferingTypeEdit;
  title: string;
  category: string;
  description: string;
  location_text: string;
  starting_price_inr: string;
  status: OfferingStatusEdit;
  photo_urls_text: string;
  attestation_accepted: boolean;
}

function rowToEditDraft(o: AdminOfferingRow): EditDraft {
  const st = (o.status || "draft").toLowerCase();
  let status: OfferingStatusEdit = "draft";
  if (st === "published") status = "published";
  else if (st === "paused") status = "paused";
  const ty = (o.type || "service").toLowerCase() === "product" ? "product" : "service";
  return {
    offeringId: o.id,
    type: ty,
    title: o.title,
    category: o.category,
    description: o.description,
    location_text: o.location_text,
    starting_price_inr: String(Math.round(o.starting_price_inr) || 0),
    status,
    photo_urls_text: o.photo_urls.join("\n"),
    attestation_accepted: o.attestation_accepted,
  };
}

export default function AdminOfferingsPage() {
  const [rows, setRows] = useState<AdminOfferingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [queryEpoch, setQueryEpoch] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [userIdFilter, setUserIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [adminHiddenFilter, setAdminHiddenFilter] = useState<AdminHiddenFilter>("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const canWrite = useCanAdminWrite();

  /** Latest filter fields for fetchList (avoid refetch on every keystroke). */
  const filtersRef = useRef({
    userIdFilter,
    statusFilter,
    adminHiddenFilter,
  });
  filtersRef.current = { userIdFilter, statusFilter, adminHiddenFilter };

  const fetchList = useCallback(async () => {
    try {
      setIsLoading(true);
      const { userIdFilter: uidRaw, statusFilter: st, adminHiddenFilter: ah } = filtersRef.current;
      const params: Record<string, string | number | boolean> = {
        limit: PAGE_LIMIT,
        offset,
      };
      const uid = uidRaw.trim();
      if (uid) params.user_id = uid;
      if (st !== "all") params.status = st;
      if (ah === "hidden") params.admin_hidden = true;
      if (ah === "visible") params.admin_hidden = false;

      const response = await axiosInstance.get("/admin/offerings/", { params });
      if (response.data?.status_code !== 200) {
        toast.error(response.data?.message || "Failed to load offerings");
        setRows([]);
        setTotal(0);
        return;
      }
      const data = response.data?.data;
      const listRaw = data?.offerings;
      const list: AdminOfferingRow[] = [];
      if (Array.isArray(listRaw)) {
        for (const item of listRaw) {
          if (item && typeof item === "object" && !Array.isArray(item)) {
            const n = normalizeRow(item as Record<string, unknown>);
            if (n) list.push(n);
          }
        }
      }
      setRows(list);
      const t = data?.total;
      setTotal(typeof t === "number" && Number.isFinite(t) ? t : list.length);
    } catch (err) {
      toast.error(getApiErrorMessage(err) || "Failed to load offerings");
      setRows([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [offset, queryEpoch]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const applyFilters = () => {
    setOffset(0);
    setQueryEpoch((e) => e + 1);
  };

  const openEdit = (o: AdminOfferingRow) => {
    if (!canWrite) {
      toast.error("Read-only access");
      return;
    }
    setEditDraft(rowToEditDraft(o));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!canWrite || !editDraft) {
      toast.error("Read-only access");
      return;
    }
    const id = editDraft.offeringId;
    const price = parseFloat(editDraft.starting_price_inr.replace(/,/g, ""));
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Enter a valid starting price (₹).");
      return;
    }
    const photoLines = editDraft.photo_urls_text
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const photo_urls = filterHttpsPhotoUrls(photoLines);
    const body: Record<string, unknown> = {
      type: editDraft.type,
      title: editDraft.title.trim(),
      category: editDraft.category.trim(),
      description: editDraft.description.trim(),
      location_text: editDraft.location_text.trim(),
      starting_price_inr: price,
      status: editDraft.status,
      photo_urls,
      attestation_accepted: editDraft.attestation_accepted,
    };
    try {
      setSavingEdit(true);
      const res = await axiosInstance.patch(`/admin/offerings/${id}/`, body);
      if (res.data?.status_code !== 200) {
        toast.error(res.data?.message || "Update failed");
        return;
      }
      toast.success(res.data?.message || "Offering updated");
      setEditOpen(false);
      setEditDraft(null);
      await fetchList();
    } catch (err) {
      toast.error(formatAxiosApiError(err) || getApiErrorMessage(err) || "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const patchVisibility = async (offeringId: string, admin_hidden: boolean) => {
    if (!canWrite) {
      toast.error("Read-only access");
      return;
    }
    try {
      setActionId(offeringId);
      const res = await axiosInstance.patch(`/admin/offerings/${offeringId}/visibility/`, {
        admin_hidden,
      });
      if (res.data?.status_code !== 200) {
        toast.error(res.data?.message || "Update failed");
        return;
      }
      toast.success(res.data?.message || "Offering visibility updated");
      await fetchList();
    } catch (err) {
      toast.error(getApiErrorMessage(err) || "Update failed");
    } finally {
      setActionId(null);
    }
  };

  const hasPrev = offset > 0;
  const hasNext = offset + PAGE_LIMIT < total;

  return (
    <div className="flex flex-col gap-4">
      <Toaster />
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Tasker listings</CardTitle>
          <CardDescription>
            Browse offerings across users. Hide listings from the public feed and profile discovery
            without changing the tasker&apos;s draft / published / paused status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <div className="grid gap-2 min-w-[200px] flex-1">
              <Label htmlFor="off-user-id">User ID</Label>
              <Input
                id="off-user-id"
                placeholder="Filter by tasker user_id"
                value={userIdFilter}
                onChange={(e) => setUserIdFilter(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2 w-full sm:w-44">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2 w-full sm:w-48">
              <Label>Admin visibility</Label>
              <Select
                value={adminHiddenFilter}
                onValueChange={(v) => setAdminHiddenFilter(v as AdminHiddenFilter)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="visible">Visible (not hidden)</SelectItem>
                  <SelectItem value="hidden">Hidden by admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="button" onClick={applyFilters} disabled={isLoading} className="lg:mb-0.5">
              Apply filters
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
            <span>
              Showing {rows.length === 0 ? 0 : offset + 1}–{offset + rows.length} of {total}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasPrev || isLoading}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_LIMIT))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!hasNext || isLoading}
                onClick={() => setOffset((o) => o + PAGE_LIMIT)}
              >
                Next
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-white overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="min-w-[140px]">Listing</TableHead>
                  <TableHead className="min-w-[120px]">Provider</TableHead>
                  <TableHead className="min-w-[100px]">User ID</TableHead>
                  <TableHead className="w-[88px]">Status</TableHead>
                  <TableHead className="w-[100px]">Admin</TableHead>
                  <TableHead className="min-w-[90px] text-right">Price ₹</TableHead>
                  <TableHead className="min-w-[100px]">Updated</TableHead>
                  <TableHead className="min-w-[200px] text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                      <Loader2 className="inline h-5 w-5 animate-spin mr-2 align-middle" />
                      Loading…
                    </TableCell>
                  </TableRow>
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-slate-500">
                      No offerings match these filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="align-top">
                        <div className="font-medium text-slate-900 line-clamp-2 max-w-[220px]">
                          {o.title || "—"}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{o.category}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1 truncate max-w-[220px]">
                          {o.id}
                        </div>
                      </TableCell>
                      <TableCell className="align-top text-sm">
                        {o.provider_display_name ?? "—"}
                      </TableCell>
                      <TableCell className="align-top font-mono text-xs break-all max-w-[140px]">
                        {o.user_id || "—"}
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge className={statusBadgeClass(o.status)}>{o.status}</Badge>
                      </TableCell>
                      <TableCell className="align-top">
                        {o.admin_hidden ? (
                          <Badge variant="destructive" className="font-normal">
                            Hidden
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="font-normal">
                            OK
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-right tabular-nums">
                        {Math.round(o.starting_price_inr).toLocaleString("en-IN")}
                      </TableCell>
                      <TableCell className="align-top text-xs text-slate-600 whitespace-nowrap">
                        {o.updated_at
                          ? new Date(o.updated_at).toLocaleString(undefined, {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—"}
                      </TableCell>
                      <TableCell className="align-top text-right">
                        <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:flex-wrap sm:justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={!canWrite || savingEdit}
                            title={!canWrite ? "Read-only role" : "Edit listing fields"}
                            onClick={() => openEdit(o)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                          {o.admin_hidden ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              disabled={!canWrite || actionId === o.id}
                              title={!canWrite ? "Read-only role" : "Show on public feed again"}
                              onClick={() => patchVisibility(o.id, false)}
                            >
                              {actionId === o.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Eye className="h-3.5 w-3.5" />
                              )}
                              Unhide
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="gap-1"
                              disabled={!canWrite || actionId === o.id}
                              title={!canWrite ? "Read-only role" : "Remove from public feed / others’ profile view"}
                              onClick={() => patchVisibility(o.id, true)}
                            >
                              {actionId === o.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <EyeOff className="h-3.5 w-3.5" />
                              )}
                              Hide
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) {
            setEditOpen(false);
            setEditDraft(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit listing</DialogTitle>
            <DialogDescription>
              Update fields as the tasker would. Uses writer admin auth. Photo URLs must be http(s), one per line.
            </DialogDescription>
          </DialogHeader>
          {editDraft ? (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={editDraft.type}
                  onValueChange={(v) =>
                    setEditDraft((d) => (d ? { ...d, type: v as OfferingTypeEdit } : d))
                  }
                  disabled={savingEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editDraft.title}
                  onChange={(e) => setEditDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                  disabled={savingEdit}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={editDraft.category}
                  onChange={(e) => setEditDraft((d) => (d ? { ...d, category: e.target.value } : d))}
                  disabled={savingEdit}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea
                  id="edit-desc"
                  value={editDraft.description}
                  onChange={(e) => setEditDraft((d) => (d ? { ...d, description: e.target.value } : d))}
                  disabled={savingEdit}
                  rows={4}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-loc">Location (text)</Label>
                <Input
                  id="edit-loc"
                  value={editDraft.location_text}
                  onChange={(e) => setEditDraft((d) => (d ? { ...d, location_text: e.target.value } : d))}
                  disabled={savingEdit}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-price">Starting price (INR)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  min={0}
                  step={1}
                  value={editDraft.starting_price_inr}
                  onChange={(e) =>
                    setEditDraft((d) => (d ? { ...d, starting_price_inr: e.target.value } : d))
                  }
                  disabled={savingEdit}
                />
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select
                  value={editDraft.status}
                  onValueChange={(v) =>
                    setEditDraft((d) => (d ? { ...d, status: v as OfferingStatusEdit } : d))
                  }
                  disabled={savingEdit}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-photos">Photo URLs (https, one per line)</Label>
                <Textarea
                  id="edit-photos"
                  value={editDraft.photo_urls_text}
                  onChange={(e) =>
                    setEditDraft((d) => (d ? { ...d, photo_urls_text: e.target.value } : d))
                  }
                  disabled={savingEdit}
                  rows={3}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-attest"
                  checked={editDraft.attestation_accepted}
                  onCheckedChange={(c) =>
                    setEditDraft((d) => (d ? { ...d, attestation_accepted: Boolean(c) } : d))
                  }
                  disabled={savingEdit}
                />
                <Label htmlFor="edit-attest" className="text-sm font-normal cursor-pointer">
                  Attestation accepted
                </Label>
              </div>
              <p className="text-xs text-muted-foreground font-mono break-all">ID: {editDraft.offeringId}</p>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditOpen(false);
                setEditDraft(null);
              }}
              disabled={savingEdit}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveEdit()} disabled={savingEdit || !editDraft}>
              {savingEdit ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
