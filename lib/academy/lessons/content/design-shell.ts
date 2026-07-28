/**
 * VISUAL DESIGN SHELL — DEV / QA ONLY
 * ───────────────────────────────────
 * This lesson exists solely for layout, spacing, and interaction QA across every
 * standard Academy game type. It must NEVER appear on the Academy journey map or
 * be shown to real users in production.
 *
 * Open in development: /dashboard/academy/lesson/shell
 */

import { explorerCompletionScreen } from "@/lib/academy/lessons/completion-screen";
import type { CohortLessonDefinition, ScreenConfig } from "@/lib/academy/lessons/types";

/** Stable milestone id for the design shell (not on the Academy map). */
export const DESIGN_SHELL_MILESTONE_ID = 9001;

const AUTO_READY = { advance: { mode: "auto-ready" as const } };

const SHELL_SCENE_EMOJIS = [
  "💸",
  "📺",
  "🧾",
  "🏷️",
  "⚡",
  "🫙",
  "🛍️",
  "🔗",
  "📊",
  "🔦",
  "⏸️",
  "🪙",
  "🚲",
  "🎚️",
  "👛",
  "🎁",
  "🏆",
] as const;

function shellIllustration(index: number) {
  return {
    illustration: {
      emoji: SHELL_SCENE_EMOJIS[index % SHELL_SCENE_EMOJIS.length],
      label: "Scene placeholder",
      alt: "Placeholder illustration for visual QA",
    },
  };
}

const DESIGN_SHELL_META = {
  milestoneId: DESIGN_SHELL_MILESTONE_ID,
  levelId: 0,
  lessonNumber: 0,
  moduleTitle: "Design QA",
  lessonTitle: "Screen Design Shell",
  shellLabel: "Design Shell · Visual QA",
  totalScreens: 17,
  isDesignShell: true,
  shippedCohorts: [] as const,
} as const;

const DESIGN_SHELL_REWARDS = {
  skillSlug: "design-shell",
  achievementSkillSlug: "design-shell",
  xpReward: 0,
  perfectStreakBonus: 0,
} as const;

