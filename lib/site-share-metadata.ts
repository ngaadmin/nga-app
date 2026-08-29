import type { Metadata } from "next";

const FALLBACK_SITE_URL = "https://nga-app-three.vercel.app";

export const LANDING_SHARE_TITLE = "NextGenAchievers";
export const LANDING_SHARE_DESCRIPTION = "Finally. A fun way to learn money skills.";
export const OG_SHARE_IMAGE_PATH = "/og/penny-jump-square.png";
export const OG_SHARE_IMAGE_SIZE = 512;

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
  const imageUrl = `${siteUrl}${OG_SHARE_IMAGE_PATH}`;

  return {
    metadataBase: new URL(`${siteUrl}/`),
    openGraph: {
      title: LANDING_SHARE_TITLE,
      description: LANDING_SHARE_DESCRIPTION,
      url: `${siteUrl}/`,
      siteName: LANDING_SHARE_TITLE,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: OG_SHARE_IMAGE_SIZE,
          height: OG_SHARE_IMAGE_SIZE,
          type: "image/png",
          alt: "Penny, your money-skills guide",
        },
      ],
    },
    twitter: {
      card: "summary",
      title: LANDING_SHARE_TITLE,
      description: LANDING_SHARE_DESCRIPTION,
      images: [imageUrl],
    },
  };
}
