"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buildPublicBlogListUrl, parseBlogListResponse, type PublicBlogPostSummary } from "@/lib/publicBlog";
import { BlogArticleCard } from "@/components/blog/BlogArticleCard";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 24;

export default function BlogListPage() {
  const [posts, setPosts] = useState<PublicBlogPostSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (from: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(buildPublicBlogListUrl(PAGE_SIZE, from));
      const json = (await res.json()) as unknown;
      const parsed = parseBlogListResponse(json);
      setTotal(parsed.total);
      setPosts((prev) => (append ? [...prev, ...parsed.posts] : parsed.posts));
    } catch {
      setError("Something went wrong loading articles.");
      if (!append) setPosts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void load(0, false);
  }, [load]);

  const hasMore = posts.length < total;

  return (
    <div className="min-h-screen bg-sky-50/50 pb-20 pt-6 dark:bg-slate-950 md:pb-28 md:pt-10">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to home
        </Link>
        <header className="mt-6">
          <h1 className="font-[family-name:var(--font-archivo)] text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
            Articles, stories and more
          </h1>
          <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
            Browse updates, guides, and stories from JobPool.
          </p>
        </header>

        {loading ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-white/90 shadow dark:bg-slate-900/80" />
            ))}
          </div>
        ) : error ? (
          <p className="mt-10 text-center text-slate-600 dark:text-slate-400">{error}</p>
        ) : posts.length === 0 ? (
          <p className="mt-10 text-center text-slate-600 dark:text-slate-400">No articles yet. Check back soon.</p>
        ) : (
          <>
            <ul className="mt-10 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post.slug} className="min-w-0">
                  <BlogArticleCard post={post} />
                </li>
              ))}
            </ul>
            {hasMore ? (
              <div className="mt-10 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl border-slate-300 px-8 font-semibold dark:border-slate-600"
                  disabled={loadingMore}
                  onClick={() => void load(posts.length, true)}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : null}
            <p className="mt-6 text-center text-xs text-slate-500">
              Showing {posts.length} of {total || posts.length}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
