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
 */
export default async function TestLaunchpadVenturePage({
  searchParams,
}: {
  searchParams: Promise<{ venture?: string; reset?: string }>;
}) {
  if (!isVentureTestEnabled()) notFound();
  const params = await searchParams;
  const ventureId = params.venture ?? "lemonade-stand";
  const blueprint = VENTURE_BLUEPRINTS.find((v) => v.id === ventureId);
  if (!blueprint) notFound();
  return <VentureFlow ventureId={ventureId} ventureTitle={blueprint.title} reset={params.reset === "1"} />;
}
