"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CUSTOM_CATEGORY_VALUE,
  fetchTaskCategoriesList,
  type TaskCategory,
} from "@/lib/taskCategories";
import { toast } from "sonner";

type TaskCategoryPickerProps = {
  categoryId: string;
  customCategoryName: string;
  onCategoryIdChange: (id: string) => void;
  onCustomCategoryNameChange: (name: string) => void;
  disabled?: boolean;
  /** Match post-task / profile editor labels */
  label?: string;
  showRefresh?: boolean;
  selectClassName?: string;
};

export function TaskCategoryPicker({
  categoryId,
  customCategoryName,
  onCategoryIdChange,
  onCustomCategoryNameChange,
  disabled,
  label = "Category",
  showRefresh = true,
  selectClassName,
}: TaskCategoryPickerProps) {
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchTaskCategoriesList();
      setCategories(list);
    } catch {
      toast.error("Could not load categories");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="task-category-select" className="text-[0.9375rem] text-slate-900">
          {label}
        </Label>
        {showRefresh ? (
          <button
            type="button"
            disabled={disabled || loading}
            onClick={() => {
              void load();
              toast.success("Categories refreshed");
            }}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 underline underline-offset-2 disabled:opacity-50"
          >
            Refresh
          </button>
        ) : null}
      </div>
      <select
        id="task-category-select"
        value={categoryId}
        disabled={disabled || loading}
        onChange={(e) => onCategoryIdChange(e.target.value)}
        className={
          selectClassName ??
          "flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-600/25 focus:border-blue-500"
        }
      >
        <option value="">Select a category</option>
        {categories.length > 0 ? (
          <>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={CUSTOM_CATEGORY_VALUE}>Can&apos;t find yours? Type your own</option>
          </>
        ) : (
          <option value="" disabled>
            {loading ? "Loading categories…" : "No categories available"}
          </option>
        )}
      </select>
      {categoryId === CUSTOM_CATEGORY_VALUE ? (
        <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <Label htmlFor="task-custom-category" className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            Your category name
          </Label>
          <Input
            id="task-custom-category"
            value={customCategoryName}
            onChange={(e) => onCustomCategoryNameChange(e.target.value)}
            placeholder="e.g., Event photography, Car wash"
            className="h-11 rounded-xl border-blue-200 focus-visible:ring-blue-500/30"
            maxLength={60}
            disabled={disabled}
          />
          <p className="text-xs text-slate-500">
            We&apos;ll match the closest category for now. Admins can add your suggestion to the main list.
          </p>
        </div>
      ) : null}
    </div>
  );
}
