import type { Metadata } from "next";
import { copyMatrix } from "@/constants/copyMatrix";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.vault.title,
  description: copyMatrix.dashboard.vault.description,
};

export default function VaultLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
