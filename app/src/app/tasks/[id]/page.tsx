import TaskPageClient from './TaskPageClient';

export async function generateStaticParams() {
  return [];
}

export default function TaskPage() {
  return <TaskPageClient />;
}

