import { createStaticPageLayoutMetadata } from "@/lib/seo/staticPageLayout";

export const generateMetadata = createStaticPageLayoutMetadata("/browse-tasks");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
