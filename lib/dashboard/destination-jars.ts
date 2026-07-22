export type FoundationJarRole = "save" | "spend" | "give";

export type DestinationJarId = "save-jar" | "spend-jar" | "give-jar";

export type DestinationJar = {
  id: DestinationJarId;
  name: string;
  emoji: string;
  balance: number;
  isPermanent: true;
  foundationRole: FoundationJarRole;
};

export const SAVINGS_JAR_ID = "save-jar" as const;

export const INITIAL_DESTINATION_JARS: readonly DestinationJar[] = [
  {
    id: SAVINGS_JAR_ID,
    name: "Save Jar",
    emoji: "🏦",
    balance: 0,
    isPermanent: true,
    foundationRole: "save",
  },
  {
    id: "spend-jar",
    name: "Spend Jar",
    emoji: "🛒",
    balance: 0,
    isPermanent: true,
    foundationRole: "spend",
  },
  {
    id: "give-jar",
    name: "Give Jar",
    emoji: "🎁",
    balance: 0,
    isPermanent: true,
    foundationRole: "give",
  },
] as const;

export type JarBalanceMap = Record<DestinationJarId, number>;

export function defaultJarBalances(): JarBalanceMap {
  return {
    "save-jar": 0,
    "spend-jar": 0,
    "give-jar": 0,
  };
}

export function jarsFromBalanceMap(balances: JarBalanceMap): DestinationJar[] {
  return INITIAL_DESTINATION_JARS.map((jar) => ({
    ...jar,
    balance: Math.max(0, balances[jar.id] ?? 0),
  }));
}

export function balanceMapFromJars(jars: readonly DestinationJar[]): JarBalanceMap {
  return jars.reduce<JarBalanceMap>((map, jar) => {
    map[jar.id] = Math.max(0, jar.balance);
    return map;
  }, defaultJarBalances());
}

export function roundAudAmount(amount: number): number {
  return Math.round(Math.max(0, amount) * 100) / 100;
}

/** Snap money amounts to the nearest $0.50 step for allocation sliders. */
export function roundToHalfStep(amount: number): number {
  return Math.round(Math.max(0, amount) * 2) / 2;
}
