import { checkLaunchpadVenturePayload } from "@/lib/launchpad/content/check-payload";
import { launchpadContentHash } from "@/lib/launchpad/content/content-hash";
import type { LaunchpadVenturePayload } from "@/lib/launchpad/content/types";

/** Same contract as Academy's MasterPublishStore. */
export type LaunchpadPublishStore = {
  /** Id of a stored version of this venture with this hash, or null. */
  findByHash: (hash: string) => Promise<string | null>;
  /** Insert a draft version. Never moves the current pointer. Returns the new id. */
  saveDraft: (hash: string, payload: LaunchpadVenturePayload) => Promise<string>;
};

export type LaunchpadPublishResult = {
  ok: boolean;
  wrote: boolean;
  versionId?: string;
  contentHash?: string;
  blocked: string[];
};

/**
 * Progress is keyed by task id, so a task must not move to another bronze.
 * The Launchpad version of Academy's renumberedLessons check.
 */
export function movedTasks(previous: LaunchpadVenturePayload | null, next: LaunchpadVenturePayload): string[] {
  if (!previous) return [];
  const before = taskHomes(previous);
  const problems: string[] = [];
  for (const [taskId, bronzeId] of taskHomes(next)) {
    const was = before.get(taskId);
    if (was !== undefined && was !== bronzeId) problems.push(`Task ${taskId} moved from ${was} to ${bronzeId}.`);
  }
  return problems;
}

function taskHomes(payload: LaunchpadVenturePayload): Map<string, string> {
  const homes = new Map<string, string>();
  for (const floor of payload.floors)
    for (const silver of floor.silvers)
      for (const bronze of silver.bronzes) for (const task of bronze.tasks) homes.set(task.id, bronze.id);
  return homes;
}

/**
 * Store a draft. A malformed payload or a moved task publishes nothing. The
 * same hash as a stored version does not insert again. Promoting a draft to
 * current is a separate, explicit step (an update of launchpad_venture_current).
 */
export async function publishLaunchpadDraft(
  payload: unknown,
  options: { ventureId: string; previous?: LaunchpadVenturePayload | null; store?: LaunchpadPublishStore },
): Promise<LaunchpadPublishResult> {
  const check = checkLaunchpadVenturePayload(payload, options.ventureId);
  if (!check.ok) return { ok: false, wrote: false, blocked: [check.reason] };
  const blocked = movedTasks(options.previous ?? null, check.payload);
  if (blocked.length > 0) return { ok: false, wrote: false, blocked };
  const contentHash = launchpadContentHash(check.payload);
  if (!options.store) return { ok: true, wrote: false, contentHash, blocked: [] };
  const existing = await options.store.findByHash(contentHash);
  if (existing) return { ok: true, wrote: false, versionId: existing, contentHash, blocked: [] };
  const versionId = await options.store.saveDraft(contentHash, check.payload);
  return { ok: true, wrote: true, versionId, contentHash, blocked: [] };
}
