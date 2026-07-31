import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

export type VentureTier = "freemium" | "premium";

export type VentureBlueprintId =
  | "lemonade-stand"
  | "dog-walking"
  | "car-wash"
  | "handmade-crafts"
  | "pet-sitting"
  | "lawn-mowing"
  | "furniture-flipping"
  | "bake-sale"
  | "window-exterior-cleaning";

/** Cohort eligibility metadata — all ventures render; unavailable cohorts sort to carousel end. */
export type VentureCohortLabel =
  | "explorer"
  | "explorer-supervised"
  | "explorer-limited"
  | "pathfinder"
  | "maverick";

export type VentureBlueprint = {
  id: VentureBlueprintId;
  title: string;
  emoji: string;
  tier: VentureTier;
  cohorts: readonly VentureCohortLabel[];
  description: string;
  journeySteps: readonly [string, string, string, string];
  /** Carousel row — layout only, not access control. */
  row: 1 | 2 | 3;
};

export type VentureAccessState = "free_launch" | "premium_unlock";

export type VentureCarouselSlot =
  | "freemium_available"
  | "premium_locked"
  | "age_locked";

const COHORT_RANK: Record<MasteryCohort, 0 | 1 | 2> = {
  explorer: 0,
  pathfinder: 1,
  maverick: 2,
};

function hasExplorerCohortLabel(blueprint: VentureBlueprint): boolean {
  return blueprint.cohorts.some(
    (label) =>
      label === "explorer" ||
      label === "explorer-supervised" ||
      label === "explorer-limited",
  );
}

/** Lowest mastery cohort that may launch this venture (cumulative track tiers). */
export function getVentureMinimumCohortRank(
  blueprint: VentureBlueprint,
): 0 | 1 | 2 {
  if (hasExplorerCohortLabel(blueprint)) return 0;
  if (blueprint.cohorts.includes("pathfinder")) return 1;
  return 2;
}

/** True when the user's mastery cohort may launch this venture. */
export function isVentureAvailableForMasteryCohort(
  blueprint: VentureBlueprint,
  userCohort: MasteryCohort,
): boolean {
  return COHORT_RANK[userCohort] >= getVentureMinimumCohortRank(blueprint);
}

export function classifyVentureCarouselSlot(
  blueprint: VentureBlueprint,
  userCohort: MasteryCohort,
  isPremium: boolean,
): VentureCarouselSlot {
  if (!isVentureAvailableForMasteryCohort(blueprint, userCohort)) {
    return "age_locked";
  }
  if (blueprint.tier === "freemium" || isPremium) {
    return "freemium_available";
  }
  return "premium_locked";
}

export function buildVentureCarouselSlotMap(
  userCohort: MasteryCohort,
  isPremium: boolean,
): Record<VentureBlueprintId, VentureCarouselSlot> {
  const map = {} as Record<VentureBlueprintId, VentureCarouselSlot>;
  for (const blueprint of VENTURE_BLUEPRINTS) {
    map[blueprint.id] = classifyVentureCarouselSlot(
      blueprint,
      userCohort,
      isPremium,
    );
  }
  return map;
}

/** Freemium first, then cohort-eligible premium, then age-track locked — catalog order within each group. */
export function sortVenturesForCarousel(
  userCohort: MasteryCohort,
  isPremium = false,
): VentureBlueprint[] {
  const freemiumAvailable: VentureBlueprint[] = [];
  const premiumLocked: VentureBlueprint[] = [];
  const ageLocked: VentureBlueprint[] = [];

  for (const blueprint of VENTURE_BLUEPRINTS) {
    const slot = classifyVentureCarouselSlot(blueprint, userCohort, isPremium);
    if (slot === "freemium_available") {
      freemiumAvailable.push(blueprint);
    } else if (slot === "premium_locked") {
      premiumLocked.push(blueprint);
    } else {
      ageLocked.push(blueprint);
    }
  }

  return [...freemiumAvailable, ...premiumLocked, ...ageLocked];
}

/** Always returns the full catalog — defensive guard for UI rendering. */
export function getAllVenturesForCarousel(
  userCohort: MasteryCohort,
  isPremium = false,
): VentureBlueprint[] {
  const sorted = sortVenturesForCarousel(userCohort, isPremium);
  if (sorted.length === VENTURE_BLUEPRINTS.length) {
    return sorted;
  }
  return [...VENTURE_BLUEPRINTS];
}

export function buildCohortAvailabilityMap(
  userCohort: MasteryCohort,
): Record<VentureBlueprintId, boolean> {
  const map = {} as Record<VentureBlueprintId, boolean>;
  for (const blueprint of VENTURE_BLUEPRINTS) {
    map[blueprint.id] = isVentureAvailableForMasteryCohort(
      blueprint,
      userCohort,
    );
  }
  return map;
}

