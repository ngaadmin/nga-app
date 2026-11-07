/**
 * Service-business level outcome statements shown when the lift opens on a
 * floor (`floor.gold.title`). Swappable data: Storybird drafts; Cath has not
 * approved them yet (decision D26). Do not hard-code these strings in UI.
 *
 * Floors 1–6 are wired in the building. Level 7 Budgeting is the rooftop
 * (future work, not a floor yet) — its draft is kept here for when it lands.
 */

export const SERVICE_FLOOR_NAMES = {
  1: "Vision and Goals",
  2: "Planning",
  3: "Getting Ready",
  4: "Sales",
  5: "Delivery",
  6: "Growing",
} as const;

/** Draft outcomes (Storybird, 5 Nov 2026). Status: draft-pending-cath. */
export const SERVICE_LEVEL_OUTCOMES_DRAFT = {
  1: "Know what your business offers, why it matters to you, the goals you'll aim for, and your brand.",
  2: "Know what you'll offer, who wants it, what it costs, and what to charge.",
  3: "Know how to do it, get the money and gear you need, then practice and fine-tune it.",
  4: "Know where to find customers, what to say, and how to tell people about it.",
  5: "Take bookings, do the job well, get paid, and know what you earned.",
  6: "Know what to improve, how to keep customers coming back, where to grow, and how to fund it.",
  /** Rooftop / future floor — not wired in the building yet. */
  7: "Know what you owe, what you keep, and where every dollar goes.",
} as const;

export type ServiceFloorLevel = 1 | 2 | 3 | 4 | 5 | 6;

export function serviceLevelOutcome(level: ServiceFloorLevel): string {
  return SERVICE_LEVEL_OUTCOMES_DRAFT[level];
}

export function serviceFloorName(level: ServiceFloorLevel): string {
  return SERVICE_FLOOR_NAMES[level];
}

/**
 * Silvers and bronze door titles for floors 2–6 from the Final Service
 * Business Framework sheet (Revised order where Final D/E notes say so).
 * Module 1 (floor 1) is built from the load, not listed here.
 */
export const SERVICE_FLOOR_STRUCTURE: Readonly<
  Record<
    Exclude<ServiceFloorLevel, 1>,
    readonly { title: string; bronzes: readonly string[] }[]
  >
> = {
  2: [
    {
      title: "The product and its buyers",
      bronzes: ["Decide what to sell", "Know who your customers are"],
    },
    {
      title: "Pricing",
      bronzes: [
        "Know your cost",
        "Research what competitors offer and what they charge",
        "Set the price",
        "Work out how many jobs cover your costs",
      ],
    },
  ],
  3: [
    {
      title: "Learn the customer journey",
      bronzes: ["Attract the customer", "Agree the job", "Deliver the job", "Wrap-up"],
    },
    {
      title: "Test & Tweak",
      bronzes: ["Do the practice run", "Polish your service"],
    },
  ],
  4: [
    {
      title: "Marketing your business",
      bronzes: [
        "Pick the sales channel(s)",
        "Develop your marketing materials",
        "Develop and practice your pitch",
        "Tell people about it",
      ],
    },
  ],
  5: [
    {
      title: "Plan the work",
      bronzes: ["Take orders", "Plan and schedule the job", "Tell customers what to expect"],
    },
    { title: "Do the job", bronzes: ["Do the job", "Take payment", "Ask for customer feedback"] },
    { title: "Know your profit", bronzes: ["Record all sales", "Calculate what's left"] },
  ],
  6: [
    {
      title: "Continuous Improvement",
      bronzes: ["Make improvements based on customer feedback"],
    },
    {
      title: "New Opportunities",
      bronzes: [
        "Keep customers coming back",
        "Find new service areas",
        "Find new services to add",
        "Know how to fund it",
      ],
    },
  ],
};

/** Future work note: Level 7 Budgeting becomes the rooftop, not a seventh floor. */
export const BUDGETING_ROOFTOP_NOTE =
  "Level 7 Budgeting (outcome draft kept in SERVICE_LEVEL_OUTCOMES_DRAFT[7]) is the rooftop finish — not wired as a building floor yet.";
