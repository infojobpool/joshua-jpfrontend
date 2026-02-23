export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-4 md:p-6 animate-in fade-in duration-200">
      {/* Header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-10 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
      </div>
      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 bg-muted rounded-md animate-pulse shrink-0" />
        ))}
      </div>
      {/* Content cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-4">
            <div className="h-5 w-3/4 bg-muted rounded animate-pulse mb-3" />
            <div className="h-4 w-full bg-muted/80 rounded animate-pulse mb-2" />
            <div className="h-4 w-2/3 bg-muted/80 rounded animate-pulse mb-4" />
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-muted rounded animate-pulse" />
              <div className="h-8 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
