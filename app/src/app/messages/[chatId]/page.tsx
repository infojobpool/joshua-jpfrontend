import ChatPageClient from './ChatPageClient';

export async function generateStaticParams() {
  return [];
}

export default function ChatPage() {
  return <ChatPageClient />;
}

