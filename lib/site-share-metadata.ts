import type { Metadata } from "next";

const FALLBACK_SITE_URL = "https://nga-app-three.vercel.app";

export const LANDING_SHARE_TITLE = "NextGenAchievers";
export const LANDING_SHARE_DESCRIPTION = "Finally. A fun way to learn money skills.";

export function getCanonicalSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      // fall through
    }
  }
  return FALLBACK_SITE_URL;
}

export function landingShareMetadata(): Pick<
  Metadata,
  "metadataBase" | "openGraph" | "twitter"
> {
  const siteUrl = getCanonicalSiteUrl();

  return {
    metadataBase: new URL(`${siteUrl}/`),
    openGraph: {
      title: LANDING_SHARE_TITLE,
      description: LANDING_SHARE_DESCRIPTION,
      url: `${siteUrl}/`,
      siteName: LANDING_SHARE_TITLE,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: LANDING_SHARE_TITLE,
      description: LANDING_SHARE_DESCRIPTION,
    },
  };
}
