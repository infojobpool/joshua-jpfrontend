import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryLandingPage } from "@/components/mainpage/pages/category-landing-page";
import { findCategoryBySlug } from "@/lib/categorySlug";
import { buildCategoryLandingMetadata } from "@/lib/seo/categoryLandingSeo";
import { fetchPublicCategoriesServer } from "@/lib/taskCategoriesServer";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateStaticParams() {
  const categories = await fetchPublicCategoriesServer();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await fetchPublicCategoriesServer();
  const category = findCategoryBySlug(categories, slug);
  if (!category) {
    return { title: "Category not found | JobPool" };
  }
  return buildCategoryLandingMetadata(category);
}

export default async function CategorySlugPage({ params }: PageProps) {
  const { slug } = await params;
  const categories = await fetchPublicCategoriesServer();
  const category = findCategoryBySlug(categories, slug);
  if (!category) notFound();

  const related = categories.filter((c) => c.id !== category.id).slice(0, 6);

  return <CategoryLandingPage category={category} related={related} />;
}
