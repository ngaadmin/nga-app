/**
 * TEST-ONLY data for the Launchpad venture flow (building → corridor → doors →
 * task list → workbook). Used by `/test-launchpad-venture` on preview and
 * local dev only.
 *
 * Titles marked `placeholder: true` are TBC and must not ship as real copy.
 * Level 1 follows Storybird's 3 Nov core structure: two silvers, "Define the
 * business" (3 bronzes) and "Set your goals" (1 bronze).
 */

export type VentureTestTask = {
  id: string;
  title: string;
  /** Workbook content is TBC; the blocks render as labelled placeholders. */
  placeholder: true;
};

export type VentureTestBronze = {
  id: string;
  title: string;
  /** Optional short line under the door title. */
  subtitle?: string;
  placeholder: boolean;
  tasks: readonly VentureTestTask[];
};

export type VentureTestSilver = {
  id: string;
  title: string;
  placeholder: boolean;
  bronzes: readonly VentureTestBronze[];
};

export type VentureTestFloor = {
  level: number;
  /** Short floor name used on the building and in the lift, e.g. "Planning". */
  name: string;
  goal: string;
  silvers: readonly VentureTestSilver[];
};

/** Tasks per bronze for the test build. Real counts are TBC (2 to 4 each). */
export const PLACEHOLDER_TASKS_PER_BRONZE = 3;

function placeholderTasks(prefix: string): VentureTestTask[] {
  return Array.from({ length: PLACEHOLDER_TASKS_PER_BRONZE }, (_, i) => ({
    id: `${prefix}-t${i + 1}`,
    title: `Task ${i + 1}`,
    placeholder: true as const,
  }));
}

function bronze(id: string, title: string, placeholder: boolean, subtitle?: string): VentureTestBronze {
  return { id, title, placeholder, tasks: placeholderTasks(id), ...(subtitle ? { subtitle } : {}) };
}

function placeholderBronzes(prefix: string): VentureTestBronze[] {
  return [1, 2, 3].map((n) => bronze(`${prefix}-b${n}`, `Bronze ${n}`, true));
}

function placeholderSilvers(prefix: string, count: number): VentureTestSilver[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-s${i + 1}`,
    title: `Silver ${i + 1}`,
    placeholder: true,
    bronzes: placeholderBronzes(`${prefix}-s${i + 1}`),
  }));
}

/**
 * Five floors, L1 Vision and Goals to L5 Growing. The window count on each
 * floor equals its silver count (L1 is 2 per the 3 Nov core structure; then 3, 6, 4, 4).
 */
export const VENTURE_TEST_FLOORS: readonly VentureTestFloor[] = [
  {
    level: 1,
    name: "Vision and Goals",
    goal: "Know what type of business to start, why it matters to you, and the goals you'll aim for.",
    silvers: [
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
    ],
  },
  {
    level: 2,
    name: "Planning",
    goal: "Readiness to make",
    silvers: placeholderSilvers("l2", 3),
  },
  {
    level: 3,
    name: "Making",
    goal: "Level 3 goal (placeholder)",
    silvers: placeholderSilvers("l3", 6),
  },
  {
    level: 4,
    name: "Selling",
    goal: "Level 4 goal (placeholder)",
    silvers: placeholderSilvers("l4", 4),
  },
  {
    level: 5,
    name: "Growing",
    goal: "Level 5 goal (placeholder)",
    silvers: placeholderSilvers("l5", 4),
  },
];

export function getVentureTestFloor(level: number): VentureTestFloor {
  const floor = VENTURE_TEST_FLOORS.find((f) => f.level === level);
  if (!floor) throw new Error(`Unknown test floor ${level}`);
  return floor;
}
