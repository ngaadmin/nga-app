import { describe, expect, it } from "vitest";
import {
  LAUNCHPAD_CATEGORIES,
  LAUNCHPAD_HOME_COPY,
  categoryPillOpacity,
  flatLaunchpadTiles,
  liveVentureIds,
} from "@/lib/launchpad/venture-test/launchpad-home-data";
import { VENTURE_BLUEPRINTS } from "@/lib/launchpad/venture-blueprints";

describe("Launchpad home data (r12)", () => {
  it("keeps Jasper's category and tile order", () => {
    const names = LAUNCHPAD_CATEGORIES.map((c) => [
      c.name,
      c.tiles.map((t) => (t.kind === "idea" ? t.name : "MORE")),
    ]);
    expect(names).toEqual([
      ["Services", ["Dog walking", "Lawn mowing", "Babysitting", "Bin cleaning", "Curb numbers"]],
      [
        "Make and Sell: Physical",
        [
          "Craft",
          "Lemonade stand",
          "Fixed-up secondhand items",
          LAUNCHPAD_HOME_COPY.nursery,
          "Baked goods",
          "Printed T-shirts",
          "Porch design",
        ],
      ],
      ["Make and Sell: Digital", ["Printables", "Digital stickers", "MORE"]],
      ["Growth Add-ons", ["Teach others"]],
    ]);
  });

  it("has Dog walking as the only live, featured tile, backed by a blueprint", () => {
    expect(liveVentureIds()).toEqual(["dog-walking"]);
    const featured = LAUNCHPAD_CATEGORIES.flatMap((c) => c.tiles).filter(
      (t) => t.kind === "idea" && t.featured,
    );
    expect(featured.map((t) => (t.kind === "idea" ? t.name : ""))).toEqual([
      "Dog walking",
    ]);
    expect(VENTURE_BLUEPRINTS.some((b) => b.id === "dog-walking")).toBe(true);
  });

  it("puts a pill only on the first tile of each group", () => {
    const flat = flatLaunchpadTiles();
    expect(flat.filter((t) => t.pill).map((t) => [t.pill, t.x])).toEqual([
      ["Services", 0],
      ["Make and Sell: Physical", 550],
      ["Make and Sell: Digital", 1320],
      ["Growth Add-ons", 1650],
    ]);
  });

  it("cycles awnings orange, aqua, gold, pale blue, navy, and marks the three new tiles", () => {
    const ideas = LAUNCHPAD_CATEGORIES.flatMap((c) => c.tiles).filter((t) => t.kind === "idea");
    const cycle = ["#ffa503", "#0cc1e0", "#dcb766", "#bde9fb", "#031f82"];
    expect(ideas.map((t) => (t.kind === "idea" ? t.awning : ""))).toEqual(ideas.map((_, i) => cycle[i % cycle.length]));
    expect(ideas.at(-1)).toMatchObject({ name: "Teach others", awning: "#031f82" });
    expect(ideas.filter((t) => t.kind === "idea" && t.isNew).map((t) => (t.kind === "idea" ? t.name : ""))).toEqual([
      "Bin cleaning",
      "Curb numbers",
      "Porch design",
    ]);
    expect(ideas.map((t) => (t.kind === "idea" ? t.name : ""))).not.toContain("Writing a book");
    expect(ideas.map((t) => (t.kind === "idea" ? t.name : ""))).not.toContain("Digital art shop");
  });

  it("fades a pill out over 100px once its tile scrolls past", () => {
    expect(categoryPillOpacity(330, 0)).toBe(1);
    expect(categoryPillOpacity(330, 330)).toBe(1);
    expect(categoryPillOpacity(0, 50)).toBe(0.5);
    expect(categoryPillOpacity(0, 230)).toBe(0);
  });
});

describe("r4 building window counts", () => {
  it("one window per silver: L1 three, L2 product+Pricing, L3–6 Final structure (D26)", async () => {
    const { launchpadTestVentureSeed } = await import(
      "@/lib/launchpad/content/seed/launchpad-test-venture-seed"
    );
    const counts = Object.fromEntries(
      launchpadTestVentureSeed("dog-walking").floors.map((f) => [f.level, f.silvers.length]),
    );
    expect(counts).toEqual({ 1: 3, 2: 3, 3: 2, 4: 2, 5: 3, 6: 1, 7: 1 });
  });
});
