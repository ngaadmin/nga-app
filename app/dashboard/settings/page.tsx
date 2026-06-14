import type { Metadata } from "next";
import { HomeDashboard } from "@/components/dashboard/home-dashboard";
import { copyMatrix } from "@/constants/copyMatrix";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.settings.title,
  description: copyMatrix.dashboard.settings.description,
};

export default function SettingsPage() {
  return <HomeDashboard />;
}
