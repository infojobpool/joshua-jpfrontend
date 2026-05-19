"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { ArrowRight, Loader2, RefreshCw, Search } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { categoryIcon, categoryPalette } from "@/lib/categoryPresentation";
import { toast } from "sonner";

interface Category {
  category_id: string;
  category_name: string;
  status?: boolean;
  created_at?: string;
  job_count?: number;
}

type SortKey = "default" | "az" | "za" | "tasks";

export function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("default");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("get-all-categories/");
      if (response.data.status_code === 200) {
        setCategories(response.data.data ?? []);
      } else {
        toast.error(response.data.message || "Failed to fetch categories");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An error occurred while fetching categories"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = categories.filter((c) =>
      !q ? true : c.category_name.toLowerCase().includes(q)
    );
    switch (sortBy) {
      case "az":
        list = [...list].sort((a, b) => a.category_name.localeCompare(b.category_name));
        break;
      case "za":
        list = [...list].sort((a, b) => b.category_name.localeCompare(a.category_name));
        break;
      case "tasks":
        list = [...list].sort(
          (a, b) => (b.job_count ?? 0) - (a.job_count ?? 0)
        );
        break;
      default:
        break;
    }
    return list;
  }, [categories, searchQuery, sortBy]);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 py-12 md:py-16">
        <motion.div
          className="absolute -top-24 right-0 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl"
          aria-hidden
        />
        <div className="relative w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-4 border border-blue-100 bg-blue-50 text-blue-700">
              Task & service categories
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Browse categories
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              Pick a category to post a task or find help — same list for tasks and listings.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-20 pt-2">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500 sm:max-w-xs">
                {categories.length} categories · search and sort below
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:min-w-[240px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search categories..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                  <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default order</SelectItem>
                    <SelectItem value="az">A → Z</SelectItem>
                    <SelectItem value="za">Z → A</SelectItem>
                    <SelectItem value="tasks">Most tasks</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchCategories}
                  disabled={isLoading}
                  className="shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Refresh</span>
                </Button>
              </div>
            </div>

            {isLoading && categories.length === 0 ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-16 text-center">
                <p className="text-lg font-medium text-slate-700">No categories found</p>
                <p className="mt-1 text-sm text-slate-500">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCategories.map((category, index) => {
                  const Icon = categoryIcon(category.category_name);
                  const palette = categoryPalette(category.category_id);
                  const count = category.job_count ?? 0;
                  return (
                    <motion.div
                      key={category.category_id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                    >
                      <Link
                        href={`/browse-tasks?category=${encodeURIComponent(category.category_id)}`}
                        className={`group flex h-full flex-col rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${palette.border}`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-4 ${palette.bg} ${palette.ring}`}
                          >
                            <Icon className={`h-7 w-7 ${palette.text}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-blue-700">
                              {category.category_name}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                              Post a task or browse open jobs in this category.
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                          <Badge variant="secondary" className="font-normal">
                            {count} open task{count === 1 ? "" : "s"}
                          </Badge>
                          <span className="inline-flex items-center text-sm font-medium text-blue-600">
                            Browse
                            <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-t bg-slate-50 py-16">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Ready to get started?
              </h2>
              <p className="mt-4 text-lg text-slate-600">
                Post a task or offer a service in the category that fits you best.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/post-task">
                  <Button className="w-full bg-blue-600 px-8 py-6 text-lg hover:bg-blue-700 sm:w-auto">
                    Post a task
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    variant="outline"
                    className="w-full border-blue-600 px-8 py-6 text-lg text-blue-600 hover:bg-blue-50 sm:w-auto"
                  >
                    Become a tasker
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative h-[320px] md:h-[400px]">
              <Image
                src="/images/placeholder.svg"
                fill
                alt="JobPool categories"
                className="rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