const DESIGN_SHELL_SCREENS: ScreenConfig[] = [
  // Pedagogical role: Hook
  {
    type: "word-drop",
    id: "shell-word-drop",
    narrativeBefore:
      "You spot a flash sale for a game skin you've wanted. Your wallet has $18. Before you tap buy, your brain is whispering the money should be",
    narrativeAfter: "right now!",
    options: ["Spent", "Saved", "Ignored"],
    correctOption: "Spent",
    wrongError: "Not quite — that sale is pushing you to spend. Pick the urge.",
    promptLabel: "Pick the word that fits",
    authoring: { pedagogicalStage: "hook", gameArchetype: "word-drop" },
    ...shellIllustration(0),
    ...AUTO_READY,
  },
  // Pedagogical role: Core concept
  {
    type: "binary-choice",
    id: "shell-binary-choice",
    prompt:
      "A streaming app offers a 7-day free trial, then $12/month. What is the smartest first move?",
    optionA: {
      label: "Set a reminder to cancel before day 7 if you don't want it.",
      isCorrect: true,
    },
    optionB: {
      label: "Sign up now and figure it out later.",
      isCorrect: false,
    },
    wrongError:
      "Trials are traps when you forget the deadline. Pause before you commit.",
    errorStyle: "inline-red",
    authoring: { pedagogicalStage: "core", gameArchetype: "binary-choice" },
    ...shellIllustration(1),
    ...AUTO_READY,
  },
  {
    type: "binary-choice",
    id: "shell-all-of-the-above",
    prompt: "What helps you stay in control of a free trial? Select the best answer.",
    optionA: { label: "Set a reminder before the trial ends.", isCorrect: false },
    optionB: { label: "Know what you'll be charged after day 7.", isCorrect: false },
    optionC: { label: "Cancel if you don't want to keep it.", isCorrect: false },
    optionD: { label: "All of the above.", isCorrect: true },
    wrongError: "Look again — is there a better answer?",
    successMessage: "Exactly — all of those moves work together.",
    errorStyle: "inline-red",
    advance: { mode: "on-complete" },
    authoring: {
      pedagogicalStage: "core",
      gameArchetype: "binary-choice/all-of-the-above",
    },
  },
  {
    type: "binary-choice",
    id: "shell-multi-correct",
    selectionMode: "multi-correct",
    optionLayout: "radio-list",
    prompt: "Which lines on this sign are pressure tricks?",
    optionA: { label: "DON'T MISS OUT!", isCorrect: true },
    optionB: { label: "ONLY 2 LEFT!", isCorrect: true },
    optionC: { label: "Made in France", isCorrect: false },
    wrongError: "That's just info on the sign — not a pressure trick.",
    successMessage: "Nice — you spotted the rush lines.",
    errorStyle: "inline-red",
    advance: { mode: "on-complete" },
    authoring: {
      pedagogicalStage: "core",
      gameArchetype: "binary-choice/multi-correct",
    },
  },
  {
    type: "true-false",
    id: "shell-true-false",
    prompt:
      "True or False: If you unsubscribe from a free trial on day 6, you will still be charged on day 7.",
    correctAnswer: "false",
    wrongError:
      "False! Cancel before the trial ends and you should not be charged.",
    promptLabel: "Fact Finder",
    authoring: { pedagogicalStage: "core", gameArchetype: "true-false" },
    ...shellIllustration(2),
    ...AUTO_READY,
  },
  {
    type: "tap-reveal",
    id: "shell-tap-reveal",
    intro:
      "Tap each purchase to reveal whether it is a need or a want. Subscription traps hide in the wants pile!",
    buckets: [
      { id: "need", label: "Need", tone: "need" },
      { id: "want", label: "Want", tone: "want" },
    ],
    items: [
      { id: "bus", emoji: "🚌", label: "Bus pass to school", bucket: "need" },
      { id: "skin", emoji: "🎮", label: "Limited-edition game skin", bucket: "want" },
      { id: "lunch", emoji: "🥪", label: "Packed lunch from home", bucket: "need" },
      { id: "subs", emoji: "📺", label: "Extra streaming tier", bucket: "want" },
    ],
    authoring: { pedagogicalStage: "core", gameArchetype: "tap-reveal" },
    ...AUTO_READY,
  },
  {
    type: "bucket-sort",
    id: "shell-statement-sort",
    layout: "statement-sort",
    intro:
      "Sort these thoughts. Which ones push impulse spending, and which help you pause?",
    buckets: [
      { id: "impulse", label: "Impulse", tone: "rush", icon: "⚡" },
      { id: "pause", label: "Pause & Think", tone: "think", icon: "🧠" },
    ],
    items: [
      {
        id: "everyone",
        emoji: "👥",
        label: "Everyone bought it — I can't be the only one without it.",
        bucket: "impulse",
      },
      {
        id: "timer",
        emoji: "⏰",
        label: "Only 10 minutes left on the sale!",
        bucket: "impulse",
      },
      {
        id: "sleep",
        emoji: "😴",
        label: "I'll sleep on it and decide tomorrow.",
        bucket: "pause",
      },
      {
        id: "goal",
        emoji: "🎯",
        label: "Does this fit my savings goal this month?",
        bucket: "pause",
      },
    ],
    successMessage: "Nice sort — you separated the rush from the reset.",
    authoring: { pedagogicalStage: "core", gameArchetype: "bucket-sort/statement-sort" },
    ...AUTO_READY,
  },
  {
    type: "bucket-sort",
    id: "shell-steps-row",
    layout: "steps-row",
    intro: "Put these spare-cash steps in the right order.",
    illustration: {
      emoji: "🫙",
      label: "Spare cash steps",
      alt: "Pocket money, buffer jar, and fun spending",
    },
    buckets: [
      { id: "step1", label: "Step 1" },
      { id: "step2", label: "Step 2" },
      { id: "step3", label: "Step 3" },
    ],
    items: [
      {
        id: "receive",
        emoji: "💵",
        label: "Receive pocket money.",
        bucket: "step1",
      },
      {
        id: "buffer",
        emoji: "🫙",
        label: "Move a small amount to your buffer jar.",
        bucket: "step2",
      },
      {
        id: "fun",
        emoji: "🎮",
        label: "Spend what's left on fun.",
        bucket: "step3",
      },
    ],
    successMessage: "Perfect sequence — buffer first, fun second.",
    authoring: { pedagogicalStage: "core", gameArchetype: "bucket-sort/steps-row" },
    ...AUTO_READY,
  },
  {
    type: "bucket-sort",
    id: "shell-spent-total",
    layout: "spent-total",
    intro:
      "Your wallet is empty but you need $35 for new headphones. Drag what you bought into Spent.",
    buckets: [{ id: "spent", label: "Spent" }],
    items: [
      { id: "snacks", emoji: "🍫", label: "After-school snacks", bucket: "spent", price: 12 },
      { id: "app", emoji: "📱", label: "In-app coins", bucket: "spent", price: 15 },
      { id: "stickers", emoji: "✨", label: "Sticker pack", bucket: "spent", price: 8 },
    ],
    targetTotal: 35,
    poolColumnLabel: "Recent purchases",
    successMessage: "That's where the money went — nothing left for the headphones.",
    authoring: { pedagogicalStage: "core", gameArchetype: "bucket-sort/spent-total" },
    ...AUTO_READY,
  },
  {
    type: "link-match",
    id: "shell-link-match",
    intro:
      "Match each money moment to what spare cash makes possible.",
    eventColumnLabel: "Events",
    benefitColumnLabel: "Possibilities",
    pairs: [
      {
        id: "broken",
        event: "I accidentally broke a friend's item",
        benefit: "Offer to replace it myself",
      },
      {
        id: "birthday",
        event: "A friend's birthday is coming up",
        benefit: "Buy a gift without stress",
      },
      {
        id: "sale",
        event: "My favourite store has a real sale",
        benefit: "Grab the deal without borrowing",
      },
    ],
    successMessage: "Every match locked in — spare cash unlocks real options.",
    authoring: { pedagogicalStage: "core", gameArchetype: "link-match" },
    ...AUTO_READY,
  },
  {
    type: "rank-order",
    id: "shell-rank-order",
    intro:
      "You want a $10 item but only have $5. Rank these choices from best to avoid.",
    dragHint: "Drag into order — strongest money move at the top.",
    axisLabel: "Best → Avoid",
    submitLabel: "Submit Answer",
    items: [
      { id: "wait", label: "Wait and save the extra $5." },
      { id: "cheaper", label: "Pick a cheaper $5 alternative." },
      { id: "borrow", label: "Borrow $5 to buy it today." },
    ],
    correctOrder: ["wait", "cheaper", "borrow"],
    errors: {
      borrow:
        "Borrowing for a want creates debt — that belongs at the bottom.",
      cheaper:
        "A cheaper option can work, but saving first is the stronger move here.",
    },
    successMessage: "Solid ranking — save first, borrow last.",
    authoring: { pedagogicalStage: "apply", gameArchetype: "rank-order" },
    ...AUTO_READY,
  },
  {
    type: "spotlight-rounds",
    id: "shell-spotlight-rounds",
    prompt: "Which option is the true need in each pair?",
    rounds: [
      {
        iconA: "🚌",
        optionA: "Bus fare home when you're out of cash",
        iconB: "🧋",
        optionB: "Limited-edition bubble tea collab",
        correct: "a",
        error: "The bus gets you home — the drink is a want.",
      },
      {
        iconA: "🔌",
        optionA: "Replacement charger when yours is broken",
        iconB: "🎨",
        optionB: "New profile theme for a game",
        correct: "a",
        error: "A dead phone is a need — the theme is just flair.",
      },
      {
        iconA: "🥪",
        optionA: "Lunch you packed from home",
        iconB: "🍕",
        optionB: "Delivery pizza because friends ordered",
        correct: "a",
        error: "Packed lunch covers the need — delivery is optional fun.",
      },
    ],
    authoring: { pedagogicalStage: "core", gameArchetype: "spotlight-rounds" },
    ...AUTO_READY,
  },
  {
    type: "hold-to-fill",
    id: "shell-hold-to-fill",
    narrative:
      "A checkout page is flashing LIMITED TIME. Hold to silence the noise and give yourself space to think.",
    holdLabel: "🔕 HOLD TO PAUSE 🔕",
    frozenLabel: "🔕 PAUSED 🔕",
    successMessage: "Nice — you bought time to think before spending.",
    holdDurationMs: 2000,
    authoring: { pedagogicalStage: "apply", gameArchetype: "hold-to-fill" },
    ...shellIllustration(10),
    ...AUTO_READY,
  },
  {
    type: "drag-to-target",
    id: "shell-drag-to-target",
    intro:
      "Swipe your coins from Spend Now to Save for Later before the impulse wins.",
    sourceLabel: "Spend Now",
    targetLabel: "Save for Later",
    itemEmoji: "🪙",
    coinCount: 4,
    successMessage: "Coins secured — impulse spending blocked.",
    authoring: { pedagogicalStage: "apply", gameArchetype: "drag-to-target" },
    ...shellIllustration(11),
    ...AUTO_READY,
  },
  {
    type: "savings-goal",
    id: "shell-savings-goal",
    intro:
      "You're saving $20 for a bike workshop. Drag the things you skipped into the didn't-buy box.",
    meterLabel: "Workshop Fund",
    targetAmount: 20,
    poolColumnLabel: "Temptations this week",
    dropZoneLabel: "Things I didn't buy",
    items: [
      { id: "snacks", label: "Extra snacks", price: 5, emoji: "🍫" },
      { id: "lives", label: "Game lives bundle", price: 5, emoji: "🎮" },
      { id: "light", label: "Bike light upgrade", price: 10, emoji: "🔦" },
    ],
    workshopSignTitle: "Bike Workshop — $20",
    lockedLabel: "Locked",
    unlockedLabel: "Sign Up!",
    goalAchievedLabel: "Goal reached!",
    successMessage: "Workshop unlocked — patience paid off.",
    authoring: { pedagogicalStage: "apply", gameArchetype: "savings-goal" },
    ...AUTO_READY,
  },
  {
    type: "allocation-slider",
    id: "shell-allocation-slider",
    intro:
      "You have $30. $22 must stay untouched for a promised gift next week. Slide to lock that amount away.",
    total: 30,
    targetMin: 22,
    reserveGoals: [
      { id: "gift", label: "Promised gift", amount: 22, emoji: "🎁" },
    ],
    spendItems: [
      { id: "treat", label: "Treat today", amount: 8, emoji: "🧋" },
    ],
    sliderError: "Lock at least $22 for the gift before spending today.",
    successMessage: "Gift money protected — today's treat stays optional.",
    authoring: { pedagogicalStage: "apply", gameArchetype: "allocation-slider" },
    ...AUTO_READY,
  },
  {
    type: "budget-select",
    id: "shell-budget-select",
    intro: "You have $25 left. Check only what you actually need.",
    walletLabel: "Digital Wallet",
    total: 25,
    items: [
      { id: "transit", label: "Transit pass", price: 12, emoji: "🚌" },
      { id: "snack", label: "Premium snack run", price: 8, emoji: "🍿" },
      { id: "cable", label: "Phone cable", price: 13, emoji: "🔌" },
    ],
    correctIds: ["transit", "cable"],
    errors: {
      overBudget: "That combo busts the budget — uncheck a want.",
      wrongSelection: "Uncheck the item that isn't a need.",
      itemHints: {
        transit: "You still need a ride home — keep the transit pass.",
        cable: "A dead phone is a problem — keep the cable.",
      },
    },
    successMessage: "Needs covered — wants can wait.",
    advance: { mode: "on-complete" },
    authoring: { pedagogicalStage: "apply", gameArchetype: "budget-select" },
  },
  // Pedagogical role: Reward
  {
    type: "narrative-bonus",
    id: "shell-narrative-bonus",
    narrative:
      "You spotted the subscription trap, protected your goal, and kept spare cash ready. Tap to collect a bonus XP chip.",
    bonusXp: 50,
    bonusTapLabel: "[ COLLECT 50 XP BONUS ]",
    autoReadyWhenNoBonus: false,
    authoring: { pedagogicalStage: "reward", gameArchetype: "narrative-bonus" },
    ...shellIllustration(15),
    ...AUTO_READY,
  },
  // Pedagogical role: Close
  {
    ...explorerCompletionScreen("shell-completion"),
    authoring: { pedagogicalStage: "close", gameArchetype: "completion" },
    returnButtonLabel: "Back to Academy",
    ...AUTO_READY,
  },
];

export const DESIGN_SHELL_LESSON_DEFINITION: CohortLessonDefinition = {
  meta: DESIGN_SHELL_META,
  rewards: DESIGN_SHELL_REWARDS,
  baseScreens: DESIGN_SHELL_SCREENS,
  byCohort: {
    explorer: {},
    pathfinder: {},
  },
};
