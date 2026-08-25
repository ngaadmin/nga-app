import { roundAudAmount, SAVINGS_JAR_ID } from "@/lib/dashboard/destination-jars";
import type { DestinationJar } from "@/lib/dashboard/destination-jars";
import {
  isSavingsGoalMoveTarget,
  type CustomVaultBucketPersisted,
  type VaultBucket,
  type VaultBucketId,
} from "@/lib/dashboard/vault-buckets";
import type { SavingsGoal, SavingsGoalId } from "@/lib/dashboard/savings-goals";

export type VaultTransferLocationId = VaultBucketId | SavingsGoalId | "pool";

export type VaultTransferLocation = {
  id: VaultTransferLocationId;
  label: string;
  balance: number;
};

export type VaultTransferWalletState = {
  moneyToAllocate: number;
  jars: readonly DestinationJar[];
  customBuckets: readonly CustomVaultBucketPersisted[];
  savingsGoals: readonly SavingsGoal[];
  vaultBuckets: readonly VaultBucket[];
};

export type VaultTransferNextState = {
  moneyToAllocate: number;
  jars: DestinationJar[];
  customBuckets: CustomVaultBucketPersisted[];
  savingsGoals: SavingsGoal[];
};

function bucketLocation(bucket: VaultBucket): VaultTransferLocation {
  return {
    id: bucket.id,
    label: `${bucket.emoji} ${bucket.name}`,
    balance: bucket.balance,
  };
}

function goalLocation(goal: SavingsGoal): VaultTransferLocation {
  return {
    id: goal.id,
    label: `${goal.emoji} ${goal.name}`,
    balance: goal.balance,
  };
}

/** Budget jars first; Save Jar last so it is not the default move target. */
function sortBucketDestinations(
  buckets: readonly VaultBucket[],
): VaultTransferLocation[] {
  return [...buckets]
    .sort((left, right) => {
      const leftIsSave = left.id === SAVINGS_JAR_ID ? 1 : 0;
      const rightIsSave = right.id === SAVINGS_JAR_ID ? 1 : 0;
      return leftIsSave - rightIsSave;
    })
    .map(bucketLocation);
}

export function resolveVaultTransferBalance(
  id: VaultTransferLocationId,
  state: VaultTransferWalletState,
): number {
  if (id === "pool") return state.moneyToAllocate;
  if (isSavingsGoalMoveTarget(id)) {
    return state.savingsGoals.find((entry) => entry.id === id)?.balance ?? 0;
  }
  return state.vaultBuckets.find((entry) => entry.id === id)?.balance ?? 0;
}

function applyBucketBalanceDeltas(
  deltas: ReadonlyMap<VaultBucketId, number>,
  jars: readonly DestinationJar[],
  customBuckets: readonly CustomVaultBucketPersisted[],
): { jars: DestinationJar[]; customBuckets: CustomVaultBucketPersisted[] } {
  if (deltas.size === 0) {
    return {
      jars: [...jars],
      customBuckets: [...customBuckets],
    };
  }

  const nextJars = jars.map((jar) => {
    const delta = deltas.get(jar.id);
    if (delta === undefined) return jar;
    return {
      ...jar,
      balance: roundAudAmount(Math.max(0, jar.balance + delta)),
    };
  });

  const nextCustomBuckets = customBuckets.map((bucket) => {
    const delta = deltas.get(bucket.id);
    if (delta === undefined) return bucket;
    return {
      ...bucket,
      balance: roundAudAmount(Math.max(0, bucket.balance + delta)),
    };
  });

  return { jars: nextJars, customBuckets: nextCustomBuckets };
}

