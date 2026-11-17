import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VentureFlow } from "@/components/launchpad/venture-test/venture-flow";
import { copyMatrix } from "@/constants/copyMatrix";
import { DASHBOARD_DEFAULT_HREF } from "@/lib/dashboard/navigation";
import { launchpadLearnerMayEnter } from "@/lib/launchpad/dashboard-access";
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
 * Signed-in learner Launchpad. Query shortcuts (?complete, ?level, ?rooftop,
 * ?reset, ?venture, ?draft) are not read. Content is loadDashboardLaunchpadVenture.
 */
export default async function LaunchpadPage() {
  if (!(await launchpadLearnerMayEnter())) redirect(DASHBOARD_DEFAULT_HREF);

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
      initialVentureId={null}
      ventureTitles={{ [DOG_WALKING_ID]: title }}
      ventures={{ [DOG_WALKING_ID]: view }}
      reset={false}
    />
  );
}
