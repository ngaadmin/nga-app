import { describe, expect, it } from "vitest";
import {
  INITIAL_DESTINATION_JARS,
  SAVINGS_JAR_ID,
  type DestinationJar,
} from "@/lib/dashboard/destination-jars";
import {
  FREEMIUM_BIG_SAVINGS_GOAL_ID,
  computeTotalSavings,
  type SavingsGoal,
} from "@/lib/dashboard/savings-goals";
import { mergeVaultBuckets } from "@/lib/dashboard/vault-buckets";
import {
  buildJarToJarTransferDestinations,
  buildJarToJarTransferSources,
  buildVaultTransferLocations,
  computeVaultTransferState,
  type VaultTransferWalletState,
} from "@/lib/dashboard/vault-transfer";

function jarBalance(id: DestinationJar["id"], balance: number): DestinationJar[] {
  return INITIAL_DESTINATION_JARS.map((jar) =>
    jar.id === id ? { ...jar, balance } : { ...jar },
  );
}

function makeWalletState(options: {
  save?: number;
  spend?: number;
  give?: number;
  moneyToAllocate?: number;
  goals?: SavingsGoal[];
}): VaultTransferWalletState {
  const jars = INITIAL_DESTINATION_JARS.map((jar) => {
    if (jar.id === SAVINGS_JAR_ID) return { ...jar, balance: options.save ?? 0 };
    if (jar.id === "spend-jar") return { ...jar, balance: options.spend ?? 0 };
    if (jar.id === "give-jar") return { ...jar, balance: options.give ?? 0 };
    return { ...jar };
  });
  const customBuckets: VaultTransferWalletState["customBuckets"] = [];
  const savingsGoals = options.goals ?? [];
  return {
    moneyToAllocate: options.moneyToAllocate ?? 0,
    jars,
    customBuckets,
    savingsGoals,
    vaultBuckets: mergeVaultBuckets(jars, customBuckets),
  };
}

function jarAmount(jars: readonly DestinationJar[], id: DestinationJar["id"]): number {
  return jars.find((jar) => jar.id === id)?.balance ?? 0;
}

function goalAmount(goals: readonly SavingsGoal[], id: SavingsGoal["id"]): number {
  return goals.find((goal) => goal.id === id)?.balance ?? 0;
}

