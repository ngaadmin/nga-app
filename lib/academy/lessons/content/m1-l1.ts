import {
  explorerCompletionScreen,
  teenCompletionScreen,
} from "@/lib/academy/lessons/completion-screen";
import type {
  CohortLessonDefinition,
  ScreenConfig,
  ScreenOverrideMap,
} from "@/lib/academy/lessons/types";

const M1_L1_META = {
  milestoneId: 1,
  levelId: 1,
  lessonNumber: 1,
  moduleTitle: "Module 1",
  lessonTitle: "Money In, Money Out",
  shellLabel: "Module 1 · Lesson 1 · Money In, Money Out",
  totalScreens: 8,
  shippedCohorts: ["explorer", "pathfinder", "maverick"],
} as const;

const M1_L1_REWARDS = {
  skillSlug: "stop-and-think",
  achievementSkillSlug: "stop-and-think",
  xpReward: 150,
  perfectStreakBonus: 50,
} as const;

/** Pathfinder copy as canonical base — Explorer and Maverick patch via overrides. */
const M1_L1_BASE_SCREENS: ScreenConfig[] = [
  {
    type: "word-drop",
    id: "hook-word-drop",
    narrativeBefore:
      "Holly made $25 from her weekend chores. At the mall, her friends are all showing off their new eyelash extensions and she feels the sudden urge to get hers done too. Her brain tricks her into thinking the cash must be",
    narrativeAfter: "right away!",
    options: ["Spent", "Saved", "Hidden"],
    correctOption: "Spent",
    wrongError:
      "Not quite! Holly's friends are showing off - what's her brain pushing her to do with that $25?",
  },
  {
    type: "binary-choice",
    id: "short-fun-reality",
    prompt:
      "Holly gets her eyelashes done right away with the $25 but ten minutes later...",
    optionA: {
      label: "...the initial excitement fades and her $25 is gone.",
      isCorrect: true,
    },
    optionB: {
      label: "...her $25 magically reappears in her wallet.",
      isCorrect: false,
    },
    wrongError:
      "If only! In the real world, once you trade your cash, it's gone. Try again!",
    errorStyle: "inline-red",
  },
  {
    type: "tap-reveal",
    id: "tap-short-vs-long",
    intro:
      "Holly's $25 is gone and she only had a few minutes of excitement. Tap these items to see the difference between short fun and longer fun!",
    tapDisplay: "emoji-only",
    revealDisplay: "emoji-only",
    buckets: [
      { id: "short", label: "Short Fun", tone: "short" },
      { id: "long", label: "More Fun for Longer", tone: "long" },
    ],
    items: [
      { id: "slime", emoji: "🧪", label: "Glow-in-the-dark slime kit", bucket: "short" },
      { id: "candy", emoji: "🍬", label: "Candy salad", bucket: "short" },
      { id: "hoodie", emoji: "🧥", label: "Viral hoodie", bucket: "long" },
      { id: "bottle", emoji: "🥤", label: "Water bottle", bucket: "long" },
    ],
  },
  {
    type: "bucket-sort",
    id: "sort-short-vs-long",
    intro: "Your turn! Sort these items into the correct bucket.",
    buckets: [
      { id: "short", label: "Short Fun" },
      { id: "long", label: "More Fun for Longer" },
    ],
    items: [
      { id: "bubble-tea", emoji: "🧋", label: "Giant bubble tea", bucket: "short" },
      {
        id: "glow-sticks",
        emoji: "🪄",
        label: "Cheap glow sticks / LED toys",
        bucket: "short",
      },
      {
        id: "speaker",
        emoji: "🔊",
        label: "Wireless speaker for hangouts",
        bucket: "long",
      },
      {
        id: "journal",
        emoji: "📓",
        label: "Journal + good pen set",
        bucket: "long",
      },
    ],
  },
  {
    type: "binary-choice",
    id: "countdown-trap",
    prompt:
      'Holly\'s playing online and a game alert flashes: "Limited time - new skin 70% off! 15 MINUTES LEFT!" Why is the game rushing her?',
    optionA: {
      label: "To stop her from pausing to decide if she really needs it.",
      isCorrect: true,
    },
    optionB: {
      label: "Because they want to make sure she gets a good deal.",
      isCorrect: false,
    },
    wrongError:
      "Don't fall for the countdown! They're rushing Holly so she won't stop to think if she really wants to spend her money on it. Try again!",
    errorStyle: "banner",
  },
  {
    type: "hold-to-fill",
    id: "impulse-pause",
    narrative:
      "Holly isn't sure but her friends are blowing up the in-game chat. They're all bragging that they just bought it. Let's give Holly some time to think, but silencing the chat alerts.",
    holdLabel: "🔕 HOLD TO SILENCE 🔕",
    frozenLabel: "🔕 SILENCED 🔕",
    successMessage: "Thank you! Holly's had time to think.",
    clearOnSuccess: true,
    holdDurationMs: 2000,
  },
  {
    type: "narrative-bonus",
    id: "resolution",
    narrative:
      "Holly chooses to keep her money instead of giving in to the rush. Tap to collect bonus 50 XP for successfully staying in control of spending.",
    bonusXp: 50,
    bonusTapLabel: "[ COLLECT 50 XP BONUS ]",
    autoReadyWhenNoBonus: false,
  },
  teenCompletionScreen({ skillTitle: "Stop & Think", xpReward: 50 }),
];

