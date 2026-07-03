import type { Metadata } from "next";
import TaskPageClient from "./TaskPageClient";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site";
import { buildTaskShareDescription, fetchPublicTaskForSeo } from "@/lib/publicTask";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamicParams = true;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const path = `/tasks/${encodeURIComponent(id)}`;
  const task = await fetchPublicTaskForSeo(id);

  if (!task) {
    return buildPublicMetadata({
      title: "Task on JobPool",
      description: "View this task and place your bid on JobPool — India's task marketplace.",
      path,
    });
  }

  const title = task.title;
  const description = buildTaskShareDescription(task);

  const ogImageUrl = `${getSiteUrl()}/tasks/${encodeURIComponent(id)}/opengraph-image`;

  return {
    ...buildPublicMetadata({
      title,
      description,
      path,
    }),
    openGraph: {
      type: "website",
      url: absoluteUrl(path),
      siteName: "JobPool",
      title: `${title} | JobPool`,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: task.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | JobPool`,
      description,
      images: [ogImageUrl],
    },
  };
}

export async function generateStaticParams() {
  return [];
}

export default function TaskPage() {
  return <TaskPageClient />;
}
