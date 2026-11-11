import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VentureFlow } from "@/components/launchpad/venture-test/venture-flow";
import { isVentureTestEnabled } from "@/lib/launchpad/venture-test/venture-test-gate";
import { VENTURE_BLUEPRINTS } from "@/lib/launchpad/venture-blueprints";
import { liveVentureIds } from "@/lib/launchpad/venture-test/launchpad-home-data";
import { loadLaunchpadVenture } from "@/lib/launchpad/content/fetch-published";
import type { LaunchpadVentureView } from "@/lib/launchpad/content/venture-view";
import { LAUNCHPAD_VENTURE_ID_RE } from "@/lib/launchpad/content/check-payload";
import {
  VENTURE_TEST_SHORTCUT_DEFAULT_VENTURE,
  ventureTestShortcut,
} from "@/lib/launchpad/venture-test/venture-test-progress";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Launchpad venture flow (test)",
  description: "TEST-ONLY preview of the Launchpad venture flow. Not linked from the app.",
  robots: { index: false, follow: false },
};

/**
 * TEST-ONLY route for the Launchpad venture flow. Reachable on Vercel preview
 * deployments and local dev; 404 in production. Progress is a local stub.
 * The landing page is the Launchpad home (Business Ideas carousel);
 * `?venture=<id>` deep-links into a venture, `?reset=1` clears local progress.
 * Venture content (floors, plaques, doors, tasks, task screens) is loaded per
 * venture by loadLaunchpadVenture. Listed ventures read the database on a
 * Vercel preview (and whenever LAUNCHPAD_CONTENT_DB is explicitly on).
 * Production, local, and every unlisted venture stay on the bundled seed.
 * `?draft=<id|latest>` reads a draft version on preview only.
 *
 * Test shortcuts (this browser's localStorage only, never the database):
 * - `?rooftop=1` marks every task in the venture complete and opens the
 *   business-build celebration (the rooftop finish). "See my workbook" opens
 *   the handbook. "Back to Launchpad" returns to the business ideas home.
 * - `?buildComplete=1` is an alias of `?rooftop=1`.
 * - `?complete=all` marks every task complete and lands on the building, so
 *   the "Go to the rooftop" button shows.
 * - `?complete=<silver id>` (e.g. `?complete=l2-s1`) marks every silver up to
 *   and including that one complete and lands in the corridor of the next
 *   open silver (so `l2-s1` opens Level 2 with "Build your identity" current).
 * - `?level=<n>` (e.g. `?level=2`) marks every floor below n complete and
 *   lands in Level n's corridor.
 * - `?iconSet=<venture id>` (e.g. `friendship-bracelets`) shows that
 *   business's icon set in the logo picker, for ventures not yet in the app.
 * The shortcuts use `?venture=<id>` when given, otherwise the dog-walking
 * venture, and skip the building intro. Precedence: rooftop (buildComplete is the same), complete, level.
 * They replace completed tasks but keep saved answers; `?reset=1` runs first,
 * so `?reset=1&complete=all` still ends fully complete (with no answers).
 */
export default async function TestLaunchpadVenturePage({
  searchParams,
}: {
  searchParams: Promise<{
    venture?: string;
    reset?: string;
    draft?: string;
    rooftop?: string;
    buildComplete?: string;
    complete?: string;
    level?: string;
    iconSet?: string;
    cohort?: string;
  }>;
}) {
  if (!isVentureTestEnabled()) notFound();
  const params = await searchParams;
  const shortcut = ventureTestShortcut(params);
  const ventureId = params.venture ?? (shortcut ? VENTURE_TEST_SHORTCUT_DEFAULT_VENTURE : null);
  if (ventureId && !VENTURE_BLUEPRINTS.some((v) => v.id === ventureId)) notFound();
  const ventureTitles = Object.fromEntries(VENTURE_BLUEPRINTS.map((v) => [v.id, v.title]));
  const ids = [...new Set([...liveVentureIds(), ...(ventureId ? [ventureId] : [])])];
  const loads = await Promise.all(ids.map((id) => loadLaunchpadVenture(id, { draft: params.draft })));
  const ventures: Record<string, LaunchpadVentureView> = Object.fromEntries(
    ids.map((id, i) => {
      const load = loads[i]!;
      const view: LaunchpadVentureView = load.ok
        ? { ok: true, payload: load.venture, versionId: load.versionId, contentHash: load.contentHash, source: load.source }
        : { ok: false };
      return [id, view];
    }),
  );
  return (
    <VentureFlow
      initialVentureId={ventureId}
      ventureTitles={ventureTitles}
      ventures={ventures}
      reset={params.reset === "1"}
      shortcut={shortcut}
      iconSetOverride={params.iconSet && LAUNCHPAD_VENTURE_ID_RE.test(params.iconSet) ? params.iconSet : null}
      cohort={params.cohort === "explorer" || params.cohort === "pathfinder" || params.cohort === "maverick" ? params.cohort : null}
    />
  );
}
