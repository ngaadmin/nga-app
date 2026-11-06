/**
 * Set the price and Work out how many jobs (framework rows 24–25).
 * Dog-walking test build. Competitor research is still a locked door, so a
 * card with no saved range greys "what others charge".
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
        "Your price has to cover your job costs and still leave something for you. A fair price also has to make sense next to what others charge for the same kind of job. Charity giving is planned later, in marketing and budgeting, and is not taken off this price.",
      guidance:
        "Type a price and watch what you keep: your price minus what that job costs you. For example, a walk at $15 with $0.40 of restock leaves you $14.60. If what you keep is too small, try a higher price.",
      othersMissing: "What others charge isn't in yet.",
      keepLabel: "You keep",
      costLabel: "Cost",
      lowKeep: "Try a higher price so you keep something.",
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
      context: "Your start-up gear has to be paid for before the business really starts making money. Knowing how many jobs that takes gives you a clear first target.",
      guidance:
        "Each job leaves you a little after job costs. Divide your start-up total by what you keep and round up. With more than one service, pick a typical week. Be realistic about school, homework, and a parent's time.",
      singlePrompt: "How many jobs can you do each week?",
      multiPrompt: "Build a typical week. How many of each job will you do?",
      covered: "Your start-up costs are already covered.",
      needPrice: "Finish Set the price first. Each service needs a price that leaves you something.",
      weeklyLabel: "You keep this week",
      weeksLabel: "Weeks to cover start-up",
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
