import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/dashboard/vault-v2",
        destination: "/dashboard/vault",
        permanent: true,
      },
      {
        source: "/dashboard/vault-v2/:path*",
        destination: "/dashboard/vault",
        permanent: true,
      },
      {
        source: "/dashboard/engine",
        destination: "/dashboard/launchpad",
        permanent: true,
      },
      {
        source: "/dashboard/engine/:path*",
        destination: "/dashboard/launchpad",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
