import { redirect } from "next/navigation";
import { LaunchpadDashboard } from "@/components/dashboard/launchpad/launchpad-dashboard";
import { SHOW_LAUNCHPAD } from "@/lib/dashboard/feature-flags";
import { DASHBOARD_DEFAULT_HREF } from "@/lib/dashboard/navigation";

export default function LaunchpadPage() {
  if (!SHOW_LAUNCHPAD) {
    redirect(DASHBOARD_DEFAULT_HREF);
  }

  return <LaunchpadDashboard />;
}
