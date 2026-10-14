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
} as const;

const M1_L4_BASE_SCREENS: ScreenConfig[] = [
  {
    type: "binary-choice",
    id: "skill-spotlight",
    pairImage: "lars-senna-sidebyside.webp",
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
    choiceFeedback: "neutral-selected",
    advance: { mode: "on-complete" },
  },
  {
    type: "bucket-sort",
    id: "pause-sequence",
    intro:
      'Senna explains why he waited: "Remember the last time we all bought that game skin immediately? The next day, it was half price and it made me feel like I wasted my money because I rushed."\n\nDrag the steps into order.',
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
        label: "Senna sees the one-time offer.",
        bucket: "step1",
      },
      {
        id: "remember",
        label: "Senna remembers the price could drop later.",
        bucket: "step2",
      },
      {
        id: "wait",
        label: "Senna waits a day and checks again.",
        bucket: "step3",
      },
      {
        id: "buy-if-cheaper",
        label: "Senna is happy he waited - he can buy the same item for even less.",
        bucket: "step4",
      },
    ],
    successMessage:
      "Perfect! Senna didn't rush. He checked the price, and he stayed in control of his spending.",
    advance: { mode: "all-items-sorted" },
  },
  {
    type: "spotlight-rounds",
    id: "pause-thoughts",
    pairImage: false,
    prompt: "Which one helps Lars stop and think?",
    rounds: [
      {
        iconA: "⏰",
        optionA: "It's a limited time offer - I have to buy it now!",
        iconB: "💰",
        optionB: "I can wait and get it cheaper later.",
        correct: "b",
        error: "That thought is rushing you. Pick the one that helps you stop.",
      },
      {
        iconA: "🔥",
        optionA: "It looks cool, I need it right now!",
        iconB: "😴",
        optionB: "I'll sleep on it and decide tomorrow.",
        correct: "b",
        error: "That thought is rushing you. Pick the one that helps you stop.",
      },
      {
        iconA: "👥",
        optionA: "Everyone has it, I don't want to be left out.",
        iconB: "💬",
        optionB: "I'll ask my friends if it's actually any good.",
        correct: "b",
        error: "That thought is rushing you. Pick the one that helps you stop.",
      },
    ],
  },
  {
    type: "binary-choice",
    id: "pressure-sign-picks",
    pairImage: "fishing-rod-sign.webp",
    illustration: {
      alt: "Sale sign for a fishing rod",
      scale: 1,
    },
    selectionMode: "multi-correct",
    optionLayout: "radio-list",
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
    pairImage: "lars-thinking-512.webp",
    selectionMode: "multi-correct",
    lockCorrectSelections: true,
    wrongInteraction: "shake",
    prompt:
      "Lars gets a limited-time offer for extra lives in his game. He remembers Senna's advice and stops. What should he ask himself?",
    optionA: {
      label: "Do I really need this?",
      isCorrect: true,
    },
    optionB: {
      label: "Do I want it now, or is something rushing me?",
      isCorrect: true,
    },
    optionC: {
      label: "Will I have enough left for my goals?",
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
    pairImage: "lars-celebrating-512.webp",
    intro:
      "Lars chooses to keep his money. Swipe his money from 'Spend Now' to 'Save for Later'.",
    sourceLabel: "Spend Now",
    targetLabel: "Save for Later",
    sourceImageFile: "money-coin.webp",
    sourceIllustrationAlt: "Coin",
    targetImageFile: "piggy-bank.webp",
    targetIllustrationAlt: "Piggy bank",
    coinCount: 1,
    itemSize: "lg",
    showZoneLabels: false,
    successMessage: "Lars's money is safe from mindless spending!",
    advance: { mode: "on-complete" },
  },
  {
    type: "savings-goal",
    id: "lars-workshop-goal",
    intro:
      "Lars wants to do a $20 wheelie workshop. To afford it, he said no to three things. Drag them into the box to reach his goal.",
    meterLabel: "Savings",
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
  explorerCompletionScreen("milestone-splash"),
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

const M1_L4_PATHFINDER_OVERRIDES: ScreenOverrideMap = {
  "pause-thoughts": {
    prompt: "Which one helps Holly stop and think?",
  },
  "pressure-sign-picks": {
    prompt: "Select which parts of the sign are making Holly rush.",
    scenePrompt:
      "Immi and Holly are walking through the shops. They walk past a big, flashy sign for a fishing rod. It's making Holly want to rush in and buy it immediately.",
  },
  "lars-check-questions": {
    prompt:
      "Holly gets a limited-time offer for extra lives in her game. She remembers Mia's advice and stops. What should she ask herself?",
  },
  "lars-save-coins": {
    intro:
      "Holly chooses to keep her money. Swipe her money from 'Spend Now' to 'Save for Later'.",
  },
  "lars-workshop-goal": {
    intro:
      "Holly wants to do a $20 nail-art workshop. To afford it, she said no to three things. Drag them into the box to reach her goal.",
    dropZoneLabel: "Things Holly didn't buy",
    items: [
      { id: "snacks", label: "Snacks at school", price: 5, emoji: "🍫" },
      { id: "lives", label: "Extra Lives Bundle", price: 5, emoji: "🎮" },
      { id: "flashlight", label: "Flashlight", price: 10, emoji: "🔦" },
    ],
  },
};

const M1_L4_MAVERICK_OVERRIDES: ScreenOverrideMap = {
  "pause-thoughts": {
    prompt: "Which one helps Aiden stop and think?",
  },
  "pressure-sign-picks": {
    prompt: "Select which parts of the sign are making Aiden rush.",
    scenePrompt:
      "Dash and Aiden are at a local market. They walk past a big, flashy sign for a fishing rod. It's making Aiden want to rush in and buy it immediately.",
  },
  "lars-check-questions": {
    prompt:
      "Aiden gets a limited-time offer for extra lives in his game. He remembers Dash's advice and stops. What should he ask himself?",
  },
  "lars-save-coins": {
    intro:
      "Aiden chooses to keep his money. Swipe his money from 'Spend Now' to 'Save for Later'.",
  },
  "lars-workshop-goal": {
    intro:
      "Aiden wants to do a $20 wheelie workshop. To afford it, he said no to three things. Drag them into the box to reach his goal.",
    dropZoneLabel: "Things Aiden didn't buy",
    items: [
      { id: "snacks", label: "Snacks at work", price: 5, emoji: "🍫" },
      { id: "lives", label: "Extra Lives Bundle", price: 5, emoji: "🎮" },
      { id: "flashlight", label: "Flashlight", price: 10, emoji: "🔦" },
    ],
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
      screenOverrides: M1_L4_PATHFINDER_OVERRIDES,
    },
    maverick: {
      characterName: "Aiden",
      screenOverrides: M1_L4_MAVERICK_OVERRIDES,
    },
  },
};
