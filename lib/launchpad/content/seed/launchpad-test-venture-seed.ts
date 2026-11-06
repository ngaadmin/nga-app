/**
 * TEST venture seed: six building floors (Vision → Growing). Level 7 Budgeting
 * is the rooftop (future work — see BUDGETING_ROOFTOP_NOTE). Module 1 content
 * and L2 product screens overlay from the load file. L2 Pricing keeps Final
 * titles. Know your cost, Set the price, and jobs are test builds.
 * Rows 15-17 are chip screens. L3-6 stay structure placeholders.
 */
import dogWalkingLoadJson from "@/content/launchpad/dog-walking.load.json";
import {
  IDENTITY_ANSWER_KEY,
  SEED_LOCKED_IDENTITY_SILVER,
  identitySilver,
} from "@/lib/launchpad/content/seed/identity-silver";
import { LAUNCHPAD_PAYLOAD_SCHEMA_VERSION } from "@/lib/launchpad/content/schema-version";
import {
  BUDGETING_ROOFTOP_NOTE,
  SERVICE_FLOOR_STRUCTURE,
  serviceFloorName,
  serviceLevelOutcome,
  type ServiceFloorLevel,
} from "@/lib/launchpad/content/service-level-outcomes";
import type {
  LaunchpadBronze,
  LaunchpadFloor,
  LaunchpadSilver,
  LaunchpadTask,
  LaunchpadVenturePayload,
} from "@/lib/launchpad/content/types";
import { dogWalkingKnowYourCostBronze } from "@/lib/launchpad/content/know-your-cost/dog-walking-fixture";
import { dogWalkingJobsCoverBronze, dogWalkingSetPriceBronze } from "@/lib/launchpad/content/pricing/screens";
import { competitorBronze, customerBronze, offerBronze } from "@/lib/launchpad/content/planning/screens";
import { overlayLoad } from "@/lib/launchpad/load/to-payload";
import type { LaunchpadLoadFile } from "@/lib/launchpad/load/types";

export { IDENTITY_ANSWER_KEY, SEED_LOCKED_IDENTITY_SILVER, identitySilver };

/**
 * The dog walking load file (Module 1 from Final framework + L2 product from
 * bronze tracker). Overlaid on the seed for that venture.
 */
export const DOG_WALKING_LOAD = dogWalkingLoadJson as unknown as LaunchpadLoadFile;

export const LAUNCHPAD_SEED_VENTURE_ID = "dog-walking";

/** Tasks per bronze for placeholder structure. Real Module 1/L2 counts come from the load. */
export const PLACEHOLDER_TASKS_PER_BRONZE = 3;

void BUDGETING_ROOFTOP_NOTE; // referenced in D26 / reports

function placeholderTasks(prefix: string): LaunchpadTask[] {
  return Array.from({ length: PLACEHOLDER_TASKS_PER_BRONZE }, (_, i) => {
    const id = `${prefix}-t${i + 1}`;
    return {
      id,
      title: `Task ${i + 1}`,
      placeholder: true,
      screens: [
        {
          id: `${id}-s1`,
          type: "placeholder",
          blocks: [
            { kind: "text", label: "Text block (placeholder)" },
            { kind: "illustration", label: "Illustration (placeholder)" },
            { kind: "interactive", label: "Interactive element (placeholder)" },
          ],
        },
      ],
    };
  });
}

function bronze(id: string, title: string, placeholder: boolean, subtitle?: string): LaunchpadBronze {
  return { id, title, placeholder, tasks: placeholderTasks(id), ...(subtitle ? { subtitle } : {}) };
}

function structureSilvers(level: Exclude<ServiceFloorLevel, 1>): LaunchpadSilver[] {
  return SERVICE_FLOOR_STRUCTURE[level].map((s, i) => ({
    id: `l${level}-s${i + 1}`,
    title: s.title,
    placeholder: true,
    bronzes: s.bronzes.map((title, j) => bronze(`l${level}-s${i + 1}-b${j + 1}`, title, true)),
  }));
}

function floor(level: ServiceFloorLevel, silvers: LaunchpadSilver[]): LaunchpadFloor {
  return {
    level,
    name: serviceFloorName(level),
    floorType: "corridor",
    gold: { id: `l${level}-gold`, title: serviceLevelOutcome(level) },
    silvers,
  };
}

/**
 * Six floors (L1–L6). Window count equals silver count per floor.
 * L1 silvers are replaced by the load (Define, Set your goals, The Brand).
 * L2 product silver is replaced by the load. Pricing stays a structure plaque;
 * Know your cost, Set the price, and jobs are test builds. Competitor
 * research stays a locked placeholder and does not block those doors.
 */
/** Dog walking only: replace the Pricing doors that have a test build. */
function withPricingBuilds(payload: LaunchpadVenturePayload): LaunchpadVenturePayload {
  return {
    ...payload,
    floors: payload.floors.map((floor) =>
      floor.level !== 2
        ? floor
        : {
            ...floor,
            silvers: floor.silvers.map((silver) => {
              if (silver.id === "l2-s1") {
                const rest = { ...silver };
                delete rest.wrapUp;
                return { ...rest, bronzes: [offerBronze(), customerBronze()] };
              }
              if (silver.id !== "l2-s2") return silver;
              return {
                ...silver,
                bronzes: silver.bronzes.map((door) => {
                  if (door.id === "l2-s2-b1") return dogWalkingKnowYourCostBronze();
                  if (door.id === "l2-s2-b2") return competitorBronze();
                  if (door.id === "l2-s2-b3") return dogWalkingSetPriceBronze();
                  if (door.id === "l2-s2-b4") return dogWalkingJobsCoverBronze();
                  return door;
                }),
              };
            }),
          },
    ),
  };
}

export function launchpadTestVentureSeed(ventureId: string = LAUNCHPAD_SEED_VENTURE_ID): LaunchpadVenturePayload {
  const base = launchpadSeedBase(ventureId);
  if (ventureId !== DOG_WALKING_LOAD.ventureId) return base;
  return withPricingBuilds(overlayLoad(base, DOG_WALKING_LOAD));
}

export function launchpadSeedBase(ventureId: string = LAUNCHPAD_SEED_VENTURE_ID): LaunchpadVenturePayload {
  return {
    schemaVersion: LAUNCHPAD_PAYLOAD_SCHEMA_VERSION,
    ventureId,
    floors: [
      floor(1, [
        {
          id: "l1-s1",
          title: "Define the business",
          placeholder: false,
          bronzes: [
            bronze("l1-s1-b1", "Pick what kind of business you'll run", false),
            bronze("l1-s1-b2", "Find the why", false),
            bronze("l1-s1-b3", "Know your impact", false),
          ],
        },
        {
          id: "l1-s2",
          title: "Set your goals",
          placeholder: false,
          bronzes: [bronze("l1-s2-b1", "Set your goals", false)],
        },
      ]),
      // L2: product screens overlay from load. Pricing keeps its Final door
      // titles; Know your cost is a real test task. Locked identity is not on a floor.
      floor(2, [
        {
          id: "l2-s1",
          title: "The product and its buyers",
          placeholder: false,
          bronzes: [
            bronze("l2-s1-b1", "Decide what to sell", false),
            bronze("l2-s1-b2", "Know who your customers are", false),
          ],
        },
        ...structureSilvers(2).slice(1), // Pricing → l2-s2; dog walking replaces Know your cost after the load overlay
      ]),
      floor(3, structureSilvers(3)),
      floor(4, structureSilvers(4)),
      floor(5, structureSilvers(5)),
      floor(6, structureSilvers(6)),
    ],
  };
}