export const VENTURE_BLUEPRINTS: readonly VentureBlueprint[] = [
  {
    id: "lemonade-stand",
    title: "Lemonade Stand",
    emoji: "🍋",
    tier: "freemium",
    cohorts: ["explorer", "pathfinder"],
    description:
      "Turn a classic neighborhood drink setup into cold cash before the ice melts.",
    journeySteps: [
      "Recipe Test",
      "Stand Setup",
      "Price Per Cup",
      "Busy Corner Launch",
    ],
    row: 1,
  },
  {
    id: "dog-walking",
    title: "Dog Walking",
    emoji: "🐕",
    tier: "freemium",
    cohorts: ["explorer-supervised", "pathfinder", "maverick"],
    description:
      "Keep neighborhood tails wagging while building a reliable weekly income stream.",
    journeySteps: [
      "Pick Your Route",
      "Land First Client",
      "Set Walk Rates",
      "Build the Pack",
    ],
    row: 1,
  },
  {
    id: "car-wash",
    title: "Car Wash",
    emoji: "🚗",
    tier: "freemium",
    cohorts: ["explorer-supervised", "pathfinder", "maverick"],
    description:
      "Turn dirty cars into quick cash while keeping your street looking spotless.",
    journeySteps: [
      "Kit Inventory",
      "Practice Wash",
      "Neighborhood Flyers",
      "Premium Detailer",
    ],
    row: 1,
  },
  {
    id: "handmade-crafts",
    title: "Handmade Crafts",
    emoji: "🧁",
    tier: "premium",
    cohorts: ["explorer", "pathfinder", "maverick"],
    description:
      "Transform simple craft supplies into custom creations that people will love to buy.",
    journeySteps: [
      "Pick Your Craft",
      "Prototype Product",
      "Price Your Goods",
      "Maker's Market",
    ],
    row: 2,
  },
  {
    id: "pet-sitting",
    title: "Pet Sitting",
    emoji: "🐾",
    tier: "premium",
    cohorts: ["explorer", "pathfinder", "maverick"],
    description:
      "Get paid to hang out with animals while their owners are out of town.",
    journeySteps: [
      "Pet Safety 101",
      "Care Checklist",
      "First Booking",
      "Vacation Pro",
    ],
    row: 2,
  },
  {
    id: "lawn-mowing",
    title: "Lawn Mowing & Garden Care",
    emoji: "🌿",
    tier: "premium",
    cohorts: ["pathfinder", "maverick"],
    description:
      "Turn grass clippings and overgrown yards into green bills.",
    journeySteps: [
      "Gear Check",
      "First Yard Quote",
      "Mow & Collect",
      "Repeat Clients",
    ],
    row: 2,
  },
  {
    id: "furniture-flipping",
    title: "Furniture Flipping",
    emoji: "🪑",
    tier: "premium",
    cohorts: ["pathfinder", "maverick"],
    description:
      "Rescue forgotten chairs and cabinets, fix them up, and sell them for a solid cash payout.",
    journeySteps: [
      "Find a Piece",
      "Clean & Repair",
      "List for Sale",
      "Flip Profit Loop",
    ],
    row: 3,
  },
  {
    id: "bake-sale",
    title: "Bake Sale",
    emoji: "🍪",
    tier: "premium",
    cohorts: ["explorer", "pathfinder"],
    description:
      "Bake a batch of sweet treats and trade them for cash from neighbors who can't resist.",
    journeySteps: [
      "Pick Your Recipe",
      "Batch & Package",
      "Set Your Prices",
      "Neighborhood Sale",
    ],
    row: 3,
  },
  {
    id: "window-exterior-cleaning",
    title: "Window & Exterior Cleaning",
    emoji: "🪟",
    tier: "premium",
    cohorts: ["explorer-limited", "pathfinder", "maverick"],
    description:
      "Turn smudged glass and dusty outdoor surfaces into clear profit.",
    journeySteps: [
      "Gear Up",
      "Practice Your Streak",
      "Quote the Job",
      "Repeat Bookings",
    ],
    row: 3,
  },
] as const;

export function getVentureBlueprintById(id: VentureBlueprintId): VentureBlueprint {
  const match = VENTURE_BLUEPRINTS.find((entry) => entry.id === id);
  if (!match) throw new Error(`Unknown venture blueprint: ${id}`);
  return match;
}

/** Premium ventures show a lock for free-tier users; cohort never hides a template. */
export function getVentureAccessState(
  blueprint: VentureBlueprint,
  isPremium: boolean,
): VentureAccessState {
  if (blueprint.tier === "freemium" || isPremium) return "free_launch";
  return "premium_unlock";
}

export function buildVentureAccessMap(
  isPremium: boolean,
): Record<VentureBlueprintId, VentureAccessState> {
  const map = {} as Record<VentureBlueprintId, VentureAccessState>;
  for (const blueprint of VENTURE_BLUEPRINTS) {
    map[blueprint.id] = getVentureAccessState(blueprint, isPremium);
  }
  return map;
}
