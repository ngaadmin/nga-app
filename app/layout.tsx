import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { landingShareMetadata } from "@/lib/site-share-metadata";
import "./globals.css";

const poppins = localFont({
  src: [
    { path: "./fonts/poppins-latin-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/poppins-latin-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/poppins-latin-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

const inter = localFont({
  src: [
    { path: "./fonts/inter-latin-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-latin-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/inter-latin-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

const share = landingShareMetadata();

export const metadata: Metadata = {
  metadataBase: share.metadataBase,
  title: {
    default: "NextGenAchievers",
    template: "%s | NextGenAchievers",
  },
  description:
    "Join NextGenAchievers - the free, fun way to master real-world money skills.",
  applicationName: "NextGenAchievers",
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: share.openGraph,
  twitter: share.twitter,
};

export const viewport: Viewport = {
  // shrink-to-fit=no stops iOS from scaling a wide layout down to ~4–6pt type.
  width: "device-width, shrink-to-fit=no",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#031F82",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${inter.variable} font-sans antialiased overflow-x-hidden max-w-full`}
      >
        {children}
        <div id="overlay-root" aria-hidden="true" />
        <div id="modal-root" aria-hidden="true" />
        <div id="toast-root" aria-hidden="true" />
      </body>
    </html>
  );
}
