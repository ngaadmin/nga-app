/**
 * TEST-ONLY Launchpad landing page data (Jasper's r12 home, CATS block in
 * build_home_r12.py). One continuous Business Ideas carousel, grouped by
 * category; the category pill rides on the first tile of each group.
 */

/** Copy strings that may change. "Nursery" may become "Plants and trees". */
export const LAUNCHPAD_HOME_COPY = {
  nursery: "Nursery",
  moreIdeas: "More ideas coming",
  featured: "Featured",
  newTag: "New",
  emptyInProgress: "No ventures in progress yet.",
  lockedNote: (name: string) => `${name} isn't open yet. Dog walking is open now.`,
} as const;

/** Awning colors (brand tokens in app/globals.css). */
const AWNING = { orange: "#ffa503", cyan: "#0cc1e0", gold: "#dcb766", panel: "#bde9fb", navy: "#031f82" } as const;

/** Shop-front art slug. Matches the file under public/launchpad/shopfront. */
export type LaunchpadIconKey =
  | "dog-walking"
  | "lawn-mowing"
  | "babysitting"
  | "bin-cleaning"
  | "curb-numbers"
  | "craft"
  | "lemonade-stand"
  | "fixed-up-secondhand"
  | "nursery"
  | "baked-goods"
  | "printed-t-shirts"
  | "porch-design"
  | "printables"
  | "digital-stickers"
  | "teach-others";

export type LaunchpadTile =
  | {
      kind: "idea";
      key: string;
      name: string;
      icon: LaunchpadIconKey;
      awning: string;
      /** Live tiles open a venture (blueprint id in lib/launchpad/venture-blueprints). */
      ventureId: string | null;
      featured?: boolean;
      /** Orange New tag. Bin cleaning, Curb numbers, Porch design. */
      isNew?: boolean;
    }
  | { kind: "more"; key: string };

export type LaunchpadCategory = { name: string; tiles: LaunchpadTile[] };

const idea = (
  key: string,
  name: string,
  icon: LaunchpadIconKey,
  awning: string,
  ventureId: string | null = null,
  featured = false,
  isNew = false,
): LaunchpadTile => ({ kind: "idea", key, name, icon, awning, ventureId, featured, ...(isNew ? { isNew } : {}) });

/** One cycle across every idea tile, skipping More. Orange, aqua, gold, pale blue, navy. */
const AWNING_CYCLE = [AWNING.orange, AWNING.cyan, AWNING.gold, AWNING.panel, AWNING.navy] as const;
let awningIndex = 0;
const nextAwning = () => AWNING_CYCLE[awningIndex++ % AWNING_CYCLE.length]!;

export const LAUNCHPAD_CATEGORIES: LaunchpadCategory[] = [
  {
    name: "Services",
    tiles: [
      idea("dog-walking", "Dog walking", "dog-walking", nextAwning(), "dog-walking", true),
      idea("lawn-mowing", "Lawn mowing", "lawn-mowing", nextAwning()),
      idea("babysitting", "Babysitting", "babysitting", nextAwning()),
      idea("bin-cleaning", "Bin cleaning", "bin-cleaning", nextAwning(), null, false, true),
      idea("curb-numbers", "Curb numbers", "curb-numbers", nextAwning(), null, false, true),
    ],
  },
  {
    name: "Make and Sell: Physical",
    tiles: [
      idea("craft", "Craft", "craft", nextAwning()),
      idea("lemonade-stand", "Lemonade stand", "lemonade-stand", nextAwning()),
      idea("fixed-up-secondhand", "Fixed-up secondhand items", "fixed-up-secondhand", nextAwning()),
      idea("nursery", LAUNCHPAD_HOME_COPY.nursery, "nursery", nextAwning()),
      idea("baked-goods", "Baked goods", "baked-goods", nextAwning()),
      idea("printed-t-shirts", "Printed T-shirts", "printed-t-shirts", nextAwning()),
      idea("porch-design", "Porch design", "porch-design", nextAwning(), null, false, true),
    ],
  },
  {
    name: "Make and Sell: Digital",
    tiles: [
      idea("printables", "Printables", "printables", nextAwning()),
      idea("digital-stickers", "Digital stickers", "digital-stickers", nextAwning()),
      { kind: "more", key: "more-digital" },
    ],
  },
  {
    name: "Growth Add-ons",
    tiles: [idea("teach-others", "Teach others", "teach-others", nextAwning())],
  },
];

/** Tile width plus gap in the carousel track (px). */
export const TILE_STEP = 110;

/** The flat carousel: each tile with its category pill if it starts a group, and its x offset. */
export function flatLaunchpadTiles(categories: LaunchpadCategory[] = LAUNCHPAD_CATEGORIES) {
  const out: { tile: LaunchpadTile; pill: string | null; x: number }[] = [];
  for (const c of categories) {
    c.tiles.forEach((tile, i) => out.push({ tile, pill: i === 0 ? c.name : null, x: out.length * TILE_STEP }));
  }
  return out;
}

/** Pill opacity: full until its tile starts scrolling past, gone after 100px (r12 storyboard). */
export function categoryPillOpacity(tileX: number, scrollLeft: number): number {
  const d = tileX - scrollLeft;
  if (d >= 0) return 1;
  return Math.max(0, Math.round((1 + d / 100) * 100) / 100);
}

export function liveVentureIds(categories: LaunchpadCategory[] = LAUNCHPAD_CATEGORIES): string[] {
  return categories.flatMap((c) => c.tiles).flatMap((t) => (t.kind === "idea" && t.ventureId ? [t.ventureId] : []));
}
