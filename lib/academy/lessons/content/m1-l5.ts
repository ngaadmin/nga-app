/* AUTO-GENERATED from spreadsheet — re-run: npm run lesson:import -- your-folder */

import { teenCompletionScreen } from "@/lib/academy/lessons/completion-screen";
import type { CohortLessonDefinition, ScreenConfig, ScreenOverrideMap } from "@/lib/academy/lessons/types";

const SKILL_TITLE = "Choose needs over wants";
const LEAD_CHARACTER = "Holly";

const M1_L5_META = {
  milestoneId: 5,
  levelId: 1,
  lessonNumber: 5,
  moduleTitle: "How the Money Game Works",
  lessonTitle: "The birthday discount",
  shellLabel: "How the Money Game Works · Lesson 5 · The birthday discount",
  totalScreens: 8,
  shippedCohorts: ["explorer", "pathfinder", "maverick"],
} as const;

const M1_L5_REWARDS = {
  skillSlug: "put-needs-first",
  achievementSkillSlug: "put-needs-first",
} as const;

const M1_L5_BASE_SCREENS: ScreenConfig[] = [
  {
    type: "word-drop",
    id: "hook-word-drop",
    narrativeBefore: "It is Immi's birthday. The local gelato store offers a birthday discount. Immi wants Holly to come with her and get one too. Going along so she is not left out is a",
    narrativeAfter: "for Holly.",
    options: [
      "Want",
      "Need",
      "Bill",
    ],
    correctOption: "Want",
    wrongError: "A limited time offer does not make it a 'need'.",
    pairImage: "Holly-happy.webp",
  },
  {
    type: "binary-choice",
    id: "short-fun-reality",
    prompt: "The birthday discount is only on today. Holly is saving for an exchange trip overseas and can't really afford the gelato. What should she do?",
    optionA: {
      label: "Skip buying her own gelato and ask Immi to share hers.",
      isCorrect: true,
    },
    optionB: {
      label: "Buy her own because the deal is only on today",
      isCorrect: false,
    },
    wrongError: "The money for the exchange trip is the 'need'. The gelato is the 'want'.",
    errorStyle: "inline-red",
    pairImage: "concept-wallet.webp",
  },
  {
    type: "true-false",
    id: "tap-short-vs-long",
    prompt: "The gelato is a 'need' because the deal is only available today.",
    correctAnswer: "false",
    wrongError: "A limited time offer does not turn a 'want' into a 'need'.",
    promptLabel: "Fact Finder",
    pairImage: "Aiden-happy.webp",
  },
  {
    type: "bucket-sort",
    id: "sort-short-vs-long",
    intro: "Sort the items in the correct bucket. Is it a 'want' or a 'need' for Holly right now?",
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
        id: "airline-ticket",
        label: "Airline ticket",
        bucket: "need",
      },
      {
        id: "her-own-gelato",
        label: "Her own gelato",
        bucket: "want",
      },
      {
        id: "extra-gelato-toppings",
        label: "Extra gelato toppings",
        bucket: "want",
      },
      {
        id: "a-new-passport",
        label: "A new passport",
        bucket: "need",
      },
    ],
    pairImage: false,
  },
  {
    type: "binary-choice",
    id: "countdown-trap",
    prompt: "Holly does not want to feel left out, but the birthday deal expires today. What now?",
    optionA: {
      label: "Share a gelato and keep at least half of what she would otherwise have spent.",
      isCorrect: true,
    },
    optionB: {
      label: "Buy one so she isn't the odd one out",
      isCorrect: false,
    },
    wrongError: "Try again!",
    errorStyle: "banner",
    pairImage: "Holly-thinking.webp",
  },
  {
    type: "rank-order",
    id: "impulse-pause",
    intro: "Put these in the order Holly should try. Best first.",
    items: [
      {
        id: "ask",
        label: "Ask if this is a 'want' or a 'need'",
      },
      {
        id: "share",
        label: "Share a gelato with Immi",
      },
      {
        id: "buy",
        label: "Buy her own because it is only today",
      },
    ],
    correctOrder: [
      "ask",
      "share",
      "buy",
    ],
    errors: {
      share: "Name it a 'want' or 'need', then share, then buy.",
      buy: "Name it a 'want' or 'need', then share, then buy.",
    },
    submitLabel: "Submit Answer",
    pairImage: false,
  },
  {
    type: "narrative-bonus",
    id: "resolution",
    narrative: "Immi was happy to share the gelato without Holly having to pay for it. Holly stays on track with saving for her big trip.",
    bonusXp: 0,
    bonusTapLabel: "",
    autoReadyWhenNoBonus: true,
    pairImage: "Holly-happy.webp",
  },
  teenCompletionScreen({ skillTitle: SKILL_TITLE }),
];

