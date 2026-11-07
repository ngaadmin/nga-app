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
  emptyInProgress: "No ventures in progress yet.",
  lockedNote: (name: string) => `${name} isn't open yet. Dog walking is open now.`,
} as const;

/** Awning colors (brand tokens in app/globals.css). */
const AWNING = { orange: "#ffa503", cyan: "#0cc1e0", gold: "#dcb766", panel: "#bde9fb", navy: "#031f82" } as const;

export type LaunchpadIconKey =
  | "paw"
  | "leaf"
  | "rattle"
  | "scissors"
  | "lemon"
  | "chair"
  | "sprout"
  | "cookie"
  | "tshirt"
  | "book"
  | "page"
  | "sticker"
  | "palette"
  | "board";

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
): LaunchpadTile => ({ kind: "idea", key, name, icon, awning, ventureId, featured });

export const LAUNCHPAD_CATEGORIES: LaunchpadCategory[] = [
  {
    name: "Services",
    tiles: [
      idea("dog-walking", "Dog walking", "paw", AWNING.orange, "dog-walking", true),
      idea("lawn-mowing", "Lawn mowing", "leaf", AWNING.cyan),
      idea("babysitting", "Babysitting", "rattle", AWNING.gold),
    ],
  },
  {
    name: "Make and Sell: Physical",
    tiles: [
      idea("craft", "Craft", "scissors", AWNING.panel),
      idea("lemonade-stand", "Lemonade stand", "lemon", AWNING.navy),
      idea("fixed-up-secondhand", "Fixed-up secondhand items", "chair", AWNING.orange),
      idea("nursery", LAUNCHPAD_HOME_COPY.nursery, "sprout", AWNING.cyan),
      idea("baked-goods", "Baked goods", "cookie", AWNING.gold),
      idea("printed-t-shirts", "Printed T-shirts", "tshirt", AWNING.panel),
      idea("writing-a-book", "Writing a book", "book", AWNING.navy),
    ],
  },
  {
    name: "Make and Sell: Digital",
    tiles: [
      idea("printables", "Printables", "page", AWNING.orange),
      idea("digital-stickers", "Digital stickers", "sticker", AWNING.cyan),
      idea("digital-art-shop", "Digital art shop", "palette", AWNING.gold),
      { kind: "more", key: "more-digital" },
    ],
  },
  {
    name: "Growth Add-ons",
    tiles: [idea("teach-others", "Teach others", "board", AWNING.panel)],
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
