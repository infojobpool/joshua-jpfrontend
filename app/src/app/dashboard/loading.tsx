export default function DashboardLoading() {
  return (
    <div className="min-h-screen p-4 md:p-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="h-9 w-44 bg-slate-100 rounded-xl animate-pulse" />
        <div className="h-10 w-10 bg-slate-100 rounded-full animate-pulse" />
      </div>
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-9 w-24 bg-slate-100 rounded-xl animate-pulse shrink-0" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="h-5 w-3/4 bg-slate-100 rounded-lg animate-pulse mb-3" />
            <div className="h-4 w-full bg-slate-50 rounded-lg animate-pulse mb-2" />
            <div className="h-4 w-2/3 bg-slate-50 rounded-lg animate-pulse mb-4" />
            <div className="flex gap-2">
              <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
