import type { Metadata } from "next";
import { AdvancedMoneyToolsDashboard } from "@/components/dashboard/advanced-money-tools/advanced-money-tools-dashboard";
import { advancedMoneyToolsCopy } from "@/lib/dashboard/advanced-money-tools/copy";

export const metadata: Metadata = {
  title: advancedMoneyToolsCopy.title,
  description: advancedMoneyToolsCopy.description,
};

export default function AdvancedMoneyToolsPage() {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col bg-white">
      <AdvancedMoneyToolsDashboard />
    </div>
  );
}