describe("computeVaultTransferState", () => {
  const sampleGoal: SavingsGoal = {
    id: FREEMIUM_BIG_SAVINGS_GOAL_ID,
    name: "Big Savings Goal",
    targetAmount: 100,
    balance: 40,
    emoji: "🎯",
  };

  it("moves unallocated save-jar funds to spend jar", () => {
    const state = makeWalletState({ save: 50, spend: 10, give: 5 });
    const next = computeVaultTransferState(SAVINGS_JAR_ID, "spend-jar", 20, state);

    expect(next).not.toBeNull();
    expect(jarAmount(next!.jars, SAVINGS_JAR_ID)).toBe(30);
    expect(jarAmount(next!.jars, "spend-jar")).toBe(30);
    expect(jarAmount(next!.jars, "give-jar")).toBe(5);
    expect(computeTotalSavings(jarAmount(next!.jars, SAVINGS_JAR_ID), next!.savingsGoals)).toBe(30);
  });

  it("moves goal funds to give jar", () => {
    const state = makeWalletState({ save: 10, spend: 5, give: 0, goals: [sampleGoal] });
    const next = computeVaultTransferState(
      FREEMIUM_BIG_SAVINGS_GOAL_ID,
      "give-jar",
      15,
      state,
    );

    expect(next).not.toBeNull();
    expect(goalAmount(next!.savingsGoals, FREEMIUM_BIG_SAVINGS_GOAL_ID)).toBe(25);
    expect(jarAmount(next!.jars, "give-jar")).toBe(15);
    expect(jarAmount(next!.jars, SAVINGS_JAR_ID)).toBe(10);
    expect(computeTotalSavings(jarAmount(next!.jars, SAVINGS_JAR_ID), next!.savingsGoals)).toBe(35);
  });

  it("moves spend jar to give jar without touching save jar total", () => {
    const state = makeWalletState({ save: 20, spend: 50, give: 10, goals: [sampleGoal] });
    const beforeTotalSavings = computeTotalSavings(
      jarAmount(state.jars, SAVINGS_JAR_ID),
      state.savingsGoals,
    );
    const next = computeVaultTransferState("spend-jar", "give-jar", 25, state);

    expect(next).not.toBeNull();
    expect(jarAmount(next!.jars, "spend-jar")).toBe(25);
    expect(jarAmount(next!.jars, "give-jar")).toBe(35);
    expect(jarAmount(next!.jars, SAVINGS_JAR_ID)).toBe(20);
    expect(goalAmount(next!.savingsGoals, FREEMIUM_BIG_SAVINGS_GOAL_ID)).toBe(40);
    expect(computeTotalSavings(jarAmount(next!.jars, SAVINGS_JAR_ID), next!.savingsGoals)).toBe(
      beforeTotalSavings,
    );
  });

  it("moves spend jar to a savings goal", () => {
    const state = makeWalletState({ save: 5, spend: 30, goals: [sampleGoal] });
    const next = computeVaultTransferState(
      "spend-jar",
      FREEMIUM_BIG_SAVINGS_GOAL_ID,
      12,
      state,
    );

    expect(next).not.toBeNull();
    expect(jarAmount(next!.jars, "spend-jar")).toBe(18);
    expect(goalAmount(next!.savingsGoals, FREEMIUM_BIG_SAVINGS_GOAL_ID)).toBe(52);
    expect(jarAmount(next!.jars, SAVINGS_JAR_ID)).toBe(5);
    expect(computeTotalSavings(jarAmount(next!.jars, SAVINGS_JAR_ID), next!.savingsGoals)).toBe(57);
  });

  it("returns goal funds to unallocated save-jar balance", () => {
    const state = makeWalletState({ save: 8, goals: [sampleGoal] });
    const next = computeVaultTransferState(
      FREEMIUM_BIG_SAVINGS_GOAL_ID,
      SAVINGS_JAR_ID,
      10,
      state,
    );

    expect(next).not.toBeNull();
    expect(goalAmount(next!.savingsGoals, FREEMIUM_BIG_SAVINGS_GOAL_ID)).toBe(30);
    expect(jarAmount(next!.jars, SAVINGS_JAR_ID)).toBe(18);
    expect(computeTotalSavings(jarAmount(next!.jars, SAVINGS_JAR_ID), next!.savingsGoals)).toBe(48);
  });

  it("rejects transfers above source balance", () => {
    const state = makeWalletState({ spend: 10 });
    expect(computeVaultTransferState("spend-jar", "give-jar", 11, state)).toBeNull();
  });

  it("applies both jar deltas atomically when source and target are foundation jars", () => {
    const state = makeWalletState({ save: 0, spend: 100, give: 0 });
    const next = computeVaultTransferState("spend-jar", "give-jar", 40, state);

    expect(next).not.toBeNull();
    expect(jarAmount(next!.jars, "spend-jar")).toBe(60);
    expect(jarAmount(next!.jars, "give-jar")).toBe(40);
  });
});

describe("buildVaultTransferLocations", () => {
  it("lists budget jars before save jar and goals", () => {
    const jars = jarBalance("spend-jar", 10);
    const goals: SavingsGoal[] = [
      {
        id: FREEMIUM_BIG_SAVINGS_GOAL_ID,
        name: "Big Savings Goal",
        targetAmount: 100,
        balance: 5,
        emoji: "🎯",
      },
    ];
    const buckets = mergeVaultBuckets(jars, []);
    const locations = buildVaultTransferLocations(buckets, goals, "spend-jar");

    expect(locations.map((entry) => entry.id)).toEqual([
      "give-jar",
      "emergencies-jar",
      SAVINGS_JAR_ID,
      FREEMIUM_BIG_SAVINGS_GOAL_ID,
    ]);
  });
});

describe("buildJarToJarTransferSources", () => {
  it("lists jars only, not goals", () => {
    const buckets = mergeVaultBuckets(jarBalance("spend-jar", 10), []);
    const sources = buildJarToJarTransferSources(buckets);
    const destinations = buildJarToJarTransferDestinations(buckets, "spend-jar");

    expect(sources.map((entry) => entry.id)).toEqual([
      SAVINGS_JAR_ID,
      "spend-jar",
      "give-jar",
      "emergencies-jar",
    ]);
    expect(destinations.map((entry) => entry.id)).toEqual([
      "give-jar",
      "emergencies-jar",
      SAVINGS_JAR_ID,
    ]);
  });
});
