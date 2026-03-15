// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Enable static export for Capacitor mobile apps
  output: process.env.BUILD_MOBILE === 'true' ? 'export' : undefined,
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: isProd, // Skip TypeScript errors in production builds
  },
  eslint: {
    ignoreDuringBuilds: isProd, // Skip ESLint errors in production builds
  },
  // Turbopack not available in Next.js 15
  images: {
    unoptimized: process.env.BUILD_MOBILE === 'true', // Disable image optimization for static export
    remotePatterns: [
      { protocol: 'https', hostname: 'jobpool.blr1.digitaloceanspaces.com' },
      { protocol: 'https', hostname: 'blr1.digitaloceanspaces.com' },
      { protocol: 'https', hostname: 'placeholder.com' } // temporary
    ]
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://jobpoolbackend.onrender.com/api/v1/:path*',
      },
      {
        source: '/api/v1/:path*/',
        destination: 'https://jobpoolbackend.onrender.com/api/v1/:path*/',
      },
    ];
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  }
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development to stop warnings
  // NetworkFirst for Next.js chunks - avoids stale cached JS on mobile/PWA after deploy
  runtimeCaching: require("./pwa-cache-config.js"),
})(nextConfig);
