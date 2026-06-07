import type { Metadata } from "next";
import { HomeDashboard } from "@/components/dashboard/home-dashboard";
import { copyMatrix } from "@/constants/copyMatrix";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.home.title,
  description: copyMatrix.dashboard.home.description,
};

export default function HomePage() {
  return <HomeDashboard />;
}
