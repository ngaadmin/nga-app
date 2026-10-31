/* AUTO-GENERATED from spreadsheet — re-run: npm run lesson:import -- your-folder */

import { teenCompletionScreen } from "@/lib/academy/lessons/completion-screen";
import type { CohortLessonDefinition, ScreenConfig, ScreenOverrideMap } from "@/lib/academy/lessons/types";

const SKILL_TITLE = "Put Needs First";
const LEAD_CHARACTER = "Lars";

const M1_L2_META = {
  milestoneId: 2,
  levelId: 1,
  lessonNumber: 2,
  moduleTitle: "Module 1",
  lessonTitle: "Needs vs Wants Sort",
  shellLabel: "Module 1 · Lesson 2 · Needs vs Wants Sort",
  totalScreens: 8,
} as const;

const M1_L2_REWARDS = {
  skillSlug: "put-needs-first",
  achievementSkillSlug: "put-needs-first",
} as const;

const M1_L2_BASE_SCREENS: ScreenConfig[] = [
  {
    type: "true-false",
    id: "empty-jar-hook",
    prompt: "Tomorrow is Senna's birthday. Lars opens his savings jar to buy the phone case he promised his brother... but the jar is completely empty. True or False: Lars can still buy the present.",
    correctAnswer: "false",
    wrongError: "Nope! Once the cash is traded away, it's gone. You can't use the same dollar twice!",
    promptLabel: "Fact Finder",
  },
  {
    type: "bucket-sort",
    id: "want-vs-need-sort",
    intro: "Lars spent all his money on things Lars wanted, but didn't save anything for things he needs to buy. Help Lars identify which items are 'Things he wants' or 'Things he needs'",
    buckets: [
      {
        id: "want",
        label: "Want",
        tone: "want",
      },
      {
        id: "need",
        label: "Need",
        tone: "need",
      },
    ],
    items: [
      {
        id: "phone-case-birthday-pres",
        emoji: "📱",
        label: "Phone Case Birthday Present",
        bucket: "need",
      },
      {
        id: "replace-broken-phone-cab",
        emoji: "🔌",
        label: "Replace broken phone cable",
        bucket: "need",
      },
      {
        id: "beast-munch",
        emoji: "🍫",
        label: "Beast Munch",
        bucket: "want",
      },
      {
        id: "new-skin-for-his-favouri",
        emoji: "💃",
        label: "New skin for his favourite game",
        bucket: "want",
      },
    ],
  },
  {
    type: "spotlight-rounds",
    id: "need-spotlight",
    prompt: "Which item is the one Lars 'Needs' to buy before he spends money on what he 'Wants' to buy?",
    rounds: [],
  },
  {
    type: "custom",
    id: "budget-wallet",
    renderer: "budget-checkboxes",
  },
  {
    type: "custom",
    id: "reserve-slider",
    renderer: "budget-slider",
  },
  {
    type: "rank-order",
    id: "rank-stack",
    intro: "Drag the choices in the correct order, starting with what would be best for Lars to do.",
    items: [
      {
        id: "keep",
        label: "Don't buy anything - keep the $5.",
      },
      {
        id: "cheaper",
        label: "Choose something cheaper for $5 to enjoy now.",
      },
      {
        id: "borrow",
        label: "Borrow $5 from dad to buy the $10 bottle.",
      },
    ],
    correctOrder: [
      "keep",
      "cheaper",
      "borrow",
    ],
    errors: {

    },
    submitLabel: "Submit Answer",
  },
  {
    type: "custom",
    id: "gift-delivery",
    renderer: "gift-reveal",
  },
  teenCompletionScreen({ skillTitle: SKILL_TITLE }),
];

const EXPLORER_OVERRIDES: ScreenOverrideMap = {
  "empty-jar-hook": {
    wrongError: "Nope! That cash is already gone.",
  },
  "want-vs-need-sort": {
    intro: "Lars spent all his money on things Lars wanted, but didn't save anything for things he needs to buy.",
    items: [
      {
        id: "phone-case-birthday-pres",
        emoji: "📱",
        label: "Phone Case Birthday Present",
        bucket: "need",
      },
      {
        id: "replace-broken-phone-cab",
        emoji: "🔌",
        label: "Replace broken phone cable",
        bucket: "need",
      },
      {
        id: "beast-munch",
        emoji: "🍫",
        label: "Beast Munch",
        bucket: "want",
      },
      {
        id: "new-skin-for-his-favouri",
        emoji: "💃",
        label: "New skin for his favourite game",
        bucket: "want",
      },
    ],
  },
  "reserve-slider": {
    wrongError: "Slide until $20 is locked for the gift.",
  },
};

const MAVERICK_OVERRIDES: ScreenOverrideMap = {};

export const M1_L2_LESSON_DEFINITION: CohortLessonDefinition = {
  meta: M1_L2_META,
  rewards: M1_L2_REWARDS,
  baseScreens: M1_L2_BASE_SCREENS,
  byCohort: {
    explorer: { characterName: "Lars", screenOverrides: EXPLORER_OVERRIDES },
    pathfinder: { characterName: "Lars" },
    maverick: { characterName: "Lars", screenOverrides: MAVERICK_OVERRIDES },
  },
};

// ⚠️ This lesson uses custom game types (budget-checkboxes, budget-slider, gift-reveal). A developer must wire renderers before it can ship.
