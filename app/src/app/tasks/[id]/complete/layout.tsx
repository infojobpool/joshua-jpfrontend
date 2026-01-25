// Layout for dynamic route - required for static export
export async function generateStaticParams() {
  return [];
}

export default function CompleteTaskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

