import type { LaunchpadVenturePayload } from "@/lib/launchpad/content/types";

/**
 * What the server page hands the client flow for one venture: the validated
 * payload and where it came from, or a failure (the flow shows the white
 * error screen). Client-safe: no server imports.
 */
export type LaunchpadVentureView =
  | {
      ok: true;
      payload: LaunchpadVenturePayload;
      versionId: string;
      contentHash: string;
      source: "current" | "draft" | "stale" | "seed";
    }
  | { ok: false };
