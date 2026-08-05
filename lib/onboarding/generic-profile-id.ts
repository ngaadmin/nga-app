import {
  readPersisted,
  removePersisted,
  writePersisted,
} from "@/lib/dev/client-persist";

export const GENERIC_PROFILE_POOL_STORAGE_KEY = "nga_generic_profile_ids_v1";

type GenericProfilePool = {
  inUse: string[];
};

function readPool(): GenericProfilePool {
  if (typeof window === "undefined") {
    return { inUse: [] };
  }

  const raw = readPersisted(GENERIC_PROFILE_POOL_STORAGE_KEY);
  if (!raw) {
    return { inUse: [] };
  }

  try {
    const parsed = JSON.parse(raw) as GenericProfilePool;
    if (!Array.isArray(parsed?.inUse)) {
      return { inUse: [] };
    }
    return { inUse: parsed.inUse.filter((id) => typeof id === "string") };
  } catch {
    return { inUse: [] };
  }
}

function writePool(pool: GenericProfilePool): void {
  if (typeof window === "undefined") return;
  writePersisted(GENERIC_PROFILE_POOL_STORAGE_KEY, JSON.stringify(pool));
}

export function genericProfileIdToUsername(id: string): string {
  if (id.startsWith("#")) {
    return `Finnster${id}`;
  }
  return `Finnster${id.padStart(4, "0")}`;
}

function reserveId(inUseSet: Set<string>, id: string, pool: GenericProfilePool): string {
  pool.inUse.push(id);
  writePool(pool);
  inUseSet.add(id);
  return id;
}

function findRandomAvailableId(
  inUseSet: Set<string>,
  pool: GenericProfilePool,
  prefix: "" | "#",
): string | null {
  for (let attempt = 0; attempt < 128; attempt += 1) {
    const digits = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const id = `${prefix}${digits}`;
    if (!inUseSet.has(id)) {
      return reserveId(inUseSet, id, pool);
    }
  }

  for (let num = 0; num < 10000; num += 1) {
    const digits = num.toString().padStart(4, "0");
    const id = `${prefix}${digits}`;
    if (!inUseSet.has(id)) {
      return reserveId(inUseSet, id, pool);
    }
  }

  return null;
}

/** Reserves a generic Finnster profile ID and returns its display nickname. */
export function reserveGenericProfileId(): { id: string; username: string } {
  const pool = readPool();
  const inUseSet = new Set(pool.inUse);

  const standardId = findRandomAvailableId(inUseSet, pool, "");
  if (standardId) {
    return { id: standardId, username: genericProfileIdToUsername(standardId) };
  }

  const fallbackId = findRandomAvailableId(inUseSet, pool, "#");
  if (fallbackId) {
    return { id: fallbackId, username: genericProfileIdToUsername(fallbackId) };
  }

  throw new Error("No generic profile IDs are available.");
}

/** Returns a recycled generic ID when a guest profile converts to a saved account. */
export function releaseGenericProfileId(id: string): void {
  if (!id || typeof window === "undefined") return;

  const pool = readPool();
  pool.inUse = pool.inUse.filter((entry) => entry !== id);
  writePool(pool);
}

export function clearGenericProfilePool(): void {
  if (typeof window === "undefined") return;
  removePersisted(GENERIC_PROFILE_POOL_STORAGE_KEY);
}
