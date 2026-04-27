import { Suspense } from "react";
import { BrandedPageLoader } from "@/components/BrandedPageLoader";
import ProfilePageClient from "./ProfilePageClient";

export async function generateStaticParams() {
  return [];
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<BrandedPageLoader subtitle="Opening profile" />}>
      <ProfilePageClient />
    </Suspense>
  );
}

