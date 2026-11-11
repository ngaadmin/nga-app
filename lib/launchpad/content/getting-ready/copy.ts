import { joinPhrase } from "@/lib/launchpad/content/planning/catalog";

/**
 * Getting Ready copy and sentences (framework rows 28-33, md5 bbaf7a74).
 * Row 34 was empty. The wrap lines below are the proposed workbook pages.
 * Option cells win over J28's "(with Mom or Dad)". "by in person" stays.
 */

export const FIND_CUSTOMERS_KEY = "find_customers";
export const AGREE_JOB_KEY = "agree_the_job";
export const DELIVER_JOB_KEY = "deliver_the_job";
export const WRAP_JOB_KEY = "wrap_up";
export const PRACTICE_RUN_KEY = "practice_run";
export const POLISH_SERVICE_KEY = "polish_service";

export const CHANNELS = [
  { id: "flyers", label: "Flyers or posters" },
  { id: "friends", label: "Talking to friends and family" },
  { id: "noticeboard", label: "Posting on a school or community board" },
  { id: "online", label: "An online post (check if allowed)" },
  { id: "cards", label: "Business cards" },
  { id: "community", label: "A community group (check if allowed)" },
] as const;

export const AGREE_PROMPT = "What will you agree with the owner before each job?";
export const AGREE_NOTE = "When a booking comes in, write these on the Taking a customer order template in your workbook.";

export type AgreeSectionId = "collect_info" | "confirm_dog" | "when_where" | "cost_payment" | "plans_change";

export type AgreeSection = {
  id: AgreeSectionId;
  title: string;
  lead: string;
  bullets: readonly string[];
  moreLead?: string;
  moreBullets?: readonly string[];
};

/** Five sequential sections. Examples are display text, not inputs. */
export const AGREE_ITEMS: readonly AgreeSection[] = [
  {
    id: "collect_info",
    title: "What information you'll collect from the owner",
    lead: "What you need to look after the dog and reach someone:",
    bullets: ["name,", "address,", "emergency contact,", "pickup and drop-off times,", "the dog's allergies or fears,", "and what a usual job looks like."],
  },
  {
    id: "confirm_dog",
    title: "What you'll confirm about the dog",
    lead: "Ask the owner if the dog:",
    bullets: ["is okay with other dogs", "is okay with other people", "knows commands, if so, which ones"],
    moreLead: "Suggested additional questions:",
    moreBullets: ["Is there anything the dog isn't allowed to do?", "Is there anything else we need to know?"],
  },
  {
    id: "when_where",
    title: "When and where",
    lead: "The practical details:",
    bullets: ["which days,", "what time of day,", "whether you'll pick up at the owner's home or meet somewhere,", "and where the job will happen."],
  },
  {
    id: "cost_payment",
    title: "Cost and payment",
    lead: "What the job costs and how you will be paid:",
    bullets: ["cash on the day,", "a bank transfer,", "or an app."],
  },
  {
    id: "plans_change",
    title: "What happens if plans change",
    lead: "What you will do if something comes up:",
    bullets: ["if the owner is running late,", "you cannot make it,", "the weather is too bad,", "the dog seems unwell,", "or you need to cut the walk short."],
  },
];

export const AGREE_UNDERSTOOD_EMPTY = {
  collect_info: false,
  confirm_dog: false,
  when_where: false,
  cost_payment: false,
  plans_change: false,
} as const;

export const BEFORE_HOW = [
  { id: "text", label: "Text", sentence: "text" },
  { id: "email", label: "Email", sentence: "email" },
  { id: "phone", label: "Phone call", sentence: "phone call" },
  { id: "in_person", label: "In person", sentence: "in person" },
] as const;

export const AFTER_HOW = [
  { id: "photo", label: "A photo", sentence: "a photo" },
  { id: "video", label: "A short video", sentence: "a short video" },
  { id: "summary", label: "A written summary", sentence: "a written summary" },
] as const;

