/**
 * Level 7 Level Up. Copy is Storybird's 10 Nov 2026 pass, verbatim.
 * Start-date choices are the level-up set, plus "in three months" for the
 * Improve timeline default.
 */

export type LevelSectionId = "customers" | "ready" | "job" | "happy";
export type LevelTag = "do-now" | "three-months";
export type GrowIdeaId = "referral" | "prepaid" | "bundle" | "new-service" | "expand";
export type LevelCohort = "explorer" | "pathfinder" | "maverick";

export type LevelStatement = {
  id: string;
  reflectLabel: string;
  improveLabel: string;
  tag: LevelTag;
  section: LevelSectionId;
};

export const LEVEL_SECTIONS: readonly { id: LevelSectionId; label: string }[] = [
  { id: "customers", label: "Getting customers" },
  { id: "ready", label: "Getting ready" },
  { id: "job", label: "Doing the job" },
  { id: "happy", label: "Keeping customers happy" },
];

export const LEVEL_STATEMENTS: readonly LevelStatement[] = [
  { id: "neighbors", section: "customers", tag: "do-now", reflectLabel: "Told my neighbors about my business", improveLabel: "Tell my neighbors about my business" },
  { id: "texted", section: "customers", tag: "do-now", reflectLabel: "Texted my regular customers", improveLabel: "Text my regular customers" },
  { id: "flyers", section: "customers", tag: "do-now", reflectLabel: "Put up flyers nearby", improveLabel: "Put up flyers nearby" },
  { id: "mailboxes", section: "customers", tag: "three-months", reflectLabel: "Dropped flyers in mailboxes", improveLabel: "Drop flyers in mailboxes" },
  { id: "new-place", section: "customers", tag: "three-months", reflectLabel: "Found customers in a new place", improveLabel: "Find customers in a new place" },
  { id: "gear", section: "ready", tag: "do-now", reflectLabel: "Had my gear ready for every job", improveLabel: "Get any gear I'm missing" },
  { id: "packed", section: "ready", tag: "do-now", reflectLabel: "Packed my bag the night before", improveLabel: "Pack my bag the night before" },
  { id: "confirmed", section: "ready", tag: "do-now", reflectLabel: "Confirmed each job the day before", improveLabel: "Confirm each job the day before" },
  { id: "between", section: "ready", tag: "three-months", reflectLabel: "Left enough time between jobs", improveLabel: "Leave enough time between jobs" },
  { id: "notes", section: "job", tag: "do-now", reflectLabel: "Checked each dog's notes first", improveLabel: "Check each dog's notes first" },
  { id: "home", section: "job", tag: "do-now", reflectLabel: "Got every dog home on time", improveLabel: "Get every dog home on time" },
  { id: "playtime", section: "job", tag: "three-months", reflectLabel: "Gave dogs extra playtime", improveLabel: "Give dogs extra playtime" },
  { id: "skill", section: "job", tag: "three-months", reflectLabel: "Learned a new dog-care skill", improveLabel: "Learn a new dog-care skill" },
  { id: "feedback", section: "happy", tag: "do-now", reflectLabel: "Asked owners for feedback", improveLabel: "Ask owners for feedback" },
  { id: "thanks", section: "happy", tag: "do-now", reflectLabel: "Sent owners a thank-you", improveLabel: "Send owners a thank-you" },
  { id: "rebook", section: "happy", tag: "three-months", reflectLabel: "Got a repeat booking", improveLabel: "Ask owners to book again" },
];

export const REFLECT_CONTEXT = "Looking back at what went well shows you what to keep doing, and it's a great reason to feel proud.";
export const REFLECT_GUIDANCE = "Pick every statement that's true for you in each section. There are no wrong answers.";
export const REFLECT_QUESTION = "What went well in your business?";

