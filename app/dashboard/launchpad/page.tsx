import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VentureFlow } from "@/components/launchpad/venture-test/venture-flow";
import { copyMatrix } from "@/constants/copyMatrix";
import { DASHBOARD_DEFAULT_HREF } from "@/lib/dashboard/navigation";
import { launchpadLearnerMayEnter, launchpadViewerIsGuest, launchpadViewerIsParent } from "@/lib/launchpad/dashboard-access";
import { LaunchpadDashboard } from "@/components/dashboard/launchpad/launchpad-dashboard";
import { loadDashboardLaunchpadVenture } from "@/lib/launchpad/content/dashboard-source";
import type { LaunchpadVentureView } from "@/lib/launchpad/content/venture-view";
import { VENTURE_BLUEPRINTS } from "@/lib/launchpad/venture-blueprints";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.launchpad.title,
  description: copyMatrix.dashboard.launchpad.description,
};

const DOG_WALKING_ID = "dog-walking";

/**
 * Launchpad route. Query shortcuts (?complete, ?level, ?rooftop, ?reset,
 * ?venture, ?draft) are not read. Content is loadDashboardLaunchpadVenture.
 * An active learner gets the full flow. A guest (no Auth user) gets the same
 * shop front and can play Level 1; Level 2 asks them to create an account.
 */
export default async function LaunchpadPage() {
  let guest = false;
  if (!(await launchpadLearnerMayEnter())) {
    // A parent has the Launchpad tab but is not a learner: the same "coming
    // soon" page they see today.
    if (await launchpadViewerIsParent()) {
      return (
        <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-md flex-1 flex-col bg-white">
          <LaunchpadDashboard />
        </div>
      );
    }
    // A guest may explore. Any other signed-in account (pending or declined
    // child, teacher) goes back to the dashboard.
    guest = await launchpadViewerIsGuest();
    if (!guest) redirect(DASHBOARD_DEFAULT_HREF);
  }

  const load = await loadDashboardLaunchpadVenture(DOG_WALKING_ID);
  const view: LaunchpadVentureView = load.ok
    ? {
        ok: true,
        payload: load.venture,
        versionId: load.versionId,
        contentHash: load.contentHash,
        source: load.source,
      }
    : { ok: false };
  const title = VENTURE_BLUEPRINTS.find((venture) => venture.id === DOG_WALKING_ID)?.title ?? DOG_WALKING_ID;

  return (
    <VentureFlow
      live
      guest={guest}
      initialVentureId={null}
      ventureTitles={{ [DOG_WALKING_ID]: title }}
      ventures={{ [DOG_WALKING_ID]: view }}
      reset={false}
    />
  );
}
