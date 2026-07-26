import { explorerCompletionScreen } from "@/lib/academy/lessons/completion-screen";
import type { CohortLessonDefinition, ScreenConfig } from "@/lib/academy/lessons/types";

const M1_L2_META = {
  milestoneId: 2,
  levelId: 1,
  lessonNumber: 2,
  moduleTitle: "Module 1",
  lessonTitle: "Needs vs Wants Sort",
  shellLabel: "Module 1 · Lesson 2 · Needs vs Wants Sort",
  totalScreens: 8,
  shippedCohorts: ["explorer", "pathfinder", "maverick"],
} as const;

const M1_L2_REWARDS = {
  skillSlug: "put-needs-first",
  achievementSkillSlug: "put-needs-first",
  xpReward: 100,
  perfectStreakBonus: 50,
} as const;

/** Explorer Lars copy as base — Pathfinder teen variant patches via overrides when ready. */
const M1_L2_BASE_SCREENS: ScreenConfig[] = [
  {
    type: "true-false",
    id: "empty-jar-hook",
    prompt:
      "Tomorrow is Senna's birthday. Lars opens his savings jar to buy the phone case he promised his brother... but the jar is completely empty. True or False: Lars can still buy the present.",
    correctAnswer: "false",
    wrongError:
      "Nope! Once the cash is traded away, it's gone. You can't use the same dollar twice!",
    promptLabel: "Fact Finder",
  },
  {
    type: "bucket-sort",
    id: "want-vs-need-sort",
    title: "Wants or Needs?",
    intro:
      "Lars spent all his money on things Lars wanted, but didn't save anything for things he needs to buy. Help Lars identify which items are 'Things he wants' or 'Things he needs'",
    buckets: [
      { id: "want", label: "Things Lars wants", tone: "want", icon: "✨" },
      { id: "need", label: "Things Lars needs", tone: "need", icon: "🛡️" },
    ],
    items: [
      {
        id: "case",
        emoji: "📱",
        label: "Phone Case Birthday Present",
        bucket: "need",
        wrongDropError:
          "Hold up! You promised this to your brother for his birthday. Promises are Total Must-Haves!",
      },
      {
        id: "cable",
        emoji: "🔌",
        label: "Broken Phone Cable",
        bucket: "need",
        wrongDropError:
          "Wait! If your phone cable is broken, your phone dies. That's a Need!",
      },
      {
        id: "munch",
        emoji: "🍫",
        label: "Beast Munch",
        bucket: "want",
        wrongDropError:
          "Beast Munch tastes great, but you won't get stuck without it. That's a Want!",
      },
      {
        id: "gamepass",
        emoji: "💃",
        label: "New skin for his favourite game",
        bucket: "want",
        wrongDropError:
          "A new skin brings short-term fun, but it isn't an essential lifeline. That goes into Things Lars wants!",
      },
    ],
  },
  {
    type: "spotlight-rounds",
    id: "need-spotlight",
    prompt:
      "Which item is the one Lars 'Needs' to buy before he spends money on what he 'Wants' to buy?",
    rounds: [
      {
        iconA: "📱",
        optionA: "A new phone case, even though his old one is still fine",
        iconB: "🎁",
        optionB:
          "A new phone case he promised to buy his brother for his birthday",
        correct: "b",
        error:
          "Whoops! If your current case is still fine, replacing it is just a want. The one you promised your brother is the true Must-Have!",
      },
      {
        iconA: "💡",
        optionA: "A light for his bike to be seen in the dark",
        iconB: "🖱️",
        optionB: "A new gaming mouse with lights (his old one still works)",
        correct: "a",
        error:
          "If the old one's still working, replacing it becomes a 'want' not a 'need'.",
      },
      {
        iconA: "🥪",
        optionA: "Buy lunch for himself with his weekly tuckshop money",
        iconB: "🍱",
        optionB:
          "Buy lunch for all his friends on Monday and have nothing left over",
        correct: "a",
        error:
          "Buying lunch for everyone is a nice thing to do, but it is a want, not something he 'needs' to do to look after himself!",
      },
    ],
  },
  {
    type: "budget-select",
    id: "budget-wallet",
    intro: "You have $30 left. Check the boxes to buy what you actually need.",
    walletLabel: "Digital Wallet",
    total: 30,
    items: [
      { id: "bus", label: "Bus Pass", price: 15, emoji: "🚍" },
      { id: "drink", label: "Energy Drink", price: 10, emoji: "⚡" },
      { id: "cable", label: "Phone Cable", price: 15, emoji: "🔌" },
    ],
    correctIds: ["bus", "cable"],
    errors: {
      overBudget: "Uncheck the item you don't really 'need'.",
      wrongSelection: "Uncheck the item you don't really 'need'.",
      itemHints: {
        cable:
          "Wait! Your phone is dead without that cable. Uncheck the drink and secure your phone lifeline!",
        bus: "Hold up! You're stranded at school without that Bus Pass. Swap out the drink for a ride home!",
      },
    },
    advance: { mode: "on-complete" },
  },
  {
    type: "allocation-slider",
    id: "reserve-slider",
    intro:
      "Lars has $25 total. He needs $20 next week for his brother's phone case. Help him put the money aside so he doesn't spend it. Slide the divider to secure that money now.",
    total: 25,
    targetMin: 20,
    reserveGoals: [
      { id: "phone-case", label: "Phone Case", amount: 20, emoji: "📱" },
    ],
    spendItems: [
      { id: "energy-drink", label: "Energy Drink", amount: 10, emoji: "⚡" },
    ],
    sliderError:
      "Not quite! If you leave less than $20 in the reserve, you won't have enough to buy your brother's gift next week. Slide the line to protect the full $20!",
    advance: { mode: "on-complete" },
  },
  {
    type: "rank-order",
    id: "rank-stack",
    intro:
      "Drag the choices in the correct order, starting with what would be best for Lars to do.",
    dragHint:
      "Drag the choices in the correct order, starting with what would be best for Lars to do.",
    axisLabel: "Best → Avoid",
    submitLabel: "Submit Answer",
    items: [
      { id: "keep", label: "Don't buy anything - keep the $5." },
      { id: "cheaper", label: "Choose something cheaper for $5 to enjoy now." },
      { id: "borrow", label: "Borrow $5 from dad to buy the $10 bottle." },
    ],
    correctOrder: ["keep", "cheaper", "borrow"],
    errors: {
      borrow:
        "Not quite! Borrowing money creates debt and you don't want to do that for something you 'want' but can do without. This is the option to avoid and should be at the very bottom of our list. Try again!",
      cheaper:
        "Not quite! While that is an okay choice, there's a better option to choose first in this list. Try again!",
    },
    successMessage:
      "Perfect sequence! Keeping the $5 safe first, then only spending what you have left without borrowing money is correct. That's smart spending control that Lars can count on.",
    advance: { mode: "on-complete" },
  },
  { type: "custom", id: "gift-reveal", renderer: "m1-l2-gift-reveal", configRef: "gift", advance: { mode: "on-complete" } },  explorerCompletionScreen(),
];

export const M1_L2_CUSTOM = {
  gift: {
    intro:
      "Fast forward to next week! Tap the gift box to help Lars deliver his promise to Senna.",
    characterLeft: { emoji: "🧑", label: "Lars" },
    characterRight: { emoji: "🧒", label: "Senna" },
    revealMessage:
      "Lesson Complete! By securing your needs before spending on temporary wants, you ensure your promises are always safe and your goals are reached.",
  },
} as const;

export const M1_L2_LESSON_DEFINITION: CohortLessonDefinition = {
  meta: M1_L2_META,
  rewards: M1_L2_REWARDS,
  custom: M1_L2_CUSTOM,
  baseScreens: M1_L2_BASE_SCREENS,
  byCohort: {
    explorer: {
      characterName: "Lars",
    },
    pathfinder: {
      characterName: "Lars",
    },
  },
};
