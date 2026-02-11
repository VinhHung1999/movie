import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5001',
      },
      {
        protocol: 'https',
        hostname: 'movie-api.hungphu.work',
      },
    ],
  },
};

export default nextConfig;