const EXPLORER_OVERRIDES: ScreenOverrideMap = {
  "hook-word-drop": {
    narrativeBefore:
      "Lars just got $20 for his birthday! He runs to the shop, but his brain tricks him into thinking cash must be",
    wrongError:
      "Not quite! Look how fast Lars is running - what is his brain telling him to do?",
  },
  "short-fun-reality": {
    prompt:
      "Lars buys a giant bag of sour worms and a plastic fidget spinner. He's super happy, but ten minutes later...",
    optionA: {
      label: "...the candy is gone and the toy feels boring.",
      isCorrect: true,
    },
    optionB: {
      label: "...his $20 cash magically reappears.",
      isCorrect: false,
    },
    wrongError:
      "If only! In the real world, once you trade your cash, it's gone. Try again.",
  },
  "tap-short-vs-long": {
    intro:
      "Lars's money is gone and he only had 10 minutes of fun. Tap these items to see the difference!",
    tapDisplay: "emoji-label",
    revealDisplay: "emoji-label",
    items: [
      { id: "worms", emoji: "🍬", label: "Sour Worms", bucket: "short" },
      { id: "popcorn", emoji: "🍿", label: "Cinema Popcorn", bucket: "short" },
      { id: "headphones", emoji: "🎧", label: "Wireless Headphones", bucket: "long" },
      { id: "skateboard", emoji: "🛹", label: "Skateboard", bucket: "long" },
    ],
  },
  "sort-short-vs-long": {
    items: [
      { id: "pizza", emoji: "🍕", label: "Pizza slice", bucket: "short" },
      {
        id: "bubble-tea",
        emoji: "🥤",
        label: "Bubble tea with all the toppings",
        bucket: "short",
      },
      {
        id: "controller",
        emoji: "🎮",
        label: "Gaming controller",
        bucket: "long",
      },
      { id: "emote", emoji: "💃", label: "Dance Emote", bucket: "long" },
    ],
  },
  "countdown-trap": {
    prompt:
      "Next day, an alert flashes on Lars's tablet: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?",
    optionA: { label: "To trick his brain into buying fast.", isCorrect: true },
    optionB: {
      label: "Because the game creators love him.",
      isCorrect: false,
    },
    wrongError:
      "Don't fall for the flashing countdown! They're giving Lars only 1 minute so he won't stop to think if he really wants to spend his money on it.",
  },
  "impulse-pause": {
    narrative:
      "Don't tap buy! Stop the rush with a 24-Hour Buy Freeze. Give your brain time to cool down.",
    holdLabel: "❄️ HOLD TO FREEZE ❄️",
    frozenLabel: "❄️ FROZEN ❄️",
    successMessage: "Success! Lars has to wait 24 hours.",
    clearOnSuccess: false,
  },
  resolution: {
    narrative:
      "The freeze worked! The next morning, Lars realized he didn't even want that skin anymore. He kept his money safe to save for a new gaming headset. Congratulations for helping him avoid wasting his money.",
    bonusXp: 0,
    bonusTapLabel: "",
    autoReadyWhenNoBonus: true,
  },
  "milestone-splash": {
    _replace: true,
    ...explorerCompletionScreen(),
  },
};