export const IMPROVE_CONTEXT = "Every business can get a little better. Choosing one small fix in each area keeps it simple, and each fix makes your next job go even better.";
export const IMPROVE_GUIDANCE = "Pick one thing to improve in each area. The gray ones are already your wins. You'll choose when to start next.";
export const IMPROVE_QUESTION = "What will you improve next?";
export const NAILED_TITLE = "You nailed this one!";
export const IMPROVE_WHEN_CONTEXT = "You can't fix everything at once. Choose one quick fix for now and one bigger one for later.";
export const IMPROVE_WHEN_QUESTION = "Pick one to start now and one to start in three months.";
export const IMPROVE_ALL_NOW_QUESTION = "Your picks are all quick fixes, so you can start them all now.";
export const IMPROVE_ALL_LATER_QUESTION = "These all take a bit longer. Pick one to start in three months.";
export const IMPROVE_PLAN_CONTEXT = "A plan with dates is a plan you'll actually do. Here's when you'll start each improvement.";
export const IMPROVE_PLAN_GUIDANCE = "Check your plan. Tap a start date if you want to change it.";
export const DO_NOW_LABEL = "Do now";
export const THREE_MONTHS_LABEL = "Three months";

export const GROW_CONTEXT = "Every business can grow a little. Trying one new idea is a simple way to bring in more work.";
export const GROW_GUIDANCE = "Pick one idea to try. Next, you'll plan how and when to start.";
export const GROW_QUESTION = "What will you try?";
export const GROW_SALES_LABEL = "Grow your sales";
export const GROW_SERVICE_LABEL = "Grow your service";
export const GROW_SUCCESS = "What will success look like?";
export const GROW_CLOSER_HEADLINE = "See you in three months.";
export const GROW_CLOSER_CONTEXT = "Checking in every three months shows you how your business is going. Set a reminder so you don't forget.";
export const GROW_CALENDAR_NOTE = "NextGenAchiever$ check-in: review what worked, what to fix, and where to grow.";
export const GROW_COPY_LABEL = "Copy";
export const GROW_COPY_HINT = "Add this to your calendar.";

export const START_OPTIONS = [
  { id: "next-job", label: "by my next job" },
  { id: "this-week", label: "this week" },
  { id: "in-a-month", label: "in a month" },
  { id: "next-quarter", label: "by next quarter" },
  { id: "in-three-months", label: "in three months" },
] as const;

export type StartId = (typeof START_OPTIONS)[number]["id"];

export const GROW_START_OPTIONS = START_OPTIONS.filter((option) => option.id !== "in-three-months");

export const DOG_SERVICES = [
  { id: "dog-walking", label: "Dog walking" },
  { id: "grooming", label: "Grooming" },
  { id: "dog-sitting", label: "Dog sitting" },
  { id: "dog-training", label: "Dog Training" },
  { id: "manage-bookings-for-others", label: "Manage bookings for others" },
] as const;

export const EXPAND_JOBS = [
  { id: "lawn", label: "Lawn mowing", cohorts: ["pathfinder", "maverick"] as const },
  { id: "bins", label: "Bin cleaning", cohorts: ["pathfinder", "maverick"] as const },
  { id: "curb", label: "Curb painting", cohorts: ["explorer", "pathfinder", "maverick"] as const },
  { id: "grocery", label: "Grocery delivery", cohorts: ["maverick"] as const },
  { id: "cleaning", label: "Cleaning", cohorts: ["pathfinder", "maverick"] as const },
];

