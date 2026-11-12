/**
 * Level 4 Sales copy (framework rows 35-37). Learner strings are the sheet
 * and SPEC.md wording. Bronzes capture choices. The workbook plays them back.
 */

export const SALES_CHANNELS_KEY = "sales_channels";
export const MARKETING_MATERIALS_KEY = "marketing_materials";
export const TELL_PEOPLE_KEY = "tell_people";

export const SALES_QUESTION = "Where will you use each of your channels?";
export const SALES_CONTEXT =
  "You've already chosen how people will hear about you. Now decide where each channel will actually go, so your plan has a real place to show up before you make anything.";
export const SALES_GUIDANCE = "For each one, choose where you will put it, leave it, or use it. You will make the materials next.";
export const SALES_WHERE_PROMPT = "For each channel, choose where";
export const SALES_PERMISSION = "Check you have permission before posting in any public space.";

export const MATERIALS_QUESTION = "What will your marketing materials say?";
export const MATERIALS_CONTEXT =
  "You've picked where each channel will go. Now choose the words, so every piece is ready when you tell people about your business.";
export const MATERIALS_GUIDANCE =
  "Pick a hook and a proof that work on every piece. The rest of the words come from what you already chose, with a short choice left on some pieces.";

export const TELL_QUESTION = "How will you tell people about it?";
export const TELL_GUIDANCE = "For each channel you will use, type a number that feels doable. These become your targets.";

export const CHANNELS = [
  { id: "flyers", label: "Flyers or posters", short: "flyer" },
  { id: "friends", label: "Friends and family", short: "friends" },
  { id: "online", label: "An online post or online community group", short: "online post" },
  { id: "cards", label: "Business cards", short: "business card" },
  { id: "noticeboard", label: "Noticeboard in a public place (supermarket, sports club, community center)", short: "noticeboard" },
] as const;

export type SalesChannelId = (typeof CHANNELS)[number]["id"];

export const WHERE_GROUPS = [
  {
    channelId: "flyers",
    heading: "Flyers or posters",
    label: "Where does it go up?",
    allowOwn: true,
    options: [
      { id: "school", label: "At school (with permission)", sentence: "at school (with permission)" },
      { id: "library", label: "A library", sentence: "a library" },
      { id: "shop", label: "A local shop window", sentence: "a local shop window" },
    ],
  },
  {
    channelId: "friends",
    heading: "Friends and family",
    label: "How would you tell them?",
    options: [
      { id: "see", label: "Next time I see them", sentence: "next time I see them" },
      { id: "message", label: "In a message", sentence: "in a message" },
    ],
  },
  {
    channelId: "online",
    heading: "An online post or online community group",
    label: "Where would you share it?",
    options: [
      { id: "page", label: "On an online community page", sentence: "on an online community page" },
      { id: "share", label: "Ask friends to like and share", sentence: "ask friends to like and share" },
    ],
  },
  {
    channelId: "cards",
    heading: "Business cards",
    label: "Where would you leave them?",
    allowOwn: true,
    options: [
      { id: "cafe", label: "At a local shop or cafe", sentence: "at a local shop or cafe" },
      { id: "work", label: "At work or school", sentence: "at work or school" },
    ],
  },
  {
    channelId: "noticeboard",
    heading: "Noticeboard in a public place (supermarket, sports club, community center)",
    label: "Where does it go up?",
    allowOwn: true,
    options: [
      { id: "school", label: "At school (with permission)", sentence: "at school (with permission)" },
      { id: "library", label: "A library", sentence: "a library" },
      { id: "shop", label: "A local shop window", sentence: "a local shop window" },
    ],
  },
] as const;

export const WHERE_PAGES: readonly (readonly SalesChannelId[])[] = [
  ["flyers", "friends"],
  ["online", "cards", "noticeboard"],
];

export const HOOKS = [
  { id: "too-busy", label: "Too busy to walk your dog?" },
  { id: "more-walks", label: "Need more walks for your dog?" },
  { id: "while-out", label: "Want your dog exercised while you're out?" },
] as const;

export const PROOFS = [
  { id: "photo-walk", label: "I send a photo after every walk" },
  { id: "same-person", label: "Same person every visit, so you always know who's coming" },
  { id: "routine", label: "Careful with the dog's routine and any special instructions" },
  { id: "reliable", label: "Reliable on the day and time we agree" },
  { id: "meet-greet", label: "Happy to do a first meet-and-greet so you can show me the dog" },
  { id: "clear-price", label: "Clear price before I start, so no surprises" },
  { id: "local", label: "Local and available for regular or one-off walks" },
] as const;

