import type { CohortLessonDefinition, ScreenConfig } from "@/lib/academy/lessons/types";

const M1_L3_META = {
  milestoneId: 3,
  levelId: 1,
  lessonNumber: 3,
  moduleTitle: "Module 1",
  lessonTitle: "Keep Some Money Aside",
  shellLabel: "Module 1 · Lesson 3 · Keep Some Money Aside",
  totalScreens: 8,
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
    successMessage: "Mia has no money left to pay for new headphones.",
    advance: { mode: "all-items-sorted" },
  },
  {
    type: "link-match",
    id: "spare-vs-spend-match",
    intro:
      "Senna explains that keeping Spare Cash gives you options. Match the event to the benefit.",
    eventColumnLabel: "The Event",
    benefitColumnLabel: "The Win",
    pairs: [
      {
        id: "headphones",
        event: "Headphones break",
        benefit: "Fix them fast",
      },
      {
        id: "birthday",
        event: "Friend's birthday",
        benefit: "Buy a gift",
      },
      {
        id: "sale",
        event: "A cool sale",
        benefit: "Grab the deal",
      },
    ],
    successMessage: "Match successful!",
    wrongError: "Not quite — try linking a different win.",
    advance: { mode: "on-complete" },
  },
  {
    type: "bucket-sort",
    id: "spare-cash-steps",
    intro:
      "Ready to build your own Spare Cash? Put these steps in order so you're never caught out again.",
    buckets: [
      { id: "step1", label: "Step 1" },
      { id: "step2", label: "Step 2" },
      { id: "step3", label: "Step 3" },
    ],
    items: [
      {
        id: "pocket-money",
        label: "Get your pocket money.",
        bucket: "step1",
      },
      {
        id: "buffer",
        label: "Move a small amount to your 'Buffer' jar.",
        bucket: "step2",
      },
      {
        id: "fun",
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
      "Mia has the $40 Spare Cash. She sees a $10 toy and thinks she'll spend it now.",
    optionA: {
      label: "Buy the toy and save more next week",
      isCorrect: false,
    },
    optionB: {
      label: "Buy the headphones to fix what she broke",
      isCorrect: true,
    },
    optionC: { label: "Buy the toy and hope", isCorrect: false },
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
      { options: ["save", "spend"], correctOption: "save" },
      { options: ["Spare Cash", "Borrowed money"], correctOption: "Spare Cash" },
      { options: ["replace", "throw away"], correctOption: "replace" },
    ],
    narrativeBefore: "",
    narrativeAfter: "",
    options: [],
    correctOption: "",
    wrongError: "Try again!",
    advance: { mode: "on-complete" },
  },
  {
    type: "narrative-bonus",
    id: "resolution-bonus",
    narrative:
      "Mia could fix the problem because she had spare cash. What are the other benefits of not spending all of your money?",
    successMessage:
      "Exactly! Keeping some money means you're in charge...",
    bonusXp: 0,
    bonusTapLabel: "",
    autoReadyWhenNoBonus: true,
    advance: { mode: "auto-ready" },
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
    },
  },
};
