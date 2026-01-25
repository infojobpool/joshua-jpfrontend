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
  // Allow mobile network access (Next.js 15 compatible)
  experimental: {
    // allowedDevOrigins will be available in future Next.js versions
  }
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Disable PWA in development to stop warnings
})(nextConfig);
