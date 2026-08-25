import { describe, expect, it } from "vitest";
import { INITIAL_DESTINATION_JARS } from "@/lib/dashboard/destination-jars";
import {
  zeroVaultBucketBalance,
  type CustomVaultBucketPersisted,
} from "@/lib/dashboard/vault-buckets";

describe("zeroVaultBucketBalance", () => {
  it("sets only the chosen foundation jar to $0", () => {
    const jars = INITIAL_DESTINATION_JARS.map((jar) =>
      jar.id === "spend-jar" || jar.id === "give-jar"
        ? { ...jar, balance: jar.id === "spend-jar" ? 40 : 12 }
        : { ...jar },
    );

    const next = zeroVaultBucketBalance("spend-jar", jars, []);

    expect(next.jars.find((jar) => jar.id === "spend-jar")?.balance).toBe(0);
    expect(next.jars.find((jar) => jar.id === "give-jar")?.balance).toBe(12);
  });

  it("sets only the chosen custom jar to $0", () => {
    const customBuckets: CustomVaultBucketPersisted[] = [
      {
        id: "custom-bike",
        name: "Bike",
        emoji: "🚲",
        balance: 25,
        foundationRole: "custom",
      },
      {
        id: "custom-games",
        name: "Games",
        emoji: "🎮",
        balance: 8,
        foundationRole: "custom",
      },
    ];

    const next = zeroVaultBucketBalance("custom-bike", INITIAL_DESTINATION_JARS, customBuckets);

    expect(next.customBuckets.find((bucket) => bucket.id === "custom-bike")?.balance).toBe(0);
    expect(next.customBuckets.find((bucket) => bucket.id === "custom-games")?.balance).toBe(8);
  });
});
