import type { Metadata } from "next";
import { copyMatrix } from "@/constants/copyMatrix";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.launchpad.title,
  description: copyMatrix.dashboard.launchpad.description,
};

export default function LaunchpadLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
