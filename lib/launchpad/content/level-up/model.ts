/**
 * Level 7 Level Up. Reflect and Improve use the same outcome statements.
 * `pace` is stored with the learner's picks for a later planning step.
 * It is never shown on these screens.
 */

export type LevelSectionId = "customers" | "ready" | "job" | "happy";
/** Silent classification. Not rendered. */
export type LevelPace = "quick" | "longer";
export type GrowIdeaId = "referral" | "prepaid" | "bundle" | "new-service" | "expand";
export type LevelCohort = "explorer" | "pathfinder" | "maverick";

export type LevelStatement = {
  id: string;
  /** Same words on Reflect and Improve. */
  label: string;
  pace: LevelPace;
  section: LevelSectionId;
};

export const LEVEL_SECTIONS: readonly { id: LevelSectionId; label: string }[] = [
  { id: "customers", label: "Getting customers" },
  { id: "ready", label: "Getting ready" },
  { id: "job", label: "Doing the job" },
  { id: "happy", label: "Keeping customers happy" },
];

export const LEVEL_STATEMENTS: readonly LevelStatement[] = [
  { id: "more-than-one-way", section: "customers", pace: "quick", label: "I used more than one way to get my name out" },
  { id: "followed-up", section: "customers", pace: "quick", label: "I followed up with everyone who showed interest" },
  { id: "knew-someone", section: "customers", pace: "longer", label: "I asked every customer if they knew someone" },
  { id: "book-again", section: "customers", pace: "longer", label: "I asked every customer if they'd like to book me again" },
  { id: "kept-track", section: "ready", pace: "quick", label: "I kept track of every job that came in" },
  { id: "confirmed", section: "ready", pace: "quick", label: "I confirmed each job with the customer beforehand" },
  { id: "slipped", section: "ready", pace: "longer", label: "Nobody's appointment slipped my mind" },
  { id: "on-time", section: "job", pace: "quick", label: "I always showed up on time at each job" },
  { id: "brought-everything", section: "job", pace: "quick", label: "I always brought everything I needed" },
  { id: "enough-time", section: "job", pace: "longer", label: "I had enough time to deliver a good service" },
  { id: "names", section: "happy", pace: "quick", label: "I remembered all my customer names and their pets' names" },
  { id: "feedback", section: "happy", pace: "quick", label: "I asked every customer for feedback" },
  { id: "photo", section: "happy", pace: "longer", label: "I always sent the owner a photo of their pet when I was with them" },
  { id: "expect", section: "happy", pace: "longer", label: "The customer always knew what to expect from me" },
];

/** One Reflect or Improve step per section, so the counter is Section N of 4. */
export const SECTION_PAGES: readonly LevelSectionId[] = ["customers", "ready", "job", "happy"];

export const REFLECT_CONTEXT = "Looking back at what went well shows you what to keep doing, and it's a great reason to feel proud.";
export const REFLECT_GUIDANCE = "Pick every statement that's true for you in each section. There are no wrong answers.";
export const REFLECT_QUESTION = "What went well in your business?";

export const IMPROVE_CONTEXT = "Every business can get a little better. Choosing one small fix in each area keeps it simple, and each fix makes your next job go even better.";
export const IMPROVE_GUIDANCE = "Pick one thing to improve in each section. The grayed-out ones are already your wins.";
export const IMPROVE_QUESTION = "What will you improve next?";
export const NAILED_TITLE = "You nailed this one!";
export const IMPROVE_PLAN_CONTEXT = "A plan with dates is a plan you'll actually do. Here's when you'll start each improvement.";
export const IMPROVE_PLAN_GUIDANCE = "Check your plan. Tap a start date if you want to change it.";

export const GROW_CONTEXT = "Every business can grow a little. Trying one new idea is a simple way to bring in more work.";
export const GROW_GUIDANCE = "Pick one to three ideas to try. Next, you'll plan how and when to start.";
export const GROW_QUESTION = "What will you try?";
export const GROW_SALES_LABEL = "Grow your sales";
export const GROW_SERVICE_LABEL = "Grow your service";
export const GROW_SUCCESS = "What will success look like?";
export const GROW_CLOSER_HEADLINE = "See you in three months.";
export const GROW_CLOSER_CONTEXT = "Checking in every three months shows you how your business is going. Set a reminder so you don't forget.";
export const GROW_CALENDAR_NOTE = "NextGenAchiever$ check-in: review what worked, what to fix, and where to grow.";
export const GROW_COPY_LABEL = "Copy";
export const GROW_COPY_HINT = "Add this to your calendar.";

/** Grow's own start menu. It is not the Improve timeline. */
export const GROW_START_OPTIONS = [
  { id: "next-job", label: "by my next job" },
  { id: "this-week", label: "this week" },
  { id: "in-a-month", label: "in a month" },
  { id: "next-quarter", label: "by next quarter" },
] as const;

export type StartId = (typeof GROW_START_OPTIONS)[number]["id"];

/** Improve timeline only. Older saved ids map onto these. */
export const IMPROVE_START_OPTIONS = [
  { id: "this-week", label: "this week" },
  { id: "this-month", label: "this month" },
  { id: "next-three-months", label: "in the next three months" },
] as const;

export type ImproveStartId = (typeof IMPROVE_START_OPTIONS)[number]["id"];

/** Maps a stored Improve start onto the three current choices. Removed options fall back to this week. */
export function mapImproveStart(saved: string | undefined): ImproveStartId {
  if (saved === "this-month" || saved === "in-a-month") return "this-month";
  if (saved === "next-three-months" || saved === "in-three-months") return "next-three-months";
  return "this-week";
}

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