export const PAYMENT_HOW = [
  { id: "cash", label: "Cash on the day", sentence: "cash on the day" },
  { id: "transfer", label: "Bank transfer", sentence: "bank transfer" },
  { id: "app", label: "An app", sentence: "an app" },
] as const;

export const FEEDBACK_HOW = [
  { id: "in_person", label: "In person", sentence: "in person" },
  { id: "text", label: "Text", sentence: "text" },
  { id: "email", label: "Email", sentence: "email" },
  { id: "note", label: "A short note", sentence: "a short note" },
] as const;

export const PRACTICE_WHO = [
  { id: "family", label: "a family member" },
  { id: "neighbor", label: "a neighbor" },
  { id: "friend", label: "a friend" },
] as const;

export const PRACTICE_WHEN = [
  { id: "tomorrow", label: "tomorrow" },
  { id: "weekend", label: "this weekend" },
  { id: "next_week", label: "next week" },
] as const;

export const POLISH_HAPPY_LEAD = "The customer was happy with:";

export const POLISH_QUESTIONS = [
  { id: "service_explained", prompt: "Was the service explained clearly?", topic: "how I explained the service" },
  { id: "cost", prompt: "Was the cost reasonable?", topic: "the cost" },
  { id: "timing", prompt: "Did the available times work for you?", topic: "the times" },
  { id: "communication", prompt: "Was communication clear and helpful?", topic: "how we communicated" },
  { id: "delivery", prompt: "Was the service delivered well?", topic: "how the service was delivered" },
  { id: "payment", prompt: "Was there a good range of payment options?", topic: "the payment options" },
  { id: "proof", prompt: "Did the proof of completion show the work well?", topic: "the proof of completion" },
] as const;

export const POLISH_RESULTS = [
  { id: "good", label: "was good, nothing to change" },
  { id: "suggestions", label: "customer had suggestions" },
] as const;

export const ALSO_MAX = 60;

export const FIND_HINT = "Pick the ones you will actually use. You can pick more than one.";
export const FIND_CONFIRM =
  "You'll use these channels to find customers. Later, when you work on marketing, you'll make something for each one.";
export const AGREE_TEMPLATE =
  "When a real booking comes in, use the taking a customer order template to write down the answers. The headings on that template match this checklist.";
export const DELIVER_HINT =
  "For each statement, pick the option that fits how you will do it. The what and when stay the same. Your two choices become your plan.";
export const DELIVER_PLAYBACK = "This is my plan for delivering the service.";
export const WRAP_JOB_HINT = "Thinking about wrap-up now means you're ready when the job ends. Select all the ways you'll wrap up a job.";
export const WRAP_JOB_PLAYBACK = "This is my plan for wrapping up the job.";
export const PRACTICE_TIP = "Pick who you will practice with and what you want to get better at. This is not a paid job. Keep it simple, and ask a parent before you start.";
export const POLISH_LEAD = "Straight after you've delivered your trial run, ask your customer these questions.";
export const SUGGESTION_PROMPT = "what was the customer's suggestion or feedback?";

export function channelById(id: string) {
  return CHANNELS.find((row) => row.id === id);
}

/** Sentence phrase. The stored id stays the same. The label loses its capital. */
export function channelPhrase(id: string): string {
  const label = channelById(id)?.label ?? id;
  return label.charAt(0).toLowerCase() + label.slice(1);
}

export function joinPhrases(phrases: readonly string[]): string {
  if (phrases.length === 0) return "";
  if (phrases.length === 1) return phrases[0]!;
  if (phrases.length === 2) return `${phrases[0]} and ${phrases[1]}`;
  return `${phrases.slice(0, -1).join(", ")}, and ${phrases[phrases.length - 1]}`;
}

export function findSentence(channelIds: readonly string[], extra?: string): string {
  const phrases = channelIds.map(channelPhrase);
  const sentence = phrases.length ? `I'll find customers through ${joinPhrases(phrases)}.` : "";
  const also = extra?.trim();
  return also ? `${sentence} Also: ${also}` : sentence;
}