export const GROW_IDEAS: readonly {
  id: GrowIdeaId;
  label: string;
  group: "sales" | "service";
  context: string;
  question: string;
  options: readonly { id: string; label: string }[];
  success: readonly { id: string; label: string }[];
  start: StartId;
}[] = [
  {
    id: "referral",
    label: "Start a referral program",
    group: "sales",
    context: "A small thank-you makes owners happy to tell their friends about you. Pick a reward, a start date and what success looks like.",
    question: "What will owners get for sending a friend?",
    options: [
      { id: "free-walk", label: "A free walk" },
      { id: "discount", label: "A discount" },
      { id: "add-on", label: "A free add-on" },
      { id: "priority", label: "Priority booking" },
    ],
    success: [
      { id: "new-owner", label: "A new owner books" },
      { id: "two-friends", label: "Two owners tell a friend" },
    ],
    start: "this-week",
  },
  {
    id: "prepaid",
    label: "Offer a prepaid pack",
    group: "sales",
    context: "A prepaid pack means owners book several walks at once, so they keep coming back. Pick a pack, a start date and what success looks like.",
    question: "What pack will you offer?",
    options: [
      { id: "monthly", label: "A monthly pack" },
      { id: "ten-walk", label: "A ten-walk pack" },
      { id: "school", label: "A school break pack" },
    ],
    success: [
      { id: "buys-pack", label: "One owner buys a pack" },
      { id: "buys-again", label: "A pack owner buys again" },
    ],
    start: "in-a-month",
  },
  {
    id: "bundle",
    label: "Build a bundle",
    group: "sales",
    context: "A bundle puts two things together for one price, so owners get more from each booking. Pick a bundle, a start date and what success looks like.",
    question: "What bundle will you offer?",
    options: [
      { id: "walk-wash", label: "Walk and wash" },
      { id: "two-dogs", label: "Two dogs, one price" },
      { id: "quiet", label: "Quiet-time walk deal" },
    ],
    success: [
      { id: "one-bundle", label: "One owner books a bundle" },
      { id: "two-bundles", label: "Two owners book a bundle" },
    ],
    start: "this-week",
  },
  {
    id: "new-service",
    label: "Add a new dog service",
    group: "service",
    context: "A new service gives the owners you already have one more reason to book you. Pick a service, a start date and what success looks like.",
    question: "What new service will you add?",
    options: DOG_SERVICES,
    success: [
      { id: "books-it", label: "One owner books it" },
      { id: "regular-adds", label: "A regular customer adds it" },
    ],
    start: "next-quarter",
  },
  {
    id: "expand",
    label: "Expand your services",
    group: "service",
    context: "The skills you've built can help with other jobs too. Pick a job, a start date and what success looks like.",
    question: "What new kind of job will you try?",
    options: EXPAND_JOBS.map((job) => ({ id: job.id, label: job.label })),
    success: [
      { id: "neighbor", label: "One neighbor books it" },
      { id: "dog-owner", label: "A dog owner books it too" },
    ],
    start: "next-quarter",
  },
];

export function statementsIn(section: LevelSectionId): LevelStatement[] {
  return LEVEL_STATEMENTS.filter((item) => item.section === section);
}

export function sectionLabel(id: LevelSectionId): string {
  return LEVEL_SECTIONS.find((section) => section.id === id)?.label ?? id;
}

export function nailedLine(section: LevelSectionId): string {
  return `Everything in ${sectionLabel(section)} is already a win. Keep it up.`;
}

export function commitLine(label: string): string {
  return `I will ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
}

/** Today plus three calendar months. 10 Nov 2026 becomes 10 Feb 2027. */
export function addMonths(today: Date, months: number): Date {
  return new Date(today.getFullYear(), today.getMonth() + months, today.getDate());
}

export function formatCheckInDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

/** The calendar note, with the calculated check-in date. The app sets no reminder. */
export function checkInClipboard(dateLabel: string): string {
  return `${GROW_CALENDAR_NOTE}\nYour next check-in: ${dateLabel}`;
}

export function expandJobsFor(cohort: LevelCohort): { id: string; label: string }[] {
  return EXPAND_JOBS.filter((job) => (job.cohorts as readonly string[]).includes(cohort)).map((job) => ({ id: job.id, label: job.label }));
}

export function growIdea(id: string) {
  return GROW_IDEAS.find((idea) => idea.id === id);
}
