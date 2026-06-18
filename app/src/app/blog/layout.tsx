import { createStaticPageLayoutMetadata } from "@/lib/seo/staticPageLayout";

export const generateMetadata = createStaticPageLayoutMetadata("/blog");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
