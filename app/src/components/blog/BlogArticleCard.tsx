import Link from "next/link";
import type { PublicBlogPostSummary } from "@/lib/publicBlog";
import { resolveApiMediaUrl } from "@/lib/profileImage";

type Props = {
  post: PublicBlogPostSummary;
};

export function BlogArticleCard({ post }: Props) {
  const href = `/blog/${encodeURIComponent(post.slug)}/`;
  const img = post.hero_image_url ? resolveApiMediaUrl(post.hero_image_url) : null;

  return (
    <article className="flex min-w-0 w-full max-w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md ring-1 ring-slate-900/[0.04] transition hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/40">
      <Link
        href={href}
        className="block w-full min-w-0 shrink-0 bg-gradient-to-br from-slate-100 to-sky-50/50 dark:from-slate-800 dark:to-slate-900"
      >
        <div className="relative aspect-[16/10] min-h-[200px] w-full min-w-0 max-w-full overflow-hidden sm:min-h-[220px]">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt=""
              className="h-full w-full max-w-full object-cover object-center"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-400">
              JobPool
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <Link href={href}>
          <h2 className="text-lg font-bold leading-snug tracking-tight text-slate-900 dark:text-white sm:text-xl">
            {post.title}
          </h2>
        </Link>
        {post.excerpt ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{post.excerpt}</p>
        ) : null}
        <div className="mt-auto pt-4">
          <Link
            href={href}
            className="text-sm font-semibold text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Read more
          </Link>
        </div>
      </div>
    </article>
  );
}
