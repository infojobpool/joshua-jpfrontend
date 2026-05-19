import { Card, CardContent } from "@/components/ui/card";

export function DashboardSkeleton({ isMobile = false }: { isMobile?: boolean }) {
  const TaskCardSkeleton = () => (
    <Card className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/50 rounded-2xl overflow-hidden">
      <div className={isMobile ? "p-4" : "p-5"}>
        <div className="flex justify-between items-start mb-3">
          <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-600 rounded animate-pulse" />
          <div className="h-5 w-16 bg-slate-100 dark:bg-slate-600 rounded-full animate-pulse" />
        </div>
        <div className="h-4 w-full bg-slate-100 dark:bg-slate-600 rounded animate-pulse mb-2" />
        <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-600 rounded animate-pulse mb-4" />
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-slate-200 dark:bg-slate-600 rounded-lg animate-pulse" />
          <div className="h-4 w-24 bg-slate-100 dark:bg-slate-600 rounded animate-pulse" />
        </div>
        <div className="mt-4 h-10 w-full bg-slate-100 dark:bg-slate-600 rounded-lg animate-pulse" />
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen p-4 md:p-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="h-9 w-44 bg-slate-200 dark:bg-slate-600 rounded-xl animate-pulse" />
        <div className="h-10 w-10 bg-slate-200 dark:bg-slate-600 rounded-full animate-pulse" />
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 bg-slate-100 dark:bg-slate-600 rounded-xl animate-pulse shrink-0" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
