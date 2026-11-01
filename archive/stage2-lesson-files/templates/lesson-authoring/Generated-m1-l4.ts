/* AUTO-GENERATED from spreadsheet — re-run: npm run lesson:import -- your-folder */

import { teenCompletionScreen } from "@/lib/academy/lessons/completion-screen";
import type { CohortLessonDefinition, ScreenConfig, ScreenOverrideMap } from "@/lib/academy/lessons/types";

const SKILL_TITLE = "Stop & Think";
const LEAD_CHARACTER = "Holly";

const M1_L4_META = {
  milestoneId: 4,
  levelId: 1,
  lessonNumber: 4,
  moduleTitle: "Module 1",
  lessonTitle: "Pause Under Pressure",
  shellLabel: "Module 1 · Lesson 4 · Pause Under Pressure",
  totalScreens: 8,
} as const;

const M1_L4_REWARDS = {
  skillSlug: "stop-and-think",
  achievementSkillSlug: "stop-and-think",
} as const;

const M1_L4_BASE_SCREENS: ScreenConfig[] = [
  {
    type: "binary-choice",
    id: "skill-spotlight",
    prompt: "All of Senna's friends are buying a limited-time game skin, but Lars notices that Senna decides to wait with getting one.\n\nWhat skill is Senna practicing?",
    optionA: {
      label: "Senna is just slow at clicking.",
      isCorrect: false,
    },
    optionB: {
      label: "Senna has run out of money.",
      isCorrect: true,
    },
    wrongError: "Not quite! Take another look at what Senna is choosing to do.",
    errorStyle: "inline-red",
  },
  {
    type: "bucket-sort",
    id: "pause-sequence",
    intro: "Senna explains why he waited: \"Remember the last time we all bought that game skin immediately? The next day, it was half price and it made me feel like I wasted my money because I rushed.\"\n\nDrag the steps into order.",
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
        id: "senna-sees-the-one-time-",
        label: "Senna sees the one-time offer.",
        bucket: "step1",
      },
      {
        id: "senna-remembers-the-pric",
        label: "Senna remembers the price could drop later.",
        bucket: "step2",
      },
      {
        id: "senna-waits-a-day-and-ch",
        label: "Senna waits a day and checks again.",
        bucket: "step3",
      },
      {
        id: "senna-is-happy-he-waited",
        label: "Senna is happy he waited - he can buy the same item for even less.",
        bucket: "step4",
      },
    ],
  },
  {
    type: "bucket-sort",
    id: "rush-vs-think-sort",
    intro: "Help Lars and Mia sort their thoughts. Which ones are making them rush? And which ones help them pause and think?",
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
        id: "it-looks-cool-i-need-it-",
        emoji: "🔥",
        label: "It looks cool, I need it right now!",
        bucket: "rushing",
      },
      {
        id: "everyone-has-it-i-don-t-",
        emoji: "👥",
        label: "Everyone has it, I don't want to be left out.",
        bucket: "rushing",
      },
      {
        id: "it-s-a-limited-time-offe",
        emoji: "⏰",
        label: "It's a 'limited time' offer - I have to buy it now!",
        bucket: "rushing",
      },
      {
        id: "i-ll-ask-my-friends-if-i",
        emoji: "💬",
        label: "I'll ask my friends if it's actually any good.",
        bucket: "thinking",
      },
      {
        id: "i-can-wait-and-get-it-ch",
        emoji: "💰",
        label: "I can wait and get it cheaper later.",
        bucket: "thinking",
      },
      {
        id: "i-ll-sleep-on-it-and-dec",
        emoji: "😴",
        label: "I'll sleep on it and decide tomorrow.",
        bucket: "thinking",
      },
    ],
  },
  {
    type: "binary-choice",
    id: "pressure-sign-picks",
    prompt: "Select which parts of the sign are making Lars rush.",
    optionA: {
      label: "DON'T MISS OUT!",
      isCorrect: true,
    },
    optionB: {
      label: "ONLY 2 LEFT!",
      isCorrect: false,
    },
    wrongError: "Not quite - that's just info on the sign, not a pressure trick.",
    errorStyle: "inline-red",
  },
  {
    type: "binary-choice",
    id: "lars-check-questions",
    prompt: "Lars is playing a game and he gets a limited-time offer to buy extra lives for a discount. Lars remembers Senna's advice. Before he decides whether to spend his money, he stops.\n\nWhich questions should Lars ask himself?",
    optionA: {
      label: "Do I really need this, instead of saving the money for something else?",
      isCorrect: true,
    },
    optionB: {
      label: "Do I really want this right now, or is something trying to make me rush?",
      isCorrect: false,
    },
    wrongError: "Not quite! That button is trying to do the thinking for you. Don't let it!",
    errorStyle: "inline-red",
  },
  {
    type: "custom",
    id: "lars-save-coins",
    renderer: "gift-reveal",
  },
  {
    type: "custom",
    id: "lars-workshop-goal",
    renderer: "value-accumulator",
  },
  teenCompletionScreen({ skillTitle: SKILL_TITLE }),
];

const EXPLORER_OVERRIDES: ScreenOverrideMap = {
  "skill-spotlight": {
    wrongError: "Look again at what Senna is choosing to do.",
    optionA: {
      label: "Senna is just slow at clicking.",
      isCorrect: false,
    },
    optionB: {
      label: "Senna has run out of money.",
      isCorrect: true,
    },
  },
  "pressure-sign-picks": {
    wrongError: "That's just sign info, not a rush trick.",
  },
  "lars-check-questions": {
    wrongError: "That button wants to think for you. Skip it!",
  },
};

const MAVERICK_OVERRIDES: ScreenOverrideMap = {};

export const M1_L4_LESSON_DEFINITION: CohortLessonDefinition = {
  meta: M1_L4_META,
  rewards: M1_L4_REWARDS,
  baseScreens: M1_L4_BASE_SCREENS,
  byCohort: {
    explorer: { characterName: "Senna", screenOverrides: EXPLORER_OVERRIDES },
    pathfinder: { characterName: "Holly" },
    maverick: { characterName: "Holly", screenOverrides: MAVERICK_OVERRIDES },
  },
};

// ⚠️ This lesson uses custom game types (gift-reveal, value-accumulator). A developer must wire renderers before it can ship.
