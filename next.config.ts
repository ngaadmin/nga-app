import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, must-revalidate",
          },
        ],
      },
      {
        source: "/assets/illustrations/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000",
          },
        ],
      },
    ];
  },
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