const EXPLORER_OVERRIDES: ScreenOverrideMap = {
  "hook-word-drop": {
    narrativeBefore: "It is Senna's birthday. The local gelato store offers a birthday discount. Senna wants Lars to come with him and get one too. Going along so he is not left out is a",
    narrativeAfter: "for Lars.",
    pairImage: "lars-happy.webp",
  },
  "short-fun-reality": {
    prompt: "The birthday discount is only on today. Lars is saving for bike parts for his race next week, and can't really afford the gelato. What should he do?",
    wrongError: "The bike parts are the 'need'. The gelato is the 'want'.",
    optionA: {
      label: "Skip buying his own gelato and ask Senna to share his.",
      isCorrect: true,
    },
    optionB: {
      label: "Buy his own because the deal is only on today",
      isCorrect: false,
    },
  },
  "tap-short-vs-long": {
    pairImage: "lars-questioning.webp",
  },
  "sort-short-vs-long": {
    intro: "Sort the items in the correct bucket. Is it a 'want' or a 'need' for Lars right now?",
    items: [
      {
        id: "new-helmet-for-the-race",
        label: "New helmet for the race",
        bucket: "need",
      },
      {
        id: "his-own-gelato",
        label: "His own gelato",
        bucket: "want",
      },
      {
        id: "extra-gelato-toppings",
        label: "Extra gelato toppings",
        bucket: "want",
      },
      {
        id: "race-registration-fee",
        label: "Race registration fee",
        bucket: "need",
      },
    ],
  },
  "countdown-trap": {
    prompt: "Lars does not want to feel left out, but the birthday deal expires today. What now?",
    optionA: {
      label: "Share a gelato and keep at least half of what he would otherwise have spent.",
      isCorrect: true,
    },
    optionB: {
      label: "Buy one so he isn't the odd one out",
      isCorrect: false,
    },
    pairImage: "lars-thinking.webp",
  },
  "impulse-pause": {
    intro: "Put these in the order Lars should try. Best first.",
    items: [
      {
        id: "ask",
        label: "Ask if this is a 'want' or a 'need'",
      },
      {
        id: "share",
        label: "Share a gelato with Senna",
      },
      {
        id: "buy",
        label: "Buy his own because it is only today",
      },
    ],
    correctOrder: [
      "ask",
      "share",
      "buy",
    ],
  },
  "resolution": {
    narrative: "Senna was happy to share the gelato without Lars having to pay for it. Lars can buy what he needs for his race.",
    pairImage: "lars-happy.webp",
  },
  "milestone-splash": {
    _replace: true,
    type: "completion",
    id: "milestone-splash",
    useStandardPane: true,
    pairImage: false,
  },
};

const MAVERICK_OVERRIDES: ScreenOverrideMap = {
  "hook-word-drop": {
    narrativeBefore: "It is Immi's birthday. The local gelato store offers a birthday discount. She wants Aiden to come with her and get one too. Going along so he is not left out is a",
    narrativeAfter: "for Aiden.",
    pairImage: "Aiden-happy.webp",
  },
  "short-fun-reality": {
    prompt: "The birthday discount is only on today. Aiden is saving for a gap year and doesn't really want to spend the money on gelato. What should he do?",
    wrongError: "The money for the gap year is the 'need'. The gelato is the 'want'.",
    optionA: {
      label: "Skip buying his own gelato and ask Immi to share hers.",
      isCorrect: true,
    },
    optionB: {
      label: "Buy his own because the deal is only on today",
      isCorrect: false,
    },
  },
  "tap-short-vs-long": {
    pairImage: "Aiden-questioning.webp",
  },
  "sort-short-vs-long": {
    intro: "Sort the items in the correct bucket. Is it a 'want' or a 'need' for Aiden right now?",
    items: [
      {
        id: "airline-ticket",
        label: "Airline ticket",
        bucket: "need",
      },
      {
        id: "his-own-gelato",
        label: "His own gelato",
        bucket: "want",
      },
      {
        id: "extra-gelato-toppings",
        label: "Extra gelato toppings",
        bucket: "want",
      },
      {
        id: "a-new-passport",
        label: "A new passport",
        bucket: "need",
      },
    ],
  },
  "countdown-trap": {
    prompt: "Aiden does not want to feel left out, but the birthday deal expires today. What now?",
    optionA: {
      label: "Share a gelato and keep at least half of what he would otherwise have spent.",
      isCorrect: true,
    },
    optionB: {
      label: "Buy one so he isn't the odd one out",
      isCorrect: false,
    },
    pairImage: "Aiden-thinking.webp",
  },
  "impulse-pause": {
    intro: "Put these in the order Aiden should try. Best first.",
    items: [
      {
        id: "ask",
        label: "Ask if this is a 'want' or a 'need'",
      },
      {
        id: "share",
        label: "Share a gelato with Immi",
      },
      {
        id: "buy",
        label: "Buy his own because it is only today",
      },
    ],
    correctOrder: [
      "ask",
      "share",
      "buy",
    ],
  },
  "resolution": {
    narrative: "Immi was happy to share the gelato without Aiden having to pay for it. Aiden stays on track with saving for his big trip.",
    pairImage: "Aiden-happy.webp",
  },
};

export const M1_L5_LESSON_DEFINITION: CohortLessonDefinition = {
  meta: M1_L5_META,
  rewards: M1_L5_REWARDS,
  baseScreens: M1_L5_BASE_SCREENS,
  byCohort: {
    explorer: { characterName: "Lars", screenOverrides: EXPLORER_OVERRIDES },
    pathfinder: { characterName: "Holly" },
    maverick: { characterName: "Aiden", screenOverrides: MAVERICK_OVERRIDES },
  },
};
