import ProfilePageClient from "./ProfilePageClient";

export async function generateStaticParams() {
  return [];
}

export default function ProfilePage() {
  return <ProfilePageClient />;
}

