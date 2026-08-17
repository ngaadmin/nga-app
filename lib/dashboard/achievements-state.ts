/**
 * Achievement content definitions.
 *
 * Consumers:
 * - Skill medals: Achievements page
 * - Money milestones (actions/savings): Vault
 * - Learning streak milestones: Settings + top-bar day count
 * - Monthly challenges + friends leaderboard: future Community hub
 *   (`components/community`)
 */

export type MoneyMilestoneCategory = "action" | "streak" | "savings";

export type MoneyMilestone = {
  id: string;
  label: string;
  category: MoneyMilestoneCategory;
  emoji: string;
  funFact: string;
};

export const MONEY_MILESTONE_ACTIONS: readonly MoneyMilestone[] = [
  {
    id: "first-savings",
    label: "First Savings",
    category: "action",
    emoji: "🐷",
    funFact:
      "Your first deposit flips the switch from spender to builder. Even $1 in a savings jar trains your brain to pause before impulse buys - that's compound mindset, not just compound interest.",
  },
  {
    id: "first-cash-out",
    label: "First Cash Out",
    category: "action",
    emoji: "💸",
    funFact:
      "Cashing out XP into real savings is the moment virtual wins become physical proof. Founders who connect effort to dollars early are 3× more likely to stick with money goals through their teens.",
  },
  {
    id: "goal-set",
    label: "Goal Set",
    category: "action",
    emoji: "🎯",
    funFact:
      "People who write down a specific money goal save faster than those who wing it. Naming the target - console, trip, gear - gives every dollar a job before it lands in your wallet.",
  },
  {
    id: "budget-created",
    label: "Budget Created",
    category: "action",
    emoji: "📋",
    funFact:
      "A budget isn't a cage - it's a game plan. Splitting income into Spend, Save, and Give jars means you choose your limits instead of wondering where the money vanished.",
  },
];

export const MONEY_MILESTONE_STREAKS: readonly MoneyMilestone[] = [
  {
    id: "streak-1-day",
    label: "1 Day",
    category: "streak",
    emoji: "🔥",
    funFact:
      "Day one is the hardest. Showing up once proves you can repeat tomorrow - and streak science says the first 3 days predict whether a habit sticks for months.",
  },
  {
    id: "streak-1-week",
    label: "1 Week",
    category: "streak",
    emoji: "🔥",
    funFact:
      "Seven days in a row rewires your routine. Weekly streaks beat sporadic bursts because your brain starts expecting the win at the same time each day.",
  },
  {
    id: "streak-1-month",
    label: "1 Month",
    category: "streak",
    emoji: "🔥",
    funFact:
      "Thirty days of consistency is legit habit territory. Most people quit around day 12 - you didn't. That discipline transfers straight to saving and side-hustle grind.",
  },
  {
    id: "streak-3-months",
    label: "3 Months",
    category: "streak",
    emoji: "🔥",
    funFact:
      "A quarter-year streak means you've weathered busy weeks, boring weeks, and temptation weeks. Long-run savers aren't lucky - they're consistent when motivation dips.",
  },
  {
    id: "streak-6-months",
    label: "6 Months",
    category: "streak",
    emoji: "🔥",
    funFact:
      "Half a year of daily momentum puts you in rare air. Behavioral research shows habits maintained 6+ months become automatic - less willpower, more identity.",
  },
  {
    id: "streak-9-months",
    label: "9 Months",
    category: "streak",
    emoji: "🔥",
    funFact:
      "Nine months is longer than most school terms. You've basically run a full financial season without benching yourself - that's CEO-level follow-through.",
  },
  {
    id: "streak-12-months",
    label: "12 Months",
    category: "streak",
    emoji: "🔥",
    funFact:
      "A full-year streak is legendary. You didn't just learn money skills - you lived them daily. Annual consistency is how adults build credit, careers, and real wealth.",
  },
];

/** Consistency awards - housed in the Learning Streaks section, not Money Milestones. */
export const LEARNING_STREAK_MILESTONES: readonly MoneyMilestone[] =
  MONEY_MILESTONE_STREAKS;

export const MONEY_MILESTONE_SAVINGS: readonly MoneyMilestone[] = [
  {
    id: "savings-1",
    label: "$1",
    category: "savings",
    emoji: "💵",
    funFact:
      "One dollar saved is proof the system works. Micro-wins matter - they signal to your brain that saving feels good, which makes the next deposit easier.",
  },
  {
    id: "savings-50",
    label: "$50",
    category: "savings",
    emoji: "💵",
    funFact:
      "Fifty bucks is a real buffer - enough to cover a surprise snack run, app purchase, or gift without nuking your plan. Small cushions prevent big budget meltdowns.",
  },
  {
    id: "savings-100",
    label: "$100",
    category: "savings",
    emoji: "💵",
    funFact:
      "Triple digits means you're stacking faster than most peers. $100 saved at 14, with steady top-ups, can snowball into serious gear or opportunity money by graduation.",
  },
  {
    id: "savings-500",
    label: "$500",
    category: "savings",
    emoji: "💵",
    funFact:
      "Five hundred dollars is founder fuel - seed money for supplies, a first ad test, or a safety net when a gig payment runs late. Liquidity equals options.",
  },
  {
    id: "savings-1000",
    label: "$1000",
    category: "savings",
    emoji: "💵",
    funFact:
      "Four figures puts you in the top tier of teen savers globally. $1,000 isn't just a number - it's freedom to say yes to the right opportunity without asking for a loan.",
  },
];

