import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'replicate.delivery',
      },
      {
        protocol: 'https',
        hostname: 'modelslab-bom.s3.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: 'hsdnkpafwlmgieovqrkq.supabase.co',
      },
    ],
  },
};

export default nextConfig;
