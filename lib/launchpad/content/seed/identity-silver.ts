/**
 * Locked identity build (historical seed id l2-s2). Overlay renumbers to
 * l1-s3 The Brand (name then logo). Kept off the floor list so L2 Pricing can
 * use id l2-s2.
 */
import { BUSINESS_NAME_MAX } from "@/lib/launchpad/content/identity";
import type {
  LaunchpadSilver,
  LaunchpadTask,
  LaunchpadTaskScreen,
} from "@/lib/launchpad/content/types";

/** Answer key the identity pickers and wrap-up save under. */
export const IDENTITY_ANSWER_KEY = "l2-s2-identity";

function pickerTask(id: string, title: string, ctaLabel: string, screens: LaunchpadTaskScreen[]): LaunchpadTask {
  return { id, title, placeholder: false, ctaLabel, screens };
}

/**
 * Locked identity build (seed id l2-s2). AC13 (Cath, 5 Nov): Design the logo
 * first, then Name the business, so the name color can use the logo color.
 * Bronze ids keep their seed numbers (logo b2, name b1); only the order
 * changed. Overlay renumbers to l1-s3 (The Brand).
 */
export function identitySilver(): LaunchpadSilver {
  const key = IDENTITY_ANSWER_KEY;
  return {
    id: "l2-s2",
    title: "The Brand",
    placeholder: false,
    bronzes: [
      {
        id: "l2-s2-b2",
        title: "Design your logo",
        subtitle: "Pick a shape, a color and an icon",
        placeholder: false,
        tasks: [
          pickerTask("l2-s2-b2-t1", "Design your logo", "Continue", [
            {
              id: "l2-s2-b2-t1-shape",
              type: "logo-picker",
              answerKey: key,
              step: "shape",
              prompt: "Pick a shape for your logo.",
              options: [
                { id: "circle", label: "Circle" },
                { id: "shield", label: "Shield" },
                { id: "hexagon", label: "Hexagon" },
              ],
            },
            {
              id: "l2-s2-b2-t1-color",
              type: "logo-picker",
              answerKey: key,
              step: "color",
              prompt: "Pick a color that fits your business.",
              options: [
                { id: "navy", label: "Navy", hex: "#1D3F9A" },
                { id: "light-blue", label: "Light blue", hex: "#3FB7DA" },
                { id: "orange", label: "Orange", hex: "#FFA503" },
                { id: "pale-olive", label: "Pale olive", hex: "#BAC593" },
              ],
            },
            {
              id: "l2-s2-b2-t1-icon",
              type: "logo-picker",
              answerKey: key,
              step: "icon",
              prompt: "Pick an icon that shows what you do.",
              iconSets: {
                "dog-walking": [
                  { id: "paw", label: "Paw" },
                  { id: "bone", label: "Bone" },
                  { id: "dog-face", label: "Dog face" },
                ],
                "friendship-bracelets": [
                  { id: "bead-strand", label: "Bead strand" },
                  { id: "knot", label: "Knot" },
                  { id: "heart-loop", label: "Heart loop" },
                ],
              },
              fallbackVentureId: "dog-walking",
            },
          ]),
        ],
      },
      {
        id: "l2-s2-b1",
        title: "Name your business",
        subtitle: "Choose a name, a font and a color",
        placeholder: false,
        tasks: [
          pickerTask("l2-s2-b1-t1", "Name your business", "Save to my workbook", [
            {
              id: "l2-s2-b1-t1-name",
              type: "name-picker",
              answerKey: key,
              step: "name",
              heading: "Enter your business name",
              prompt: `Keep it short: up to ${BUSINESS_NAME_MAX} letters and spaces.`,
              inputLabel: "Business name",
              placeholderText: "Type your business name",
              maxLength: BUSINESS_NAME_MAX,
            },
            {
              id: "l2-s2-b1-t1-font",
              type: "name-picker",
              answerKey: key,
              step: "font",
              heading: "Choose a font",
              prompt: "Pick the lettering for your name.",
              options: [
                { id: "poppins-bold", label: "Bold" },
                { id: "fredoka-semibold", label: "Rounded" },
                { id: "pacifico", label: "Script" },
              ],
            },
            {
              id: "l2-s2-b1-t1-name-color",
              type: "name-picker",
              answerKey: key,
              step: "nameColor",
              heading: "Choose a font color",
              prompt: "What color should your name be?",
              options: [
                { id: "logo", label: "Logo color" },
                { id: "ink", label: "Dark ink" },
              ],
            },
          ]),
        ],
      },
    ],
    wrapUp: {
      type: "identity-wrap-up",
      answerKey: key,
      heading: "Your business identity",
      body: "When it looks right, tap Continue.",
      finalizeLabel: "Continue",
      placeholder: true,
    },
  };
}

/** Singleton used by overlayLoad when seed floors no longer host id l2-s2. */
export const SEED_LOCKED_IDENTITY_SILVER: LaunchpadSilver = identitySilver();
