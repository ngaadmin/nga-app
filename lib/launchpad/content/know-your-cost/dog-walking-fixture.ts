/**
 * PROVISIONAL dog-walking cost catalog for the test route.
 *
 * Starter-gear names (except the two r5 extras called out below) are the
 * Final framework row 17 options. The sheet does not yet say which service
 * each item belongs to, and it has no marketing split or restock cents.
 * Those links, the marketing rows, the amounts, and the per-service restock
 * lines are sample data until Storybird fills the framework. Do not treat
 * them as the product catalog.
 *
 * Dog sitting has no starter gear (framework notes on row 17).
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
      "Provisional test fixture. Starter-gear names follow Final framework row 17. Amounts, marketing rows, service links, and restock lines are sample data until Storybird fills the framework.",
    copy: {
      hubIntro: "Figure out what you spend once to start, and what each job costs you.",
      startupCard: "Things you buy once before your first job.",
      ongoingCard: "Costs that repeat each job, for every service you offer.",
      startupIntro: "Buy once before your first job. Put 0 if you already have it. Remove any you don't need.",
      marketingLabel: "Marketing & setup",
      starterLabel: "Starter gear",
      starterNote: "Buy once to get started — you'll keep using these on jobs.",
      ongoingIntro: "These costs repeat each job. Tap Calculate the cost for each service. Put 0 for anything you already have.",
      serviceIntro:
        "What do you restock for one {service} job? Amounts are small — change any you need. Put 0 if you already have it, or remove a row you don't need.",
      totalsIntro: "Quick check before your workbook. Start-up is what you spend to open; ongoing costs repeat each job.",
      grandNote: "Start-up only. Ongoing costs stay per job — you'll use them when you set your price.",
      workbookHint: "You'll use these when you set your price. Totals stay calculated.",
      hubWait: "Continue stays off until both sections are done.",
    },
    marketing: [
      { id: "flyers", label: "Flyers or business cards", amount: 15 },
      { id: "logo-shirt", label: "T-shirt with your logo", amount: 22 },
      { id: "owners-notebook", label: "Notebook for owners' notes", amount: 5 },
    ],
    starterGear: [
      { id: "water-bowl", label: "Water bottle and fold-up bowl", amount: 12, serviceIds: ["dog-walking", "dog-training"] },
      { id: "poop-bag-pack", label: "Poop bags (big pack)", amount: 8, serviceIds: ["dog-walking"] },
      { id: "bright-top", label: "Bright or reflective top", amount: 14, serviceIds: ["dog-walking"] },
      { id: "hand-sanitizer", label: "Hand sanitizer", amount: 4, serviceIds: ["dog-walking", "dog-training", "grooming"] },
      { id: "treat-pouch", label: "Treat pouch", amount: 0, serviceIds: ["dog-walking", "dog-training"] },
      { id: "flashlight", label: "Small flashlight", amount: 9, serviceIds: ["dog-walking"] },
      { id: "treats-starter", label: "Treats (starter pack)", amount: 10, serviceIds: ["dog-walking", "dog-training"] },
      { id: "dog-shampoo", label: "Dog shampoo", amount: 8, serviceIds: ["grooming"] },
    ],
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
        serviceId: "dog-training",
        items: [
          { id: "treats", label: "Treats", amount: 0.4 },
          { id: "sanitizer-top-up", label: "Hand sanitizer top-up", amount: 0.15 },
        ],
      },
      {
        serviceId: "grooming",
        items: [{ id: "shampoo-top-up", label: "Shampoo top-up", amount: 0.35 }],
      },
      { serviceId: "dog-sitting", items: [] },
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
