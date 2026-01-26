import CompletePageClient from './CompletePageClient';

// Route segment config for static export
export const dynamicParams = false;
export const dynamic = 'force-static';

export async function generateStaticParams() {
  return [];
}

export default function CompletePage() {
  return <CompletePageClient />;
}

