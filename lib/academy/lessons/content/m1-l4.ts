import { explorerCompletionScreen } from "@/lib/academy/lessons/completion-screen";
import type {
  CohortLessonDefinition,
  ScreenConfig,
  ScreenOverrideMap,
} from "@/lib/academy/lessons/types";

const M1_L4_META = {
  milestoneId: 4,
  levelId: 1,
  lessonNumber: 4,
  moduleTitle: "How the Money Game Works",
  lessonTitle: "Pause Under Pressure",
  shellLabel: "How the Money Game Works · Lesson 4 · Pause Under Pressure",
  totalScreens: 8,
  shippedCohorts: ["explorer"],
  characters: {
    lead: "Senna",
    support: "Senna",
    explorer: "Senna",
    pathfinder: "Holly",
    maverick: "Aiden",
  },
} as const;

const M1_L4_REWARDS = {
  skillSlug: "stop-and-think",
  achievementSkillSlug: "stop-and-think",
  xpReward: 100,
  perfectStreakBonus: 50,
} as const;

const M1_L4_BASE_SCREENS: ScreenConfig[] = [
  {
    type: "binary-choice",
    id: "skill-spotlight",
    illustrationId: "senna-thinking",
    prompt:
      "All of Senna's friends are buying a limited-time game skin, but Lars notices that Senna decides to wait with getting one.\n\nWhat skill is Senna practicing?",
    optionA: {
      label: "Senna is just slow at clicking.",
      isCorrect: false,
      feedback: "Not quite! Senna is actually being smart by not rushing into a trap.",
    },
    optionB: {
      label: "Senna has run out of money.",
      isCorrect: false,
      feedback:
        "Nah, running out of cash isn't a skill! What Senna is choosing to do instead?",
    },
    optionC: {
      label: "Senna stops to think.",
      isCorrect: true,
      feedback:
        "That's right! Senna is hitting the brakes before his brain makes a quick mistake.",
    },
    successMessage:
      "That's right! Senna is hitting the brakes before his brain makes a quick mistake.",
    wrongError: "Not quite! Take another look at what Senna is choosing to do.",
    errorStyle: "inline-red",
    advance: { mode: "on-complete" },
  },
  {
    type: "bucket-sort",
    id: "pause-sequence",
    intro:
      'Lars asks Senna why he waited. Senna explains: "Remember the last time we all bought that game skin on day one? Two days later, it was half-price. I felt I wasted half of my money."\n\nDrag each step into the correct order:',
    illustration: {
      emoji: "⏸️",
      label: "Pause before you buy",
      alt: "Senna pauses before a limited-time offer",
    },
    layout: "steps-row",
    buckets: [
      { id: "step1", label: "Step 1" },
      { id: "step2", label: "Step 2" },
      { id: "step3", label: "Step 3" },
      { id: "step4", label: "Step 4" },
    ],
    items: [
      {
        id: "see-offer",
        emoji: "🏷️",
        label: 'Senna sees the "Limited Time" offer.',
        bucket: "step1",
      },
      {
        id: "remember",
        emoji: "🛑",
        label: "He stops and remembers the price might drop later.",
        bucket: "step2",
      },
      {
        id: "wait",
        emoji: "⏳",
        label: "He waits two days to check the price again.",
        bucket: "step3",
      },
      {
        id: "buy-if-cheaper",
        emoji: "💸",
        label: "Senna only buys it, if the price is cheaper than before.",
        bucket: "step4",
      },
    ],
    successMessage:
      "Perfect! Senna didn't rush. He checked the price, and he stayed in control of his spending.",
    advance: { mode: "all-items-sorted" },
  },
  {
    type: "bucket-sort",
    id: "rush-vs-think-sort",
    layout: "statement-sort",
    intro:
      "Help Lars and Mia sort their thoughts. Which ones are making them rush? And which ones help them pause and think?",
    buckets: [
      { id: "rushing", label: "I'm Rushing", tone: "rush", icon: "⚡" },
      { id: "thinking", label: "I'm Thinking", tone: "think", icon: "🧠" },
    ],
    items: [
      {
        id: "need-now",
        emoji: "🔥",
        label: "It looks cool, I need it right now!",
        bucket: "rushing",
      },
      {
        id: "left-out",
        emoji: "👥",
        label: "Everyone has it, I don't want to be left out.",
        bucket: "rushing",
      },
      {
        id: "limited-time",
        emoji: "⏰",
        label: "It's a 'limited time' offer - I have to buy it now!",
        bucket: "rushing",
      },
      {
        id: "ask-friends",
        emoji: "💬",
        label: "I'll ask my friends if it's actually any good.",
        bucket: "thinking",
      },
      {
        id: "wait-cheaper",
        emoji: "💰",
        label: "I can wait and get it cheaper later.",
        bucket: "thinking",
      },
      {
        id: "sleep-on-it",
        emoji: "😴",
        label: "I'll sleep on it and decide tomorrow.",
        bucket: "thinking",
      },
    ],
    successMessage:
      "Perfect! You've sorted the rush from the think. Lars and Mia are in control now!",
    advance: { mode: "all-items-sorted" },
  },
  {
    type: "binary-choice",
    id: "pressure-sign-picks",
    illustrationId: "pair-lars-mia-walking",
    selectionMode: "multi-correct",
    optionLayout: "radio-list",
    imagePlaceholder: {
      label: "Fishing rod sign",
      alt: "Flashy shop sign advertising a fishing rod",
    },
    scenePrompt:
      "Mia and Lars are walking home from school. They walk past a big, flashy sign for a fishing rod. It's making Lars want to rush to the shop and buy it immediately.",
    prompt: "Select which parts of the sign are making Lars rush.",
    optionA: { label: "DON'T MISS OUT!", isCorrect: true },
    optionB: { label: "ONLY 2 LEFT!", isCorrect: true },
    optionC: { label: "ENDS TOMORROW!", isCorrect: true },
    optionD: { label: "Made in France", isCorrect: false },
    optionE: { label: "Quality guaranteed", isCorrect: false },
    successMessage:
      "That's right. These are all tricks so you spend your money, without stopping to think.",
    wrongError: "Not quite - that's just info on the sign, not a pressure trick.",
    errorStyle: "inline-red",
    advance: { mode: "on-complete" },
  },
  {
    type: "binary-choice",
    id: "lars-check-questions",
    illustrationId: "lars-thinking",
    selectionMode: "multi-correct",
    lockCorrectSelections: true,
    wrongInteraction: "shake",
    prompt:
      "Lars is playing a game and he gets a limited-time offer to buy extra lives for a discount. Lars remembers Senna's advice. Before he decides whether to spend his money, he stops.\n\nWhich questions should Lars ask himself?",
    optionA: {
      label: "Do I really need this, instead of saving the money for something else?",
      isCorrect: true,
    },
    optionB: {
      label:
        "Do I really want this right now, or is something trying to make me rush?",
      isCorrect: true,
    },
    optionC: {
      label: "If I buy this, do I have enough money left for my other goals?",
      isCorrect: true,
    },
    optionD: {
      label: "CLICK HERE TO BUY NOW!",
      isCorrect: false,
      feedback:
        "Not quite! That button is trying to do the thinking for you. Don't let it!",
    },
    successMessage:
      "Great questions! Lars is thinking for himself - not letting the game rush him into spending.",
    wrongError:
      "Not quite! That button is trying to do the thinking for you. Don't let it!",
    errorStyle: "inline-red",
    advance: { mode: "on-complete" },
  },
  {
    type: "drag-to-target",
    id: "lars-save-coins",
    illustrationId: "lars-happy",
    intro:
      "Lars chooses to keep his money. Swipe his money from 'Spend Now' to 'Save for Later'.",
    sourceLabel: "Spend Now",
    targetLabel: "Save for Later",
    itemEmoji: "🪙",
    coinCount: 5,
    successMessage: "Lars's money is safe from mindless spending!",
    advance: { mode: "on-complete" },
  },
  {
    type: "savings-goal",
    id: "lars-workshop-goal",
    intro:
      "Lars is at a local bike event, and he sees the sign he's been waiting for: 'Learn to Wheelie - 30 Minute Workshop: $20.' To afford the Wheelie Workshop, Lars had to say 'no' to a few things over the last two weeks. Drag the three items Lars didn't buy into the 'Things Lars didn't buy' box to reach his $20 goal.",
    meterLabel: "Savings for Workshop",
    targetAmount: 20,
    poolColumnLabel: "Things Lars wants to buy",
    dropZoneLabel: "Things Lars didn't buy",
    imagePlaceholder: {
      label: "Lars doing a wheelie on his bike",
      alt: "Lars doing a wheelie on his bike at the bike event",
    },
    items: [
      { id: "snacks", label: "Snacks at school", price: 5, emoji: "🍫" },
      { id: "lives", label: "Extra Lives Bundle", price: 5, emoji: "🎮" },
      { id: "flashlight", label: "Flashlight", price: 10, emoji: "🔦" },
    ],
    workshopSignTitle: "Learn to Wheelie - 30 Minute Workshop: $20",
    lockedLabel: "Locked",
    unlockedLabel: "Sign Up Now!",
    goalAchievedLabel: "Goal Achieved!",
    successMessage: "Goal Achieved! Lars saved enough for the Wheelie Workshop.",
    advance: { mode: "on-complete" },
  },
  explorerCompletionScreen("milestone-splash", "medal-skill1-bronze"),
];

