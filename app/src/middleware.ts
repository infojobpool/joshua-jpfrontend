import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Apex `jobpool.in` often has a Vercel/domain-level **redirect to www**, which sends
 * `/.well-known/assetlinks.json` through a **307** — Chrome/TWA verification then fails (blue toolbar).
 *
 * This middleware runs **only after** traffic reaches the Next deployment. You must turn **off**
 * the global “redirect apex → www” in **Vercel → Domains** so requests hit Next; then:
 * - `/.well-known/*` on apex → internal rewrite to www (response **200** on jobpool.in)
 * - everything else on apex → **308** to www.jobpool.in
 */
export function middleware(request: NextRequest) {
  const rawHost = request.headers.get("host") ?? "";
  const host = rawHost.split(":")[0]?.toLowerCase();
  if (host !== "jobpool.in") {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/.well-known/")) {
    const url = request.nextUrl.clone();
    url.hostname = "www.jobpool.in";
    url.protocol = "https";
    return NextResponse.rewrite(url);
  }

  const dest = new URL(request.nextUrl.pathname + request.nextUrl.search, "https://www.jobpool.in");
  return NextResponse.redirect(dest, 308);
}

export const config = {
  matcher: ["/((?!_next).*)", "/"],
};
