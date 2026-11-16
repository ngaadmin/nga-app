/**
 * Set the price and Work out how many jobs (framework rows 24–25).
 * Source: Service Business Framework md5 6104be84. Keep is price minus
 * cost per job. Charity percent, charity share, and cause are not on
 * these screens. Rows 15–17 preset menus are not wired yet.
 * Competitor research is still a locked door, so a card with no saved
 * range greys "what others charge".
 */
import type { LaunchpadBronze, LaunchpadJobsCoverScreen, LaunchpadSetPriceScreen } from "@/lib/launchpad/content/types";

export const SET_PRICE_ANSWER_KEY = "l2-price";
export const JOBS_COVER_ANSWER_KEY = "l2-jobs";

/** Single-service week picks (sheet columns N25–T25). */
export const JOBS_PER_WEEK_OPTIONS = [
  { id: "n25", jobs: 1, label: "1 job a week" },
  { id: "o25", jobs: 2, label: "2 jobs a week" },
  { id: "p25", jobs: 3, label: "3 jobs a week" },
  { id: "q25", jobs: 4, label: "4 jobs a week" },
  { id: "r25", jobs: 5, label: "5 jobs a week" },
  { id: "s25", jobs: 6, label: "6 jobs a week" },
  { id: "t25", jobs: 7, label: "7 jobs a week" },
] as const;

export function dogWalkingSetPriceScreen(): LaunchpadSetPriceScreen {
  return {
    id: "l2-s2-b3-t1-price",
    type: "set-price",
    answerKey: SET_PRICE_ANSWER_KEY,
    costsFrom: "l2-costs",
    servicesFrom: "l1-offer",
    copy: {
      context:
        "The price you charge must cover your job costs and still leave something for you as profit. A fair price also has to make sense compared to what others charge for the same kind of job.",
      guidance:
        "Start with the prices you found other businesses charge for the services you researched and the tool will tell you how much you will have left after you cover the costs to do that job. Then adjust your prices to what you want to charge your customers. Later on, the tool will also help you calculate how many jobs you need to do at the prices you've set, in order to make back the money you invested to start your business.",
      howTo:
        "For example, a 30-minute walk at $15: restock for that walk is $0.30, so you keep $14.70. If what you keep is too small, try a higher price. You can charge more if you offer something extra.",
      credit: "Voice created with Grok",
      eyebrow: "Pricing",
      othersMissing: "What others offer isn't in yet.",
      keepLabel: "You keep",
      costLabel: "Cost",
      lowKeep: "Your price doesn't cover your costs yet. Try a higher price.",
      emptyServices: "You have not chosen a service yet. You can still continue.",
    },
  };
}

export function dogWalkingJobsCoverScreen(): LaunchpadJobsCoverScreen {
  return {
    id: "l2-s2-b4-t1-jobs",
    type: "jobs-to-cover",
    answerKey: JOBS_COVER_ANSWER_KEY,
    costsFrom: "l2-costs",
    priceFrom: SET_PRICE_ANSWER_KEY,
    weekOptions: JOBS_PER_WEEK_OPTIONS,
    copy: {
      context: "Your start-up gear has to be paid for before the business really starts making money. Knowing how many jobs that takes gives you a clear target for when you can pay off those costs.",
      guidance:
        "As we've just seen, each job costs a little. What's left after those costs are covered is what you can use to pay off your start-up costs. You can repay yourself, or someone else if you choose to borrow some money, as soon as possible, or pay it off over time, so there is also money left for other things.",
      weekIntro:
        "Let's calculate how many jobs you need to do, to cover your start-up costs. First, set how many jobs you hope to do in a good week. The tool then tells you how many weeks it would take to fully repay the start-up costs, if you put all the money you made towards paying it off.",
      eyebrow: "Pricing",
      singlePrompt: "How many jobs can you do each week?",
      multiPrompt: "Build a typical week. How many of each job will you do?",
      covered: "Your start-up costs are already covered.",
      needPrice: "Finish Set the price first. Each service needs a price that leaves you something.",
      weeklyLabel: "Weekly keep",
      startupLabel: "Start-up total",
      weeksLabel: "About",
    },
  };
}

export function dogWalkingSetPriceBronze(): LaunchpadBronze {
  return {
    id: "l2-s2-b3",
    title: "Set the price",
    placeholder: false,
    tasks: [
      {
        id: "l2-s2-b3-t1",
        title: "Set the price",
        placeholder: false,
        screens: [dogWalkingSetPriceScreen()],
      },
    ],
  };
}

export function dogWalkingJobsCoverBronze(): LaunchpadBronze {
  return {
    id: "l2-s2-b4",
    title: "Work out how many jobs cover your costs",
    placeholder: false,
    tasks: [
      {
        id: "l2-s2-b4-t1",
        title: "Work out how many jobs cover your costs",
        placeholder: false,
        screens: [dogWalkingJobsCoverScreen()],
      },
    ],
  };
}
