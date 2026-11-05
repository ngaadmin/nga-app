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
      ["Services", ["Dog walking", "Lawn mowing", "Babysitting"]],
      [
        "Make and Sell: Physical",
        [
          "Craft",
          "Lemonade stand",
          "Fixed-up secondhand items",
          LAUNCHPAD_HOME_COPY.nursery,
          "Baked goods",
          "Printed T-shirts",
          "Writing a book",
        ],
      ],
      [
        "Make and Sell: Digital",
        ["Printables", "Digital stickers", "Digital art shop", "MORE"],
      ],
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
      ["Make and Sell: Physical", 330],
      ["Make and Sell: Digital", 1100],
      ["Growth Add-ons", 1540],
    ]);
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
    expect(counts).toEqual({ 1: 3, 2: 2, 3: 3, 4: 1, 5: 3, 6: 2 });
  });
});
