export default function TaskLoading() {
  return (
    <div className="min-h-screen p-4 md:p-6 animate-in fade-in duration-200">
      <div className="mx-auto max-w-3xl">
        {/* Back / header skeleton */}
        <div className="h-10 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-6" />
        {/* Card skeleton */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
          <div className="h-7 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mb-4" />
          <div className="h-4 w-full bg-slate-100 dark:bg-slate-700 rounded animate-pulse mb-2" />
          <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-700 rounded animate-pulse mb-6" />
          <div className="flex gap-3 mb-6">
            <div className="h-9 w-20 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            <div className="h-9 w-24 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
          </div>
          <div className="h-24 bg-slate-100 dark:bg-slate-700 rounded-xl animate-pulse mb-6" />
          <div className="h-12 w-full max-w-xs bg-blue-200 dark:bg-slate-600 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
