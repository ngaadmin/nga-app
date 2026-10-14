/* AUTO-GENERATED from spreadsheet — re-run: npm run lesson:import -- your-folder */

import { teenCompletionScreen } from "@/lib/academy/lessons/completion-screen";
import type { CohortLessonDefinition, ScreenConfig, ScreenOverrideMap } from "@/lib/academy/lessons/types";

const SKILL_TITLE = "Believe Money Can Be Made";
const LEAD_CHARACTER = "Holly";

const M1_L3_META = {
  milestoneId: 3,
  levelId: 1,
  lessonNumber: 3,
  moduleTitle: "Module 1",
  lessonTitle: "Keep Some Money Aside",
  shellLabel: "Module 1 · Lesson 3 · Keep Some Money Aside",
  totalScreens: 8,
} as const;

const M1_L3_REWARDS = {
  skillSlug: "smart-saving",
  achievementSkillSlug: "smart-saving",
} as const;

const M1_L3_BASE_SCREENS: ScreenConfig[] = [
  {
    type: "binary-choice",
    id: "hook-finish-sentence",
    prompt: "Holly spent all her pocket money. She accidentally steps on her sister's headphones and breaks them. Holly's sister crashes out because:",
    optionA: {
      label: "Holly has no money to buy a new pair",
      isCorrect: true,
    },
    optionB: {
      label: "Holly tries to fix them with sticky tape and now they're even worse",
      isCorrect: false,
    },
    wrongError: "Haha, maybe. But let's try again.",
    errorStyle: "inline-red",
  },
  {
    type: "bucket-sort",
    id: "spent-triage",
    intro: "Where did the money go? Holly needs $40 for new headphones, but her wallet is empty. Drag the items Holly bought into the 'Spent' bucket.",
    buckets: [
      {
        id: "short",
        label: "Short Fun",
      },
      {
        id: "long",
        label: "More Fun for Longer",
      },
    ],
    items: [
      {
        id: "squishy-toy",
        emoji: "🧸",
        label: "Squishy toy",
        bucket: "spent",
      },
      {
        id: "slime",
        emoji: "🫧",
        label: "Slime",
        bucket: "spent",
      },
      {
        id: "snacks",
        emoji: "🍫",
        label: "Snacks",
        bucket: "spent",
      },
    ],
  },
  {
    type: "custom",
    id: "spare-vs-spend-match",
    renderer: "tap-pairs",
  },
  {
    type: "bucket-sort",
    id: "spare-cash-steps",
    intro: "Ready to build your own Cash for Emergencies? Put these steps in order so you're never caught out again.",
    buckets: [
      {
        id: "short",
        label: "Short Fun",
      },
      {
        id: "long",
        label: "More Fun for Longer",
      },
    ],
    items: [
      {
        id: "get-your-pocket-money",
        label: "Get your pocket money.",
        bucket: "step1",
      },
      {
        id: "move-some-of-that-money-",
        label: "Move some of that money to your jar for 'Emergencies'.",
        bucket: "step2",
      },
      {
        id: "spend-what-is-left-on-fu",
        label: "Spend what is left on fun.",
        bucket: "step3",
      },
    ],
  },
  {
    type: "binary-choice",
    id: "mia-priority-choice",
    prompt: "Holly has $40 Cash for Emergencies to replace the headphones. She sees a $10 toy she wants and thinks: \"I'll spend this $10 now, and I'll just save more next week to buy the headphones.\" What should Holly do?",
    optionA: {
      label: "Buy the toy and save $10 more next week.",
      isCorrect: false,
    },
    optionB: {
      label: "Buy the headphones to fix what she broke first.",
      isCorrect: true,
    },
    wrongError: "That's a trap! Stick to the plan to avoid stress later.",
    errorStyle: "inline-red",
  },
  {
    type: "word-drop",
    id: "reflection-word-drop",
    narrativeBefore: "",
    narrativeAfter: "",
    options: [
      "Spent",
      "Saved",
      "Hidden",
    ],
    correctOption: "Spent",
    wrongError: "Not quite. Let's try again.",
  },
  {
    type: "binary-choice",
    id: "resolution-benefits-choice",
    prompt: "Holly could fix the problem because she had Cash for Emergencies. What are the other benefits of not spending all of your money? Select the best answer:",
    optionA: {
      label: "If I lose something, I can replace it myself.",
      isCorrect: false,
    },
    optionB: {
      label: "I won't have to ask my parents for money if I need something.",
      isCorrect: true,
    },
    wrongError: "Yes, but take a look at the other options and see if there's a better answer.",
    errorStyle: "inline-red",
  },
  teenCompletionScreen({ skillTitle: SKILL_TITLE }),
];

const EXPLORER_OVERRIDES: ScreenOverrideMap = {
  "hook-finish-sentence": {
    prompt: "Mia spent all her pocket money. She accidentally steps on her sister's headphones and breaks them. Mia's sister crashes out because:",
    wrongError: "Haha, maybe. Try again!",
    optionA: {
      label: "Mia has no money to buy a new pair",
      isCorrect: true,
    },
    optionB: {
      label: "Mia tries to fix them with sticky tape and now they're even worse",
      isCorrect: false,
    },
  },
  "spent-triage": {
    intro: "Where did the money go? Mia needs $40 for new headphones, but her wallet is empty. Drag the items Mia bought into the 'Spent' bucket.",
  },
  "spare-cash-steps": {
    intro: "Ready to build your own Spare Cash? Put these steps in order so you're never caught out again.",
    items: [
      {
        id: "get-your-pocket-money",
        emoji: "💵",
        label: "Get your pocket money.",
        bucket: "step1",
      },
      {
        id: "move-a-small-amount-to-y",
        emoji: "🫙",
        label: "Move a small amount to your Emergencies jar.",
        bucket: "step2",
      },
      {
        id: "spend-what-is-left-on-fu",
        emoji: "🎮",
        label: "Spend what is left on fun.",
        bucket: "step3",
      },
    ],
  },
  "mia-priority-choice": {
    prompt: "Mia has $40 Spare Cash to replace the headphones. She sees a $10 toy she wants and thinks: \"I'll spend this $10 now, and I'll just save more next week to buy the headphones.\" What should Mia do?",
    wrongError: "Trap! Fix the headphones first.",
  },
  "reflection-word-drop": {
    wrongError: "Not quite. Try another combo!",
  },
  "resolution-benefits-choice": {
    prompt: "Mia could fix the problem because she had spare cash. What are the other benefits of not spending all of your money? Select the best answer:",
    wrongError: "Good try. One answer covers all of them.",
  },
};

const MAVERICK_OVERRIDES: ScreenOverrideMap = {};

export const M1_L3_LESSON_DEFINITION: CohortLessonDefinition = {
  meta: M1_L3_META,
  rewards: M1_L3_REWARDS,
  baseScreens: M1_L3_BASE_SCREENS,
  byCohort: {
    explorer: { characterName: "Mia", screenOverrides: EXPLORER_OVERRIDES },
    pathfinder: { characterName: "Holly" },
    maverick: { characterName: "Holly", screenOverrides: MAVERICK_OVERRIDES },
  },
};

// ⚠️ This lesson uses custom game types (tap-pairs). A developer must wire renderers before it can ship.
