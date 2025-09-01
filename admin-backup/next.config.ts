// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   /* config options here */
// };

// export default nextConfig;

import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: isProd, // Skip ESLint in production builds
  },
  typescript: {
    ignoreBuildErrors: isProd, // Skip TypeScript errors in production builds
  },
  images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'jobpool.blr1.digitaloceanspaces.com' },
    { protocol: 'https', hostname: 'blr1.digitaloceanspaces.com' },
    { protocol: 'https', hostname: 'placeholder.com' } // temporary
  ]
},  

};

export default nextConfig;
