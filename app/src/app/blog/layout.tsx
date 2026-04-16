import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — JobPool",
  description: "Articles, updates, and stories from JobPool.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
