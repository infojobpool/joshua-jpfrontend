// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  trailingSlash: true,
  // output: process.env.NODE_ENV === 'production' ? 'export' : undefined, // Temporarily disabled for dynamic routes
  distDir: 'out',
  // Handle dynamic routes for static export
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
  eslint: {
    ignoreDuringBuilds: isProd, // Skip ESLint in production builds
  },
  typescript: {
    ignoreBuildErrors: isProd, // Skip TypeScript errors in production builds
  },
  images: {
    unoptimized: process.env.NODE_ENV === 'production', // Disable optimization for static export
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
