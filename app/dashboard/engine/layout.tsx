import type { Metadata } from "next";
import { copyMatrix } from "@/constants/copyMatrix";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.engine.title,
  description: copyMatrix.dashboard.engine.description,
};

export default function EngineLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
