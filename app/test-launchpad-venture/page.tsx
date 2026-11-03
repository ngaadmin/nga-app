import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VentureFlow } from "@/components/launchpad/venture-test/venture-flow";
import { isVentureTestEnabled } from "@/lib/launchpad/venture-test/venture-test-gate";
import { VENTURE_BLUEPRINTS } from "@/lib/launchpad/venture-blueprints";

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
 */
export default async function TestLaunchpadVenturePage({
  searchParams,
}: {
  searchParams: Promise<{ venture?: string; reset?: string }>;
}) {
  if (!isVentureTestEnabled()) notFound();
  const params = await searchParams;
  const ventureId = params.venture ?? null;
  if (ventureId && !VENTURE_BLUEPRINTS.some((v) => v.id === ventureId)) notFound();
  const ventureTitles = Object.fromEntries(VENTURE_BLUEPRINTS.map((v) => [v.id, v.title]));
  return <VentureFlow initialVentureId={ventureId} ventureTitles={ventureTitles} reset={params.reset === "1"} />;
}
