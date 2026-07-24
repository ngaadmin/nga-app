import type { CohortLessonDefinition, ScreenConfig } from "@/lib/academy/lessons/types";
import type { ScreenOverrideMap } from "@/lib/academy/lessons/cohort-overrides";

const M1_L3_META = {
  milestoneId: 3,
  levelId: 1,
  lessonNumber: 3,
  moduleTitle: "Module 1",
  lessonTitle: "Keep Some Money Aside",
  shellLabel: "Module 1 · Lesson 3 · Keep Some Money Aside",
  totalScreens: 8,
  shippedCohorts: ["explorer", "pathfinder"],
  characters: {
    lead: "Mia",
    support: "Senna",
    explorer: "Mia",
    pathfinder: "Holly",
    maverick: "Dash",
  },
} as const;

const M1_L3_REWARDS = {
  skillSlug: "keep-some-aside",
  achievementSkillSlug: "keep-some-aside",
  xpReward: 150,
  perfectStreakBonus: 50,
} as const;

const M1_L3_BASE_SCREENS: ScreenConfig[] = [
  {
    type: "binary-choice",
    id: "hook-finish-sentence",
    prompt:
      "Mia spent all her pocket money. She accidentally steps on her sister's headphones and breaks them. Mia's sister crashes out because:",
    optionA: { label: "Mia has no money to buy a new pair", isCorrect: true },
    optionB: {
      label: "Mia tries to fix them with sticky tape and now they're even worse",
      isCorrect: false,
    },
    optionC: { label: "the dog runs off with one of the pieces", isCorrect: false },
    successMessage: "Exactly! No money left = big sister drama.",
    wrongError: "Haha, maybe. But let's try again.",
    errorStyle: "inline-red",
    advance: { mode: "on-complete" },
  },
  {
    type: "bucket-sort",
    id: "spent-triage",
    intro:
      "Where did the money go? Mia needs $40 for new headphones, but her wallet is empty. Drag the items Mia bought into the 'Spent' bucket.",
    buckets: [{ id: "spent", label: "Spent" }],
    items: [
      { id: "squishy", emoji: "🧸", label: "Squishy toy", bucket: "spent", price: 25 },
      { id: "slime", emoji: "🫧", label: "Slime", bucket: "spent", price: 8 },
      { id: "snacks", emoji: "🍫", label: "Snacks", bucket: "spent", price: 7 },
    ],
    layout: "spent-total",
    targetTotal: 40,
    poolColumnLabel: "Mia's purchases",
    successMessage: "Mia has no money left to pay for new headphones.",
    advance: { mode: "all-items-sorted" },
  },
  {
    type: "link-match",
    id: "spare-vs-spend-match",
    intro:
      "Senna explains that keeping Spare Cash gives you options. Match the event to what's possible if you have cash:",
    eventColumnLabel: "Events",
    benefitColumnLabel: "Possibilities",
    pairs: [
      {
        id: "headphones",
        event: "I broke my friend's headphones",
        benefit: "Fix or replace them",
      },
      {
        id: "birthday",
        event: "It's my friend's birthday",
        benefit: "I can buy a gift",
      },
      {
        id: "sale",
        event: "There's a sale at the toy store",
        benefit: "I can buy my favourite toy for less",
      },
    ],
    advance: { mode: "on-complete" },
  },
  {
    type: "bucket-sort",
    id: "spare-cash-steps",
    intro:
      "Ready to build your own Spare Cash? Put these steps in order so you're never caught out again.",
    layout: "steps-row",
    buckets: [
      { id: "step1", label: "Step 1" },
      { id: "step2", label: "Step 2" },
      { id: "step3", label: "Step 3" },
    ],
    items: [
      {
        id: "pocket-money",
        emoji: "💵",
        label: "Get your pocket money.",
        bucket: "step1",
      },
      {
        id: "buffer",
        emoji: "🫙",
        label: "Move a small amount to your 'Buffer' jar.",
        bucket: "step2",
      },
      {
        id: "fun",
        emoji: "🎮",
        label: "Spend what is left on fun.",
        bucket: "step3",
      },
    ],
    successMessage:
      "Perfect! Spare Cash first, then fun. You're ready for anything!",
    advance: { mode: "all-items-sorted" },
  },
  {
    type: "binary-choice",
    id: "mia-priority-choice",
    prompt:
      "Mia has $40 Spare Cash to replace the headphones. She sees a $10 toy she wants and thinks: \"I'll spend this $10 now, and I'll just save more next week to buy the headphones.\" What should Mia do?",
    optionA: {
      label: "Buy the toy and save $10 more next week.",
      isCorrect: false,
    },
    optionB: {
      label: "Buy the headphones to fix what she broke first.",
      isCorrect: true,
    },
    optionC: {
      label: "Buy the toy and hope the headphones don't cost $40.",
      isCorrect: false,
    },
    successMessage:
      "Smart move. Replacing the broken headphones should come first.",
    wrongError: "That's a trap! Stick to the plan to avoid stress later.",
    errorStyle: "inline-red",
    advance: { mode: "on-complete" },
  },
  {
    type: "word-drop",
    id: "reflection-word-drop",
    prompt:
      "Because I didn't [blank] everything, I had [blank] to [blank] the headphones immediately.",
    blanks: [
      { options: ["save", "spend"], correctOption: "spend" },
      { options: ["Spare Cash", "Borrowed money"], correctOption: "Spare Cash" },
      { options: ["replace", "throw away"], correctOption: "replace" },
    ],
    narrativeBefore: "",
    narrativeAfter: "",
    options: [],
    correctOption: "",
    wrongError: "Not quite. Let's try again.",
    successMessage: "Exactly! Spare cash gave Mia options when she needed them.",
    advance: { mode: "on-complete" },
  },
  {
    type: "binary-choice",
    id: "resolution-benefits-choice",
    prompt:
      "Mia could fix the problem because she had spare cash. What are the other benefits of not spending all of your money? Select the best answer:",
    optionA: {
      label: "If I lose something, I can replace it myself.",
      isCorrect: false,
    },
    optionB: {
      label: "I won't have to ask my parents for money if I need something.",
      isCorrect: false,
    },
    optionC: {
      label:
        "I can save up for a big goal instead of wasting it on small stuff that doesn't last.",
      isCorrect: false,
    },
    optionD: {
      label: "I worry less if I can afford things that I want or have to buy.",
      isCorrect: false,
    },
    optionE: { label: "All of the above.", isCorrect: true },
    successMessage:
      "Exactly! Keeping some money means you're in charge, you don't have to beg for cash, and you can get the stuff that actually matters.",
    wrongError: "Yes, but take a look at the other options and see if there's a better answer.",
    errorStyle: "inline-red",
    advance: { mode: "on-complete" },
  },
  {
    type: "completion",
    id: "milestone-splash",
    skillLearnedLabel: "Skill Learned: Choose to keep some spare cash",
    bodyCopy:
      "Lesson complete! You've unlocked a huge secret: Having some spare cash means you're ready for whatever comes next.",
    useStandardPane: false,
    advance: { mode: "manual-next" },
  },
];