/** Near-identical proof and flyer-extra pairs. The screen disables one when the other is chosen. */
export const PROOF_FLYER_PAIRS = [
  { proofId: "same-person", flyerExtraId: "same-visit" },
  { proofId: "clear-price", flyerExtraId: "clear-price" },
] as const;

export function pairedIds(
  pairs: readonly { proofId: string; flyerExtraId: string }[],
  chosenSide: "proof" | "flyer-extra",
  chosenId: string,
): string[] {
  if (!chosenId) return [];
  return pairs.flatMap((pair) => {
    if (chosenSide === "proof" && pair.proofId === chosenId) return [pair.flyerExtraId];
    if (chosenSide === "flyer-extra" && pair.flyerExtraId === chosenId) return [pair.proofId];
    return [];
  });
}

export const PIECE_FIELDS = [
  {
    id: "flyer-book",
    channelId: "flyers",
    label: "Flyer: how to book",
    options: [
      { id: "person", label: "Ask me in person" },
      { id: "message", label: "Send me a message" },
      { id: "someone", label: "Have someone get in touch" },
    ],
  },
  {
    id: "flyer-extra",
    channelId: "flyers",
    label: "Flyer: extra line (optional)",
    optional: true,
    options: [
      { id: "friendly", label: "Friendly and reliable" },
      { id: "after-school", label: "After school and weekends" },
      { id: "same-visit", label: "Same person, every visit" },
      { id: "clear-price", label: "Clear price before I start" },
      { id: "careful", label: "Careful with the details" },
    ],
  },
  {
    id: "verbal-close",
    channelId: "verbal",
    label: "In person: how you'll finish",
    options: [
      { id: "more", label: "Would you like me to tell you more?" },
      { id: "book", label: "Would you like to book?" },
      { id: "week", label: "I can start this week if that helps." },
    ],
  },
  {
    id: "message-close",
    channelId: "message",
    label: "Message: how you'll finish",
    options: [
      { id: "book", label: "Let me know if you'd like to book" },
      { id: "questions", label: "Happy to answer any questions" },
      { id: "week", label: "I can start this week if that helps" },
    ],
  },
  {
    id: "online-close",
    channelId: "online",
    label: "Online post: how you'll finish",
    options: [
      { id: "line", label: "Drop me a line" },
      { id: "pm", label: "PM me" },
      { id: "reply", label: "Reply for more information" },
    ],
  },
] as const;

export const OWN_LABEL = "Add your own";

/** Row 36. Set up your order system. Placeholder empty label is the Grow slot word. */
export const ORDER_SYSTEM_KEY = "order_system";

export const ORDER_SYSTEM = {
  title: "Set up your order system",
  silverTitle: "Take the order",
  question: "How will you keep track of your orders?",
  context: "Once people know about your business, they will start getting in touch. A simple system means no job or customer gets missed.",
  guidance: "Pick where you will keep your orders. A calendar is the best choice because it can repeat regular jobs and remind you before each one.",
  trackerLead: "I will keep my orders in",
  emptyLabel: "choose",
  trackerOptions: [
    { id: "calendar", label: "My calendar (best choice)", workbook: "My calendar" },
    { id: "notebook", label: "A paper notebook", workbook: "A paper notebook" },
    { id: "phone", label: "A notes page on my phone", workbook: "A notes page on my phone" },
  ],
  playbackTitle: "My order system",
  templateBefore: "When someone books, I will write down the details using the ",
  templateStrong: "Taking a customer order",
  templateAfter: " template.",
  repeatLine: "For a regular job, I will add it as a repeat so it never slips.",
  reminderLead: "I will set a reminder",
  reminderDefault: "night-before",
  reminderOptions: [
    { id: "night-before", label: "the night before" },
    { id: "morning-of", label: "the morning of" },
    { id: "hour-before", label: "an hour before" },
  ],
  checkLine: "I will check my orders every morning.",
  workbookTitle: "My order system",
  trackerBefore: "I will keep my orders in ",
  trackerAfter: ".",
  reminderBefore: "I will set a reminder ",
  reminderAfter: ".",
  checkBefore: "I will check my orders ",
  checkPick: "every morning",
  checkAfter: ".",
} as const;
