import type { Metadata, Viewport } from "next";
import { Inter, Poppins } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "NextGenAchievers",
    template: "%s | NextGenAchievers",
  },
  description:
    "Join NextGenAchievers - the free, fun way to master real-world money skills.",
  applicationName: "NextGenAchievers",
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