const MAVERICK_OVERRIDES: ScreenOverrideMap = {
  "hook-word-drop": {
    narrativeBefore:
      "Dash just got $40 cash from a quick delivery gig. He opens the marketplace app and sees the exact wireless earbuds he's been tracking. His brain tricks him into thinking the cash must be",
    wrongError:
      "Not quite! Dash spotted those earbuds - what's his brain pushing him to do with that $40?",
  },
  "short-fun-reality": {
    prompt:
      "Dash buys the wireless earbuds for $40 on the marketplace and picks them up straight away. He's super happy with how they sound at first, but a few hours later...",
    optionA: {
      label: "...the thrill starts to wear off and his $40 is spent.",
      isCorrect: true,
    },
    optionB: {
      label: "...the seller gives him his money back because he bought them so quickly.",
      isCorrect: false,
    },
    wrongError:
      "If only! On the marketplace, once you pay and take the item, the money is gone. No instant refunds just for buying fast. Try again!",
  },
  "tap-short-vs-long": {
    intro:
      "Dash's $40 is gone after buying the earbuds and he only had a short burst of satisfaction. Tap these items to see the difference between things that give short fun and things that give more fun for longer!",
    items: [
      { id: "energy-snack", emoji: "⚡", label: "Energy drink + snack", bucket: "short" },
      {
        id: "scratch-ticket",
        emoji: "🎫",
        label: "Scratch-it lottery ticket",
        bucket: "short",
      },
      { id: "speaker", emoji: "🔊", label: "Wireless speaker", bucket: "long" },
      { id: "multitool", emoji: "🔧", label: "Multi-tool / pocket knife", bucket: "long" },
    ],
  },
  "sort-short-vs-long": {
    intro: "Your turn!",
    items: [
      {
        id: "delivery",
        emoji: "🍔",
        label: "Food delivery with priority fee",
        bucket: "short",
      },
      {
        id: "merch",
        emoji: "👕",
        label: "Disposable concert merch",
        bucket: "short",
      },
      {
        id: "guitar",
        emoji: "🎸",
        label: "Second-hand quality guitar",
        bucket: "long",
      },
      {
        id: "clothing",
        emoji: "🧥",
        label: "High-quality piece of clothing",
        bucket: "long",
      },
    ],
  },
  "countdown-trap": {
    prompt:
      'Later that day Dash receives a text message: "Flash sale on premium bike lights - huge discount but ONLY 10 MINUTES LEFT!" Why is the offer rushing him?',
    optionA: {
      label: "To trick his brain into buying fast without thinking.",
      isCorrect: true,
    },
    optionB: {
      label: "Because the company genuinely cares about Dash's safety.",
      isCorrect: false,
    },
    wrongError:
      "Don't fall for the countdown! They're rushing Dash so he won't stop to think if he really wants to spend his money on it. Try again!",
  },
  "impulse-pause": {
    narrative:
      "If dash had time to think, he'd remember how a similar item he bought last month dropped in price the very next day. Hit the 'pause' button so Dash can think if he really needs the item right now.",
    holdLabel: "⏸️ HOLD TO PAUSE ⏸️",
    frozenLabel: "⏸️ PAUSED ⏸️",
    successMessage:
      "Dash pauses and realizes: 'It's just a flash sale. I don't really need this right now and there will always be another deal.'",
    clearOnSuccess: true,
  },
  resolution: {
    narrative:
      "Dash walked away from the impulsive offer and kept his money exactly where it belongs: in his pocket.\n\nTap to collect 50xp for successfully avoiding the spending trap.",
    bonusXp: 50,
    bonusTapLabel: "[ COLLECT 50 XP BONUS ]",
    autoReadyWhenNoBonus: false,
  },
};

const TEEN_REWARDS = {
  xpReward: 50,
  perfectStreakBonus: 0,
} as const;

export const M1_L1_LESSON_DEFINITION: CohortLessonDefinition = {
  meta: M1_L1_META,
  rewards: M1_L1_REWARDS,
  baseScreens: M1_L1_BASE_SCREENS,
  byCohort: {
    explorer: {
      characterName: "Lars",
      screenOverrides: EXPLORER_OVERRIDES,
    },
    pathfinder: {
      characterName: "Holly",
      rewards: TEEN_REWARDS,
    },
    maverick: {
      characterName: "Dash",
      screenOverrides: MAVERICK_OVERRIDES,
      rewards: TEEN_REWARDS,
    },
  },
};
