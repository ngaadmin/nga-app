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
 * Level 2 (Planning): silver 1 "Know the product and its buyers" (bronzes
 * still placeholders) and silver 2 "Build your identity" with two picker
 * bronzes, "Design your logo" and "Name your business", plus an identity
 * wrap-up. Their copy is DRAFT (Storybird may refine).
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
  LaunchpadTaskScreen,
  LaunchpadVenturePayload,
} from "@/lib/launchpad/content/types";
import { BUSINESS_NAME_MAX } from "@/lib/launchpad/content/identity";

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

/** One task holding one picker screen. */
function pickerTask(id: string, title: string, screen: LaunchpadTaskScreen): LaunchpadTask {
  return { id, title, placeholder: false, screens: [screen] };
}

/** Answer key the identity pickers and wrap-up save under. */
export const IDENTITY_ANSWER_KEY = "l2-s2-identity";

/**
 * L2 silver 2 "Build your identity". Every step is one task (one workbook
 * page) so Previous / Next and the task dots give Back and change for free.
 * DRAFT copy. Icon art is PLACEHOLDER pending Jasper's icons.
 */
function identitySilver(): LaunchpadSilver {
  const key = IDENTITY_ANSWER_KEY;
  return {
    id: "l2-s2",
    title: "Build your identity",
    placeholder: false,
    bronzes: [
      {
        id: "l2-s2-b1",
        title: "Design your logo",
        subtitle: "Pick a shape, a color and an icon",
        placeholder: false,
        tasks: [
          pickerTask("l2-s2-b1-t1", "Pick a shape", {
            id: "l2-s2-b1-t1-s1",
            type: "logo-picker",
            answerKey: key,
            step: "shape",
            prompt: "Your logo is a sticker. Which shape do you like?",
            options: [
              { id: "round", label: "Round sticker" },
              { id: "rounded-square", label: "Rounded square sticker" },
            ],
          }),
          pickerTask("l2-s2-b1-t2", "Pick a color", {
            id: "l2-s2-b1-t2-s1",
            type: "logo-picker",
            answerKey: key,
            step: "color",
            prompt: "Pick the color for your sticker.",
            options: [
              { id: "navy", label: "Navy", hex: "#031F82" },
              { id: "teal", label: "Teal", hex: "#0A8FA8" },
              { id: "coral-red", label: "Coral red", hex: "#E5484D" },
              { id: "green", label: "Green", hex: "#2E9E5B" },
              { id: "purple", label: "Purple", hex: "#7B4FD6" },
            ],
          }),
          pickerTask("l2-s2-b1-t3", "Pick an icon", {
            id: "l2-s2-b1-t3-s1",
            type: "logo-picker",
            answerKey: key,
            step: "icon",
            prompt: "Pick an icon that shows what you do.",
            iconSets: {
              "dog-walking": [
                { id: "paw", label: "Paw" },
                { id: "leash", label: "Leash" },
                { id: "bone", label: "Dog bone" },
              ],
              "friendship-bracelets": [
                { id: "bead", label: "Bead" },
                { id: "heart", label: "Heart" },
                { id: "braid", label: "Braided loop" },
              ],
            },
            fallbackVentureId: "dog-walking",
          }),
        ],
      },
      {
        id: "l2-s2-b2",
        title: "Name your business",
        subtitle: "Choose a name, a font and a color",
        placeholder: false,
        tasks: [
          pickerTask("l2-s2-b2-t1", "Name it", {
            id: "l2-s2-b2-t1-s1",
            type: "name-picker",
            answerKey: key,
            step: "name",
            prompt: `Give your business a name. Keep it short: up to ${BUSINESS_NAME_MAX} letters and spaces.`,
            inputLabel: "Business name",
            placeholderText: "Type your business name",
            maxLength: BUSINESS_NAME_MAX,
          }),
          pickerTask("l2-s2-b2-t2", "Pick a font", {
            id: "l2-s2-b2-t2-s1",
            type: "name-picker",
            answerKey: key,
            step: "font",
            prompt: "Pick the lettering for your name.",
            options: [
              { id: "poppins-bold", label: "Bold" },
              { id: "fredoka-semibold", label: "Rounded" },
              { id: "pacifico", label: "Script" },
            ],
          }),
          pickerTask("l2-s2-b2-t3", "Pick a name color", {
            id: "l2-s2-b2-t3-s1",
            type: "name-picker",
            answerKey: key,
            step: "nameColor",
            prompt: "Last step: what color should your name be?",
            options: [
              { id: "logo", label: "Logo color" },
              { id: "ink", label: "Dark ink" },
            ],
          }),
        ],
      },
    ],
    wrapUp: {
      type: "identity-wrap-up",
      answerKey: key,
      heading: "Your business identity",
      body: "Tap a choice below to change it. When it looks right, tap Finalize.",
      finalizeLabel: "Finalize",
      placeholder: true,
    },
  };
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
      floor(2, "Planning", "Readiness to make", [
        { ...placeholderSilvers("l2", 1)[0]!, title: "Know the product and its buyers", placeholder: false },
        identitySilver(),
      ]),
      floor(3, "Making", "Level 3 goal (placeholder)", placeholderSilvers("l3", 4)),
      floor(4, "Selling", "Level 4 goal (placeholder)", placeholderSilvers("l4", 3)),
      floor(5, "Growing", "Level 5 goal (placeholder)", placeholderSilvers("l5", 2)),
      floor(6, "Budgeting", "Level 6 goal (placeholder)", placeholderSilvers("l6", 3)),
    ],
  };
}
