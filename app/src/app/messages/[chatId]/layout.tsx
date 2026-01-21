// Layout for dynamic route - required for static export
export function generateStaticParams() {
  return [];
}

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

