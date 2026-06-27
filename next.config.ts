import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mopkysmpqwkzunzdgkdd.supabase.co",
      },
    ],
  },
};

export default nextConfig;
