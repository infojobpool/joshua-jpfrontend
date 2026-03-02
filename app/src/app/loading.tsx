import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      {/* Mobile: logo + bouncing dots */}
      <div className="md:hidden flex flex-col items-center gap-8 mobile-loading-logo">
        <div className="relative w-20 h-20">
          <Image
            src="/images/new-logo.png"
            alt="JobPool"
            width={80}
            height={80}
            className="object-contain"
            priority
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "120ms" }} />
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: "240ms" }} />
        </div>
        <p className="text-xs text-slate-500 font-medium">Loading...</p>
      </div>
      {/* Desktop: spinner */}
      <div className="hidden md:flex flex-col items-center gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
  