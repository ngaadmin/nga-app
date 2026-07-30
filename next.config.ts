import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/dashboard/vault",
        destination: "/dashboard/vault-v2",
        permanent: true,
      },
      {
        source: "/dashboard/vault/:path*",
        destination: "/dashboard/vault-v2",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
