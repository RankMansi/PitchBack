import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // WebRTC/LiveKit sessions break when React Strict Mode double-mounts effects in dev.
  reactStrictMode: false,
  transpilePackages: ['@d-id/client-sdk'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'expressive-avatars.d-id.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
