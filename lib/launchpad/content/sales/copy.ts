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
  { id: "photo", label: "I send a photo after every job" },
  { id: "happy", label: "I have lots of happy customers" },
  { id: "careful", label: "I'm careful and reliable" },
] as const;

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
      { id: "care", label: "I take good care of every dog" },
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
