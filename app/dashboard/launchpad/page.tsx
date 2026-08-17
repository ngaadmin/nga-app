import type { Metadata } from "next";
import { LaunchpadDashboard } from "@/components/dashboard/launchpad/launchpad-dashboard";
import { copyMatrix } from "@/constants/copyMatrix";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.launchpad.title,
  description: copyMatrix.dashboard.launchpad.description,
};

export default function LaunchpadPage() {
  return (
    <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-md flex-1 flex-col bg-white">
      <LaunchpadDashboard />
    </div>
  );
}
