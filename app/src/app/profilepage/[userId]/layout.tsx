// Layout for dynamic route - required for static export
export async function generateStaticParams() {
  return [];
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

