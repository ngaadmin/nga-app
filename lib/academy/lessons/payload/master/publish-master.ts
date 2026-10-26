import type { MasterModule, MasterRowIssue } from "@/lib/academy/lessons/payload/master/read-master";

export type MasterPublishPayload = {
  explorer: MasterModule["byCohort"]["explorer"];
  pathfinder: MasterModule["byCohort"]["pathfinder"];
  maverick: MasterModule["byCohort"]["maverick"];
};

export type MasterPublishStore = {
  currentHash: () => Promise<string | null>;
  save: (hash: string, payload: MasterPublishPayload) => Promise<void>;
};

/**
 * A bad row publishes nothing, so the current pointer stays on the last good version.
 * The same hash does not insert another row.
 */
export async function publishMasterModule(
  module: MasterModule,
  store?: MasterPublishStore,
): Promise<{ ok: boolean; wrote: boolean; issues: MasterRowIssue[] }> {
  if (module.issues.length > 0 || !module.contentHash) {
    return { ok: false, wrote: false, issues: module.issues };
  }
  if (!store) return { ok: true, wrote: false, issues: [] };
  const current = await store.currentHash();
  if (current === module.contentHash) return { ok: true, wrote: false, issues: [] };
  await store.save(module.contentHash, {
    explorer: module.byCohort.explorer,
    pathfinder: module.byCohort.pathfinder,
    maverick: module.byCohort.maverick,
  });
  return { ok: true, wrote: true, issues: [] };
}
