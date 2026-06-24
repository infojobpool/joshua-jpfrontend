"use client";

import Link from "next/link";
import { ArrowRight, ClipboardList, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { categoryIcon, categoryPalette } from "@/lib/categoryPresentation";
import type { PublicCategory } from "@/lib/categorySlug";

type CategoryLandingPageProps = {
  category: PublicCategory;
  related: PublicCategory[];
};

export function CategoryLandingPage({ category, related }: CategoryLandingPageProps) {
  const Icon = categoryIcon(category.name);
  const palette = categoryPalette(category.id);
  const count = category.job_count ?? 0;
  const browseHref = `/browse?category=${encodeURIComponent(category.slug)}`;
  const postHref = `/post-task?category=${encodeURIComponent(category.slug)}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 py-12 md:py-16">
        <div className="container mx-auto max-w-4xl px-4 md:px-6">
          <Link
            href="/categories"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← All categories
          </Link>
          <div className="mt-6 flex flex-col items-center text-center">
            <div
              className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ring-4 ${palette.bg} ${palette.ring}`}
            >
              <Icon className={`h-8 w-8 ${palette.text}`} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
              {category.name}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              Post a {category.name.toLowerCase()} task or browse open jobs from verified taskers on
              JobPool. Compare offers, hire with confidence, and pay securely.
            </p>
            {count > 0 ? (
              <p className="mt-2 text-sm text-slate-500">
                {count} open task{count === 1 ? "" : "s"} in this category right now
              </p>
            ) : null}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link href={postHref}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Post a {category.name.toLowerCase()} task
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href={browseHref}>
                  <Search className="mr-2 h-4 w-4" />
                  Browse open tasks
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-4xl px-4 pb-16 md:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-xl font-semibold text-slate-900">How it works for {category.name}</h2>
          <ol className="mt-4 space-y-3 text-slate-600">
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                1
              </span>
              <span>Describe your {category.name.toLowerCase()} task and set your budget.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                2
              </span>
              <span>Receive offers from taskers and review their profiles and ratings.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                3
              </span>
              <span>Hire the best fit and pay securely through JobPool when the work is done.</span>
            </li>
          </ol>
          <div className="mt-6 flex flex-wrap gap-2 text-sm">
            <Link href="/how-it-works" className="font-medium text-blue-600 hover:underline">
              How JobPool works
            </Link>
            <span className="text-slate-300">·</span>
            <Link href="/pricing" className="font-medium text-blue-600 hover:underline">
              Pricing & fees
            </Link>
            <span className="text-slate-300">·</span>
            <Link href="/for-taskers" className="font-medium text-blue-600 hover:underline">
              Earn as a tasker
            </Link>
          </div>
        </div>

        {related.length > 0 ? (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Related categories</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {related.map((c) => {
                const RelIcon = categoryIcon(c.name);
                const relPalette = categoryPalette(c.id);
                return (
                  <Link
                    key={c.id}
                    href={`/categories/${encodeURIComponent(c.slug)}`}
                    className={`group flex items-center gap-3 rounded-xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${relPalette.border}`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${relPalette.bg}`}
                    >
                      <RelIcon className={`h-5 w-5 ${relPalette.text}`} />
                    </div>
                    <span className="min-w-0 flex-1 font-medium text-slate-900 group-hover:text-blue-700">
                      {c.name}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-blue-600" />
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
