import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchPublicBlogPostBySlugServer, fetchPublicBlogPostSummariesServer } from "@/lib/publicBlog";
import { BlogMarkdown } from "@/components/blog/BlogMarkdown";
import { resolveApiMediaUrl } from "@/lib/profileImage";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const { posts } = await fetchPublicBlogPostSummariesServer(200, 0);
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = await fetchPublicBlogPostBySlugServer(slug);
  if (!post) notFound();

  const hero = post.hero_image_url ? resolveApiMediaUrl(post.hero_image_url) : null;

  return (
    <article className="min-h-screen bg-white pb-16 pt-6 dark:bg-slate-950 md:pb-24 md:pt-10">
      <div className="mx-auto max-w-3xl px-4 md:px-6">
        <Link
          href="/blog/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600 dark:text-slate-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All articles
        </Link>

        <header className="mt-8">
          <h1 className="font-[family-name:var(--font-archivo)] text-3xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white md:text-4xl">
            {post.title}
          </h1>
          {post.excerpt ? (
            <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-400">{post.excerpt}</p>
          ) : null}
        </header>

        {hero ? (
          <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={hero} alt="" className="max-h-[min(70vh,480px)] w-full object-contain" />
          </div>
        ) : null}

        <div className="mt-10 border-t border-slate-100 pt-10 dark:border-slate-800">
          <BlogMarkdown markdown={post.body_markdown} />
        </div>
      </div>
    </article>
  );
}
