import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "10-minute writing test | JobPool",
  description: "Timed writing exercise for students.",
  robots: { index: false, follow: false },
};

export default function WritingTestLayout({ children }: { children: React.ReactNode }) {
  return children;
}
