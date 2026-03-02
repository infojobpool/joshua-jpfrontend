import Image from "next/image";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-5 animate-in fade-in duration-300">
        <div className="relative w-16 h-16 md:w-20 md:h-20">
          <div 
            className="absolute inset-0 rounded-full border border-slate-200 border-t-blue-500 animate-spin" 
            style={{ animationDuration: "0.85s" }} 
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/images/new-logo.png"
              alt="JobPool"
              width={44}
              height={44}
              className="object-contain w-11 h-11 md:w-12 md:h-12"
              priority
            />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-loading-dot" style={{ animationDelay: "0ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-loading-dot" style={{ animationDelay: "200ms" }} />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-loading-dot" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    </div>
  );
}
  