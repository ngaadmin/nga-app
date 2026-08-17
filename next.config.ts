import type { NextConfig } from "next";
import { SHOW_LAUNCHPAD } from "./lib/dashboard/feature-flags";

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
    ];
  },
  async redirects() {
    const vaultRedirects = [
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
    ];

    if (!SHOW_LAUNCHPAD) {
      return [
        ...vaultRedirects,
        {
          source: "/dashboard/launchpad",
          destination: "/dashboard/academy",
          permanent: false,
        },
        {
          source: "/dashboard/launchpad/:path*",
          destination: "/dashboard/academy",
          permanent: false,
        },
        {
          source: "/dashboard/engine",
          destination: "/dashboard/academy",
          permanent: false,
        },
        {
          source: "/dashboard/engine/:path*",
          destination: "/dashboard/academy",
          permanent: false,
        },
      ];
    }

    return [
      ...vaultRedirects,
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
