/**
 * TEST-ONLY bundled seed for Launchpad venture content, in the database
 * payload shape. Converted 1:1 from the old venture-test-structure.ts.
 * The loader reads it through the same validation path as a database
 * version while LAUNCHPAD_CONTENT_DB is off (see content-flag.ts).
 *
 * Six floors per Jasper's r4 building (4 Nov): L1 Vision and Goals (2),
 * L2 Planning (2), L3 Making (4), L4 Selling (3), L5 Growing (2), L6 Budgeting
 * (3), 16 silvers in total. One building window per silver.
 *
 * Titles marked `placeholder: true` are TBC and must not ship as real copy.
 * Level 1 follows Storybird's 3 Nov core structure: two silvers, "Define the
 * business" (3 bronzes) and "Set your goals" (1 bronze).
 *
 * Ids are the same as before, so progress saved in the browser
 * (`lp-venture-test:v1:<venture>`) still lines up.
 */
import { LAUNCHPAD_PAYLOAD_SCHEMA_VERSION } from "@/lib/launchpad/content/schema-version";
import type {
  LaunchpadBronze,
  LaunchpadFloor,
  LaunchpadSilver,
  LaunchpadTask,
  LaunchpadVenturePayload,
} from "@/lib/launchpad/content/types";

/** Tasks per bronze for the test build. Real counts are TBC (2 to 4 each). */
export const PLACEHOLDER_TASKS_PER_BRONZE = 3;

/** The venture the seed is written for. The seed source serves it for any test venture. */
export const LAUNCHPAD_SEED_VENTURE_ID = "dog-walking";

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

function placeholderBronzes(prefix: string): LaunchpadBronze[] {
  return [1, 2, 3].map((n) => bronze(`${prefix}-b${n}`, `Bronze ${n}`, true));
}

function placeholderSilvers(prefix: string, count: number): LaunchpadSilver[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-s${i + 1}`,
    title: `Silver ${i + 1}`,
    placeholder: true,
    bronzes: placeholderBronzes(`${prefix}-s${i + 1}`),
  }));
}

function floor(level: number, name: string, gold: string, silvers: LaunchpadSilver[]): LaunchpadFloor {
  return { level, name, floorType: "corridor", gold: { id: `l${level}-gold`, title: gold }, silvers };
}

/**
 * Six floors, L1 Vision and Goals to L6 Budgeting (the top floor). The window
 * count on each floor equals its silver count: 2, 2, 4, 3, 2, 3.
 */
export function launchpadTestVentureSeed(ventureId: string = LAUNCHPAD_SEED_VENTURE_ID): LaunchpadVenturePayload {
  return {
    schemaVersion: LAUNCHPAD_PAYLOAD_SCHEMA_VERSION,
    ventureId,
    floors: [
      floor(1, "Vision and Goals", "Know what type of business to start, why it matters to you, and the goals you'll aim for.", [
        {
          id: "l1-s1",
          title: "Define the business",
          placeholder: false,
          bronzes: [
            bronze("l1-s1-b1", "Pick a business type", false),
            bronze("l1-s1-b2", "Find the why", false),
            bronze("l1-s1-b3", "Pick a cause", false),
          ],
        },
        {
          id: "l1-s2",
          title: "Set your goals",
          placeholder: false,
          bronzes: [bronze("l1-s2-b1", "Set goals", false, "Your money goal and how much to donate")],
        },
      ]),
      floor(2, "Planning", "Readiness to make", placeholderSilvers("l2", 2)),
      floor(3, "Making", "Level 3 goal (placeholder)", placeholderSilvers("l3", 4)),
      floor(4, "Selling", "Level 4 goal (placeholder)", placeholderSilvers("l4", 3)),
      floor(5, "Growing", "Level 5 goal (placeholder)", placeholderSilvers("l5", 2)),
      floor(6, "Budgeting", "Level 6 goal (placeholder)", placeholderSilvers("l6", 3)),
    ],
  };
}
