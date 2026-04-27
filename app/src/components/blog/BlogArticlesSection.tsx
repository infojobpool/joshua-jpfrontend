"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildPublicBlogListUrl, parseBlogListResponse, type PublicBlogPostSummary } from "@/lib/publicBlog";
import { BlogArticleCard } from "./BlogArticleCard";
import { Button } from "@/components/ui/button";

const HOME_LIMIT = 12;

export function BlogArticlesSection() {
  const [posts, setPosts] = useState<PublicBlogPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(buildPublicBlogListUrl(HOME_LIMIT, 0));
        const json = (await res.json()) as unknown;
        const parsed = parseBlogListResponse(json);
        if (!cancelled) setPosts(parsed.posts);
      } catch {
        if (!cancelled) {
          setError("Could not load articles.");
          setPosts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="w-full bg-sky-50/50 py-12 dark:bg-slate-900/40 md:py-16">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-800" />
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-white/80 shadow dark:bg-slate-800/80" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || posts.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-sky-50/50 py-12 dark:bg-slate-900/40 md:py-16">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <h2 className="font-[family-name:var(--font-archivo)] text-3xl font-bold tracking-tight text-slate-900 dark:text-white md:text-4xl">
          Articles, stories and more
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
          Tips, updates, and stories from the JobPool community.
        </p>
        <ul className="mt-8 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.slug} className="min-w-0">
              <BlogArticleCard post={post} />
            </li>
          ))}
        </ul>
        <div className="mt-10 flex justify-center">
          <Button asChild className="h-12 min-w-[200px] rounded-xl bg-blue-600 px-8 text-base font-semibold shadow-md hover:bg-blue-700">
            <Link href="/blog/">Visit our blog</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
