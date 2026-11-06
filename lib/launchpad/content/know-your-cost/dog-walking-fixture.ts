/**
 * Dog-walking Know your cost presets from the Final Service Business
 * Framework (sheet "Final Service Business Framewor").
 *
 * Row 18 is the parent bronze: Marketing & setup defaults in N18–P18.
 * Rows 19–23 are lookup rows only (not learner screens), one per
 * business_offer. Starter gear is the union of those rows for the services
 * the learner already chose, deduped by item name. Restock for screen D
 * comes from that service's Fields list.
 */
import type { LaunchpadBronze, LaunchpadKnowYourCostScreen } from "@/lib/launchpad/content/types";

/** Flip to false to skip the slim totals screen. The hub Continue goes straight to the workbook. */
export const SHOW_COST_TOTALS = true;

export function dogWalkingKnowYourCostScreen(): LaunchpadKnowYourCostScreen {
  return {
    id: "l2-s2-b1-t1-costs",
    type: "know-your-cost",
    answerKey: "l2-costs",
    servicesFrom: "l1-offer",
    showTotals: SHOW_COST_TOTALS,
    sourceNote:
      "Content from Final framework rows 18–23. Row 18 is Marketing and setup. Rows 19–23 are per-service starter gear and restock lookups.",
    copy: {
      hubIntro: "Figure out what you spend once to start, and what each job costs you.",
      startupCard: "Things you buy once before your first job.",
      ongoingCard: "Costs that repeat each job, for every service you offer.",
      startupIntro: "Buy once before your first job. Put 0 if you already have it. Remove any you don't need.",
      marketingLabel: "Marketing & setup",
      starterLabel: "Starter gear",
      starterNote: "Buy once to get started. You will keep using these on jobs.",
      ongoingIntro: "These costs repeat each job. Tap Calculate the cost for each service. Put 0 for anything you already have.",
      serviceIntro:
        "What do you restock each time you do this job? Amounts are small. Change any you need. Put 0 if you already have it, or remove a row you don't need.",
      totalsIntro: "Quick check before your handbook. Start-up is what you spend to open; ongoing costs repeat each job.",
      grandNote: "Start-up only. Ongoing costs stay per job. You'll use them when you set your price.",
      workbookHint: "You'll use these when you set your price. Totals stay calculated.",
      hubWait: "Continue stays off until both sections are done.",
    },
    // Row 18, N–P. Whole dollars.
    marketing: [
      { id: "flyers", label: "Flyers or business cards", amount: 15 },
      { id: "logo-shirt", label: "T-shirt with your logo", amount: 22 },
      { id: "owners-notebook", label: "Notebook for owners' notes", amount: 5 },
    ],
    // Rows 19–23 starter gear. Shared names stay as separate rows so the
    // union can dedupe by item name (Treat pouch, Treats starter pack).
    starterGear: [
      { id: "walk-bowl", label: "Water bottle and fold-up bowl", amount: 12, serviceIds: ["dog-walking"] },
      { id: "walk-poop-pack", label: "Poop bags (big pack)", amount: 8, serviceIds: ["dog-walking"] },
      { id: "walk-treat-pouch", label: "Treat pouch", amount: 10, serviceIds: ["dog-walking"] },
      { id: "walk-treats-pack", label: "Treats (starter pack)", amount: 10, serviceIds: ["dog-walking"] },
      { id: "walk-reflective", label: "Reflective band or clip-on light", amount: 6, serviceIds: ["dog-walking"] },
      { id: "groom-shampoo", label: "Dog shampoo", amount: 8, serviceIds: ["grooming"] },
      { id: "groom-towels", label: "Towels (2-pack)", amount: 12, serviceIds: ["grooming"] },
      { id: "groom-brush", label: "Slicker brush", amount: 10, serviceIds: ["grooming"] },
      { id: "groom-clippers", label: "Nail clippers", amount: 9, serviceIds: ["grooming"] },
      { id: "train-treat-pouch", label: "Treat pouch", amount: 10, serviceIds: ["dog-training"] },
      { id: "train-treats-pack", label: "Treats (starter pack)", amount: 10, serviceIds: ["dog-training"] },
      { id: "train-clicker", label: "Clicker", amount: 5, serviceIds: ["dog-training"] },
      { id: "train-lead", label: "Training lead", amount: 15, serviceIds: ["dog-training"] },
    ],
    // Fields restock lists on rows 19–23. Dog sitting has restock and no
    // starter gear. Manage bookings has neither.
    ongoing: [
      {
        serviceId: "dog-walking",
        items: [
          { id: "poop-bags", label: "Poop bags", amount: 0.05 },
          { id: "treats", label: "Treats", amount: 0.25 },
          { id: "sanitizer-top-up", label: "Hand sanitizer top-up", amount: 0.1 },
        ],
      },
      {
        serviceId: "grooming",
        items: [
          { id: "shampoo-top-up", label: "Shampoo top-up", amount: 0.4 },
          { id: "towel-wash", label: "Towel wash share", amount: 0.25 },
          { id: "ear-wipe", label: "Ear wipe", amount: 0.15 },
        ],
      },
      {
        serviceId: "dog-sitting",
        items: [
          { id: "treats", label: "Treats", amount: 0.3 },
          { id: "poop-bags", label: "Poop bags", amount: 0.1 },
        ],
      },
      {
        serviceId: "dog-training",
        items: [
          { id: "treats", label: "Treats", amount: 0.35 },
          { id: "poop-bags", label: "Poop bags", amount: 0.05 },
        ],
      },
      { serviceId: "manage-bookings-for-others", items: [] },
    ],
  };
}

export function dogWalkingKnowYourCostBronze(): LaunchpadBronze {
  return {
    id: "l2-s2-b1",
    title: "Know your cost",
    placeholder: false,
    tasks: [
      {
        id: "l2-s2-b1-t1",
        title: "Know your cost",
        placeholder: false,
        screens: [dogWalkingKnowYourCostScreen()],
      },
    ],
  };
}
