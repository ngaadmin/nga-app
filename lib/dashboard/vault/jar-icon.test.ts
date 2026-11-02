import { describe, expect, it } from "vitest";
import { foundationJarIcon } from "@/lib/dashboard/vault/jar-icon";
import { JAR_ICONS } from "@/lib/dashboard/progress-icons-a";
import { vaultBucketDisplayName } from "@/lib/dashboard/vault/bucket-display-name";

describe("foundationJarIcon", () => {
  it("uses the Hub's jar icon for a starter jar with its default emoji", () => {
    expect(foundationJarIcon({ id: "emergencies-jar", emoji: "🚨" })).toBe(JAR_ICONS["emergencies-jar"]);
    expect(foundationJarIcon({ id: "save-jar", emoji: "🏦" })).toBe(JAR_ICONS["save-jar"]);
  });
  it("keeps a child's own emoji and custom jars", () => {
    expect(foundationJarIcon({ id: "save-jar", emoji: "🐷" })).toBeNull();
    expect(foundationJarIcon({ id: "custom-1", emoji: "🎮" })).toBeNull();
  });
  it("labels the emergency jar Emergency, like the Hub", () => {
    expect(
      vaultBucketDisplayName({ id: "emergencies-jar", name: "Emergencies Jar" } as never),
    ).toBe("Emergency");
  });
});