export function agreeTitles(ticked: readonly string[]): string[] {
  return AGREE_ITEMS.filter((item) => ticked.includes(item.id)).map((item) => item.title);
}

export function deliverLines(beforeHow: string, afterHow: string): { title: string; lines: string[] } {
  const before = BEFORE_HOW.find((row) => row.id === beforeHow)?.sentence ?? beforeHow;
  const after = AFTER_HOW.find((row) => row.id === afterHow)?.sentence ?? afterHow;
  return {
    title: DELIVER_PLAYBACK,
    lines: [
      `I will contact the owner to confirm the agreed details of the job by ${before}.`,
      `I will show proof by sending ${after}.`,
    ],
  };
}

function asIds(value: string | readonly string[]): readonly string[] {
  return typeof value === "string" ? [value] : value;
}

function joinOr(phrases: readonly string[]): string {
  if (phrases.length <= 1) return phrases[0] ?? "";
  if (phrases.length === 2) return `${phrases[0]} or ${phrases[1]}`;
  return `${phrases.slice(0, -1).join(", ")}, or ${phrases[phrases.length - 1]}`;
}

/** Sentence phrases for the ticked options, joined so two reads "a or b" and three reads "a, b, or c". */
export function joinHow(ids: readonly string[], rows: readonly { id: string; sentence: string }[]): string {
  return joinOr(ids.map((id) => rows.find((row) => row.id === id)?.sentence ?? id));
}

export function wrapJobLines(paymentHow: string | readonly string[], feedbackHow: string | readonly string[]): { title: string; lines: string[] } {
  const payment = joinHow(asIds(paymentHow), PAYMENT_HOW);
  const feedback = joinHow(asIds(feedbackHow), FEEDBACK_HOW);
  const lines: string[] = [];
  if (payment && feedback) lines.push(`I will collect payment by ${payment}, and ask for feedback by ${feedback}.`);
  else if (payment) lines.push(`I will collect payment by ${payment}.`);
  else if (feedback) lines.push(`I will ask for feedback by ${feedback}.`);
  return { title: WRAP_JOB_PLAYBACK, lines };
}

export function practiceLines(who: string, serviceLabel: string, when: string): string[] {
  const whoLabel = PRACTICE_WHO.find((row) => row.id === who)?.label ?? who;
  const whenLabel = PRACTICE_WHEN.find((row) => row.id === when)?.label ?? when;
  const service = serviceLabel.trim().charAt(0).toLowerCase() + serviceLabel.trim().slice(1);
  return [
    `I will do a practice run for ${whoLabel}.`,
    `I will do the following service for them ${service}.`,
    `I will do it ${whenLabel}.`,
  ];
}

export type PolishRow = { id: string; result: "good" | "suggestions"; suggestion?: string };

export function feedbackWrap(
  rows: readonly PolishRow[],
  comma: string,
  andWord: string,
): { notes: { question: string; note: string }[]; happyLead: string | null; happy: string | null } {
  const notes = rows
    .filter((row) => row.result === "suggestions" && row.suggestion?.trim())
    .map((row) => ({
      question: POLISH_QUESTIONS.find((q) => q.id === row.id)?.prompt ?? row.id,
      note: row.suggestion!.trim(),
    }));
  const topics = POLISH_QUESTIONS.filter((question) => rows.some((row) => row.id === question.id && row.result === "good")).map((question) => question.topic);
  if (topics.length === 0) return { notes, happyLead: null, happy: null };
  return { notes, happyLead: POLISH_HAPPY_LEAD, happy: joinPhrase(topics, comma, andWord) };
}

export function findReady(channelIds: readonly string[], extra: string): boolean {
  return channelIds.length >= 1 && channelIds.length <= CHANNELS.length && extra.trim().length <= ALSO_MAX;
}
