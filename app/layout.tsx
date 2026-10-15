import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import { Suspense } from "react";
import { RecordingIntroQueryFlag } from "@/components/recording/recording-intro-query-flag";
import { RECORDING_SUPPRESS_INTRO_FLAG_KEY } from "@/lib/recording/suppress-intro-flag";
import { landingShareMetadata } from "@/lib/site-share-metadata";
import "./globals.css";

/**
 * System faces that include U+2013 EN DASH. Quoted multi-word names are
 * inserted into the font-family list as-is by next/font.
 * `local("Arial")` is not used: that face fails where Arial is not installed,
 * and a latin-1-only face would draw the en dash as a missing-glyph box.
 * The list is repeated because next/font only reads a literal.
 */
const poppins = localFont({
  src: [
    { path: "./fonts/poppins-latin-600.woff2", weight: "600", style: "normal" },
    { path: "./fonts/poppins-latin-700.woff2", weight: "700", style: "normal" },
    { path: "./fonts/poppins-latin-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
  adjustFontFallback: false,
  fallback: [
    "ui-sans-serif",
    "system-ui",
    '"Segoe UI"',
    "Roboto",
    '"Helvetica Neue"',
    "Arial",
    '"Noto Sans"',
    '"Liberation Sans"',
    "sans-serif",
  ],
  declarations: [{ prop: "font-family", value: "NgaPoppins" }],
});

const inter = localFont({
  src: [
    { path: "./fonts/inter-latin-400.woff2", weight: "400", style: "normal" },
    { path: "./fonts/inter-latin-500.woff2", weight: "500", style: "normal" },
    { path: "./fonts/inter-latin-600.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
  adjustFontFallback: false,
  fallback: [
    "ui-sans-serif",
    "system-ui",
    '"Segoe UI"',
    "Roboto",
    '"Helvetica Neue"',
    "Arial",
    '"Noto Sans"',
    '"Liberation Sans"',
    "sans-serif",
  ],
  declarations: [{ prop: "font-family", value: "NgaInter" }],
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
    icon: [
      { url: "/nga-icon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
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
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <body className="font-sans antialiased overflow-x-hidden max-w-full">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.addEventListener('popstate',function(event){var handler=window.__ngaGuestBack;if(typeof handler==='function')handler(event);},true);",
          }}
        />
        {/* TODO: remove after recordings — run before client redirects drop the query. */}
        <Script id="recording-suppress-intro" strategy="beforeInteractive">
          {`try{var q=new URLSearchParams(location.search);if(q.get("recording")==="1")sessionStorage.setItem(${JSON.stringify(RECORDING_SUPPRESS_INTRO_FLAG_KEY)},"1")}catch(e){}`}
        </Script>
        {children}
        {/* TODO: remove after recordings */}
        <Suspense fallback={null}>
          <RecordingIntroQueryFlag />
        </Suspense>
        <div id="overlay-root" aria-hidden="true" />
        <div id="modal-root" />
        <div id="toast-root" aria-hidden="true" />
      </body>
    </html>
  );
}