const M1_L3_PATHFINDER_OVERRIDES: ScreenOverrideMap = {
  "hook-finish-sentence": {
    prompt:
      "Holly spent all her pocket money. She accidentally steps on her sister's headphones and breaks them. Holly's sister crashes out because:",
    optionA: { label: "Holly has no money to buy a new pair", isCorrect: true },
    optionB: {
      label: "Holly tries to fix them with sticky tape and now they're even worse",
      isCorrect: false,
    },
  },
  "spent-triage": {
    intro:
      "Where did the money go? Holly needs $40 for new headphones, but her wallet is empty. Drag the items Holly bought into the 'Spent' bucket.",
    poolColumnLabel: "Holly's purchases",
    successMessage: "Holly has no money left to pay for new headphones.",
  },
  "spare-vs-spend-match": {
    intro:
      "Senna explains that keeping Cash for Emergencies gives you options. Match the event to what's possible if you have cash:",
  },
  "spare-cash-steps": {
    intro:
      "Ready to build your own Cash for Emergencies? Put these steps in order so you're never caught out again.",
    items: [
      {
        id: "pocket-money",
        label: "Get your pocket money.",
        bucket: "step1",
      },
      {
        id: "buffer",
        label: "Move some of that money to your jar for 'Emergencies'.",
        bucket: "step2",
      },
      {
        id: "fun",
        label: "Spend what is left on fun.",
        bucket: "step3",
      },
    ],
    successMessage:
      "Perfect! Cash for Emergencies first, then fun. You're ready for anything!",
  },
  "mia-priority-choice": {
    prompt:
      "Holly has $40 Cash for Emergencies to replace the headphones. She sees a $10 toy she wants and thinks: \"I'll spend this $10 now, and I'll just save more next week to buy the headphones.\" What should Holly do?",
  },
  "reflection-word-drop": {
    blanks: [
      { options: ["save", "spend"], correctOption: "spend" },
      {
        options: ["Cash for Emergencies", "Borrowed money"],
        correctOption: "Cash for Emergencies",
      },
      { options: ["replace", "throw away"], correctOption: "replace" },
    ],
    successMessage:
      "Exactly! Cash for Emergencies gave Holly options when she needed them.",
  },
  "resolution-benefits-choice": {
    prompt:
      "Holly could fix the problem because she had Cash for Emergencies. What are the other benefits of not spending all of your money? Select the best answer:",
  },
  "milestone-splash": {
    skillLearnedLabel: "Skill Learned: Choose to keep Cash for Emergencies",
    bodyCopy:
      "Lesson complete! You've unlocked a huge secret: Having Cash for Emergencies means you're ready for whatever comes next.",
  },
};

export const M1_L3_LESSON_DEFINITION: CohortLessonDefinition = {
  meta: M1_L3_META,
  rewards: M1_L3_REWARDS,
  baseScreens: M1_L3_BASE_SCREENS,
  byCohort: {
    explorer: {
      characterName: "Mia",
    },
    pathfinder: {
      characterName: "Holly",
      rewards: { xpReward: 50, perfectStreakBonus: 0 },
      screenOverrides: M1_L3_PATHFINDER_OVERRIDES,
    },
  },
};
