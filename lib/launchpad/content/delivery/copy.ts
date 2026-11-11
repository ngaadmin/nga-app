/**
 * Level 5 Delivery copy (framework rows 38-40). Screens and the workbook
 * read these strings from the payload. They do not repeat them.
 */

export const GET_READY_KEY = "get_ready_for_job";
export const WRAP_UP_JOB_KEY = "wrap_up_job";
export const RECORD_JOB_KEY = "record_the_job";

const EMPTY = "choose";

export const GET_READY = {
  title: "Get ready for the job",
  silverTitle: "Do the job",
  question: "How will you get ready for the job?",
  context: "A job goes well when it starts well. A quick reminder the day before and a little planning mean you arrive on time, with everything you need, and the owner knows what to expect.",
  guidance: "Your reminder plan is already filled in from Deliver the job. Pick what you will remind the owner about, then plan how you will get there, when you will leave, and when you will pack.",
  emptyLabel: EMPTY,
  remindBefore: "The day before, I will remind the owner what to expect by ",
  remindAfter: ".",
  aboutBefore: "I will remind them about ",
  aboutAfter: ".",
  aboutOptions: [
    { id: "day-time", label: "the day and time" },
    { id: "included", label: "the day, time and what's included" },
    { id: "price", label: "the day, time, what's included and the price" },
  ],
  travelBefore: "I will get to the job by ",
  travelAfter: ".",
  travelOptions: [
    { id: "walking", label: "walking" },
    { id: "bike", label: "bike" },
    { id: "ride", label: "a ride from a parent or trusted adult" },
    { id: "transit", label: "bus or train" },
  ],
  leaveBefore: "I will leave ",
  leaveAfter: ", so I'm on time.",
  leaveOptions: [
    { id: "min-10", label: "10 minutes early" },
    { id: "min-15", label: "15 minutes early" },
    { id: "min-30", label: "30 minutes early" },
  ],
  packBefore: "I will pack what I need for the job ",
  packAfter: ".",
  packOptions: [
    { id: "night-before", label: "the night before" },
    { id: "morning-of", label: "the morning of" },
    { id: "hour-before", label: "an hour before" },
  ],
  packTitle: "What to pack",
  packSep: ": ",
  packEmpty: "What to pack: check you have everything the job needs.",
  note: "Always tell a parent or trusted adult where you're going and when you'll be back.",
  doodles: ["paw", "star", "treats"],
  playbackTitle: "My plan before the job",
} as const;

export const WRAP_UP_JOB = {
  title: "Wrap up the job",
  question: "How will you wrap up the job?",
  context: "The job is not finished when the work stops. Sending proof, getting paid and asking how it went shows the owner you care, and helps you do even better next time.",
  guidance: "Your proof, payment and feedback plans are already filled in. Choose when you will ask for payment, what you will ask for feedback, and when you will update your order tracker.",
  emptyLabel: EMPTY,
  proofBefore: "Straight after the job, I will show proof by sending ",
  proofAfter: ".",
  paymentBefore: "I will collect payment by ",
  paymentAfter: ".",
  askPayBefore: "I will ask for payment ",
  askPayAfter: ".",
  askPayOptions: [
    { id: "after-job", label: "straight after the job" },
    { id: "with-proof", label: "when I send the proof" },
    { id: "before-leave", label: "before I leave" },
  ],
  feedbackBefore: "I will ask for feedback by ",
  feedbackAfter: ".",
  askBefore: "I will ask ",
  askAfter: "",
  askOptions: [
    { id: "how-went", label: "How did it go?" },
    { id: "better", label: "Is there anything I could do better?" },
    { id: "book-again", label: "Would you book me again?" },
  ],
  trackerLine: "Then I will tick Done?, Paid? and Feedback asked? for this job in My order tracker in my workbook.",
  whenBefore: "I will update my order tracker ",
  whenAfter: ".",
  whenOptions: [
    { id: "after-job", label: "straight after the job" },
    { id: "same-evening", label: "the same evening" },
    { id: "next-morning", label: "the next morning" },
  ],
  note: "Take payment with a parent or trusted adult nearby, and keep customer details private.",
  doodles: ["sparkle", "heart", "bone"],
  playbackTitle: "My plan after the job",
} as const;

export const RECORD_JOB = {
  title: "Record the job and see what's left",
  silverTitle: "Know your profit",
  question: "How much did you keep from this job?",
  context: "Getting paid is great, but some of that money already was spent on supplies. Taking off your job cost shows how much money you really kept, so you know the profit your business is making.",
  guidance: "Pick the job you did and type what you were paid. Your job cost is filled in from Know your cost. The app works out what you kept.",
  emptyLabel: EMPTY,
  serviceBefore: "The job I did was ",
  serviceAfter: ".",
  priceBefore: "My price for this job is ",
  priceAfter: ".",
  paidBefore: "I was paid ",
  paidPrefix: "$",
  paidAfter: " for this job.",
  paidHint: "(number)",
  paidMax: 9999,
  costBefore: "This job cost me ",
  costAfter: " in supplies.",
  keptBefore: "I kept ",
  keptAfter: ".",
  lowKeep: "This job cost more than you were paid. Check your price before your next job.",
  trackerLine: "I will write what I was paid in the Price column and tick Paid? in My order tracker in my workbook.",
  addJob: "+ Record another job",
  note: "This is a record only. No real money is handled in the app.",
  doodles: ["paw", "coins", "growth"],
  playbackTitle: "My job record",
  serviceSuffix: ": ",
  paidLead: "paid ",
  costLead: ", job cost ",
  keptLead: ", kept ",
  lineAfter: ".",
} as const;

export const DELIVERY_JOIN = "and";