/** Apply one vault transfer atomically across pool, jars, custom buckets, and goals. */
export function computeVaultTransferState(
  from: VaultTransferLocationId,
  to: VaultTransferLocationId,
  amount: number,
  state: VaultTransferWalletState,
): VaultTransferNextState | null {
  if (amount <= 0 || from === to) return null;

  const safeAmount = roundAudAmount(amount);
  if (safeAmount > resolveVaultTransferBalance(from, state)) return null;

  const fromIsGoal = isSavingsGoalMoveTarget(from);
  const toIsGoal = isSavingsGoalMoveTarget(to);
  const bucketDeltas = new Map<VaultBucketId, number>();

  let moneyToAllocate = state.moneyToAllocate;

  if (from === "pool") {
    moneyToAllocate = roundAudAmount(moneyToAllocate - safeAmount);
  } else if (!fromIsGoal) {
    bucketDeltas.set(from, (bucketDeltas.get(from) ?? 0) - safeAmount);
  }

  if (to === "pool") {
    moneyToAllocate = roundAudAmount(moneyToAllocate + safeAmount);
  } else if (!toIsGoal) {
    bucketDeltas.set(to, (bucketDeltas.get(to) ?? 0) + safeAmount);
  }

  const { jars, customBuckets } = applyBucketBalanceDeltas(
    bucketDeltas,
    state.jars,
    state.customBuckets,
  );

  let savingsGoals = [...state.savingsGoals];
  if (fromIsGoal || toIsGoal) {
    savingsGoals = savingsGoals.map((entry) => {
      if (fromIsGoal && entry.id === from) {
        return { ...entry, balance: roundAudAmount(entry.balance - safeAmount) };
      }
      if (toIsGoal && entry.id === to) {
        return { ...entry, balance: roundAudAmount(entry.balance + safeAmount) };
      }
      return entry;
    });
  }

  return {
    moneyToAllocate,
    jars,
    customBuckets,
    savingsGoals,
  };
}

export function buildVaultTransferLocations(
  buckets: readonly VaultBucket[],
  goals: readonly SavingsGoal[],
  excludeId?: VaultTransferLocationId,
): VaultTransferLocation[] {
  const bucketLocations = sortBucketDestinations(
    buckets.filter((bucket) => bucket.id !== excludeId),
  );

  const goalLocations = goals
    .filter((goal) => goal.id !== excludeId)
    .map(goalLocation);

  return [...bucketLocations, ...goalLocations];
}

/** Savings sources available when moving from the Save Jar header. */
export function buildSaveJarTransferSources(
  unassignedBalance: number,
  goals: readonly SavingsGoal[],
  unallocatedLabel: string,
): VaultTransferLocation[] {
  const sources: VaultTransferLocation[] = [
    {
      id: SAVINGS_JAR_ID,
      label: unallocatedLabel,
      balance: unassignedBalance,
    },
  ];

  for (const goal of goals) {
    sources.push(goalLocation(goal));
  }

  return sources;
}

/** Budget jar destinations for Save Jar header moves (excludes the active source). */
export function buildSaveJarTransferDestinations(
  buckets: readonly VaultBucket[],
  sourceId: VaultTransferLocationId,
): VaultTransferLocation[] {
  return sortBucketDestinations(
    buckets.filter((bucket) => {
      if (bucket.id === sourceId) return false;
      if (sourceId === SAVINGS_JAR_ID && bucket.id === SAVINGS_JAR_ID) return false;
      return true;
    }),
  );
}

/** Jar sources for the single Vault-home jar-to-jar move. */
export function buildJarToJarTransferSources(
  buckets: readonly VaultBucket[],
): VaultTransferLocation[] {
  return buckets.map(bucketLocation);
}

/** Jar destinations for the Vault-home jar-to-jar move (excludes the active source). */
export function buildJarToJarTransferDestinations(
  buckets: readonly VaultBucket[],
  sourceId: VaultTransferLocationId,
): VaultTransferLocation[] {
  return sortBucketDestinations(
    buckets.filter((bucket) => bucket.id !== sourceId),
  );
}

export function resolveVaultTransferLocationLabel(
  id: VaultTransferLocationId,
  buckets: readonly VaultBucket[],
  goals: readonly SavingsGoal[],
  poolLabel: string,
): string {
  if (id === "pool") return poolLabel;
  if (isSavingsGoalMoveTarget(id)) {
    return goals.find((goal) => goal.id === id)?.name ?? "Savings goal";
  }
  return buckets.find((bucket) => bucket.id === id)?.name ?? "Jar";
}