/** Explorer: no success paragraphs; one-line wrong hints only. */
const M1_L4_EXPLORER_OVERRIDES: ScreenOverrideMap = {
  "skill-spotlight": {
    optionA: { feedback: "Not quite! Senna isn't rushing into a trap." },
    optionB: { feedback: "Nah, empty pockets isn't a skill. Try again!" },
    optionC: { feedback: "" },
    successMessage: "",
    wrongError: "Look again at what Senna is choosing to do.",
  },
  "pause-sequence": {
    successMessage: "",
  },
  "rush-vs-think-sort": {
    successMessage: "",
  },
  "pressure-sign-picks": {
    successMessage: "",
    wrongError: "That's just sign info, not a rush trick.",
  },
  "lars-check-questions": {
    optionD: { feedback: "That button wants to think for you. Skip it!" },
    successMessage: "",
    wrongError: "That button wants to think for you. Skip it!",
  },
  "lars-save-coins": {
    successMessage: "",
  },
  "lars-workshop-goal": {
    successMessage: "",
  },
};

export const M1_L4_LESSON_DEFINITION: CohortLessonDefinition = {
  meta: M1_L4_META,
  rewards: M1_L4_REWARDS,
  baseScreens: M1_L4_BASE_SCREENS,
  byCohort: {
    explorer: {
      characterName: "Senna",
      screenOverrides: M1_L4_EXPLORER_OVERRIDES,
    },
    pathfinder: {
      characterName: "Holly",
    },
  },
};