export const ALL_MONEY_MILESTONES: readonly MoneyMilestone[] = [
  ...MONEY_MILESTONE_ACTIONS,
  ...MONEY_MILESTONE_SAVINGS,
];

/** Demo earned milestones - click to open the congrats modal. */
export const DEMO_EARNED_MILESTONE_IDS: ReadonlySet<string> = new Set([
  "first-savings",
  "goal-set",
  "first-cash-out",
  "savings-1",
  "savings-50",
  "savings-100",
]);

/** Demo earned learning streaks - tap to open congrats modal. */
export const DEMO_EARNED_STREAK_IDS: ReadonlySet<string> = new Set([
  "streak-1-day",
  "streak-1-week",
  "streak-1-month",
]);

export type MonthlyChallenge = {
  id: string;
  monthLabel: string;
  fullMonthName: string;
  challengeIcon: string;
  challengeName: string;
};

export const MONTHLY_CHALLENGES: readonly MonthlyChallenge[] = [
  {
    id: "jan",
    monthLabel: "Jan",
    fullMonthName: "January",
    challengeIcon: "❄️",
    challengeName: "New Year Stash",
  },
  {
    id: "feb",
    monthLabel: "Feb",
    fullMonthName: "February",
    challengeIcon: "💝",
    challengeName: "Give & Save",
  },
  {
    id: "mar",
    monthLabel: "Mar",
    fullMonthName: "March",
    challengeIcon: "🌱",
    challengeName: "Spring Growth",
  },
  {
    id: "apr",
    monthLabel: "Apr",
    fullMonthName: "April",
    challengeIcon: "🌧️",
    challengeName: "Rainy Day Fund",
  },
  {
    id: "may",
    monthLabel: "May",
    fullMonthName: "May",
    challengeIcon: "🌸",
    challengeName: "Bloom Budget",
  },
  {
    id: "jun",
    monthLabel: "Jun",
    fullMonthName: "June",
    challengeIcon: "☀️",
    challengeName: "Summer Side Hustle",
  },
  {
    id: "jul",
    monthLabel: "Jul",
    fullMonthName: "July",
    challengeIcon: "🏖️",
    challengeName: "Vacation Vault",
  },
  {
    id: "aug",
    monthLabel: "Aug",
    fullMonthName: "August",
    challengeIcon: "🎒",
    challengeName: "Back-to-School Save",
  },
  {
    id: "sep",
    monthLabel: "Sep",
    fullMonthName: "September",
    challengeIcon: "🍂",
    challengeName: "Fall Reset",
  },
  {
    id: "oct",
    monthLabel: "Oct",
    fullMonthName: "October",
    challengeIcon: "🎃",
    challengeName: "Spook-Free Spending",
  },
  {
    id: "nov",
    monthLabel: "Nov",
    fullMonthName: "November",
    challengeIcon: "🦃",
    challengeName: "Gratitude Give",
  },
  {
    id: "dec",
    monthLabel: "Dec",
    fullMonthName: "December",
    challengeIcon: "🎄",
    challengeName: "Holiday Hustle",
  },
];

/** Alternating mock: odd indices achieved (Feb, Apr, Jun, …). */
export function isDemoMonthlyChallengeAchieved(monthIndex: number): boolean {
  return monthIndex % 2 === 1;
}

/** Months after the current calendar month are treated as upcoming. */
export function isFutureMonthlyChallenge(monthIndex: number): boolean {
  return monthIndex > new Date().getMonth();
}

/** Stable demo social proof for Community challenge tiles. */
export function demoMonthlyChallengeAchieverCount(monthIndex: number): number {
  return 380 + ((monthIndex * 173) % 1640);
}

export type AchievementFriend = {
  id: string;
  username: string;
  avatarEmoji: string;
  dayStreak: number;
  /** Lifetime XP earned - never reduced by cash-outs. */
  lifetimePoints: number;
};

export const DEMO_ACHIEVEMENT_FRIENDS: readonly AchievementFriend[] = [
  {
    id: "friend-1",
    username: "ZaraBuilds",
    avatarEmoji: "🦊",
    dayStreak: 42,
    lifetimePoints: 4820,
  },
  {
    id: "friend-2",
    username: "FinnFan22",
    avatarEmoji: "🐯",
    dayStreak: 18,
    lifetimePoints: 3150,
  },
  {
    id: "friend-3",
    username: "LootLegend",
    avatarEmoji: "🦁",
    dayStreak: 7,
    lifetimePoints: 2240,
  },
  {
    id: "friend-4",
    username: "StashSage",
    avatarEmoji: "🦉",
    dayStreak: 63,
    lifetimePoints: 6100,
  },
];
