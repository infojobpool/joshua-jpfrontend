// Required for static export with dynamic routes - must be before imports
export async function generateStaticParams() {
  return [];
}

// Server component wrapper for static export
import ProfilePageClient from './ProfilePageClient';

export default function ProfilePage() {
  return <ProfilePageClient />;
}

