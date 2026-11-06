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
  { id: "friends", label: "Friends and family" },
  { id: "noticeboard", label: "School or community noticeboard" },
  { id: "online", label: "An online post (check if allowed)" },
  { id: "cards", label: "Business cards" },
  { id: "community", label: "A community group (check if allowed)" },
] as const;

export const AGREE_ITEMS = [
  {
    id: "collect_info",
    title: "What information you'll collect from the owner",
    guidance:
      "Before a job, decide what you need to know so you can look after the dog well and reach someone if you need to, such as name, address, emergency contact, pickup and drop-off times, the dog's allergies or fears, and what a normal day looks like.",
  },
  {
    id: "confirm_dog",
    title: "What you'll confirm about the dog",
    guidance:
      "Agree the things that help you handle the walk the way the owner wants, such as how they walk on a leash, whether they are okay with other dogs, whether they are okay with other people, commands they know, and anything they are not allowed to do.",
  },
  {
    id: "when_where",
    title: "When and where",
    guidance:
      "Agree the practical details so you both know where to be and for how long, such as which days, what time of day, whether you'll pick up at their home or meet somewhere, where you will walk, and how long the walk will be.",
  },
  {
    id: "cost_payment",
    title: "Cost and payment",
    guidance:
      "Agree what the job costs (using the price you already set) and how you will be paid, such as cash on the day, a bank transfer, or an app.",
  },
  {
    id: "plans_change",
    title: "What happens if plans change",
    guidance:
      "Agree what you will do if something comes up, so neither of you is stuck guessing, such as if the owner is running late, you cannot make it, the weather is too bad, the dog seems unwell, or you need to cut the walk short.",
  },
] as const;

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
  { id: "cash", label: "Cash", sentence: "cash" },
  { id: "transfer", label: "Bank transfer", sentence: "bank transfer" },
  { id: "app", label: "A payment app with Mom or Dad", sentence: "a payment app with Mom or Dad" },
] as const;

/** Sheet wording is "by in person". The menu shows that phrase. */
export const FEEDBACK_HOW = [
  { id: "in_person", label: "in person", sentence: "in person" },
  { id: "text", label: "text", sentence: "text" },
  { id: "email", label: "email", sentence: "email" },
  { id: "note", label: "a short note", sentence: "a short note" },
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

export const POLISH_QUESTIONS = [
  { id: "service_explained", prompt: "Was the service explained clearly?" },
  { id: "cost", prompt: "Was the cost reasonable?" },
  { id: "timing", prompt: "Did the available times work for you?" },
  { id: "communication", prompt: "Was communication clear and helpful?" },
  { id: "delivery", prompt: "Was the service delivered well?" },
  { id: "payment", prompt: "Was there a good range of payment options?" },
  { id: "proof", prompt: "Did the proof of completion show the work well?" },
] as const;

export const POLISH_RESULTS = [
  { id: "good", label: "Was good, nothing to change" },
  { id: "suggestions", label: "Customer had suggestions" },
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
export const WRAP_JOB_HINT =
  "For each statement, pick the option that fits how you will do it. The what stays the same. Your two choices become your plan.";
export const WRAP_JOB_PLAYBACK = "This is my plan for wrapping up the job.";
export const PRACTICE_TIP = "This is not a paid job. Keep it simple, and ask a parent before you start.";
export const POLISH_LEAD = "Straight after you've delivered your trial run, ask your customer these questions.";
export const SUGGESTION_PROMPT = "what was the customer's suggestion or feedback?";

export function channelById(id: string) {
  return CHANNELS.find((row) => row.id === id);
}

/** Wrap phrase. Noticeboard picks up the sketch's "a". Other labels lose the capital. */
export function channelPhrase(id: string): string {
  if (id === "noticeboard") return "a school or community noticeboard";
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

export function wrapJobLines(paymentHow: string, feedbackHow: string): { title: string; lines: string[] } {
  const payment = PAYMENT_HOW.find((row) => row.id === paymentHow)?.sentence ?? paymentHow;
  const feedback = FEEDBACK_HOW.find((row) => row.id === feedbackHow)?.sentence ?? feedbackHow;
  return {
    title: WRAP_JOB_PLAYBACK,
    lines: [`I will collect payment by ${payment}.`, `I will ask the owner for feedback or a short review by ${feedback}.`],
  };
}

export function practiceLines(who: string, serviceLabel: string, when: string): string[] {
  const whoLabel = PRACTICE_WHO.find((row) => row.id === who)?.label ?? who;
  const whenLabel = PRACTICE_WHEN.find((row) => row.id === when)?.label ?? when;
  const service = serviceLabel.trim().charAt(0).toLowerCase() + serviceLabel.trim().slice(1);
  return [
    `I will do a practice run for ${whoLabel}.`,
    `I will do ${service} for them.`,
    `I will do it ${whenLabel}.`,
  ];
}

export type PolishRow = { id: string; result: "good" | "suggestions"; suggestion?: string };

export function feedbackWrap(rows: readonly PolishRow[]): { notes: { question: string; note: string }[]; other: string } {
  const notes = rows
    .filter((row) => row.result === "suggestions" && row.suggestion?.trim())
    .map((row) => ({
      question: POLISH_QUESTIONS.find((q) => q.id === row.id)?.prompt ?? row.id,
      note: row.suggestion!.trim(),
    }));
  const otherCount = rows.filter((row) => row.result === "good").length;
  return {
    notes,
    other: `The other ${otherCount} questions: was good, nothing to change.`,
  };
}

export function findReady(channelIds: readonly string[], extra: string): boolean {
  return channelIds.length >= 1 && channelIds.length <= CHANNELS.length && extra.trim().length <= ALSO_MAX;
}
