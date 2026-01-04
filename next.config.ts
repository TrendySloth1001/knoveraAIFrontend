import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api/ai/:path*',
        destination: 'http://localhost:3001/api/ai/:path*', // Proxy to Backend
      },
    ];
  },
};

export default nextConfig;
