import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
import { landingShareMetadata } from "@/lib/site-share-metadata";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
