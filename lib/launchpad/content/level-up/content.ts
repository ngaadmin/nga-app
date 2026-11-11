import type { LaunchpadLevelUpContent } from "@/lib/launchpad/content/level-up/model";

/**
 * Level Up copy for the venture payload. levelUpSilver() puts this object on
 * every Level Up screen, so Reflect and Improve read one statement list.
 * A new object each call keeps one test from changing another's seed.
 */
export function levelUpContent(): LaunchpadLevelUpContent {
  return {
    sections: [
      { id: "customers", label: "Getting customers" },
      { id: "ready", label: "Getting ready" },
      { id: "job", label: "Doing the job" },
      { id: "happy", label: "Keeping customers happy" },
    ],
    statements: [
      { id: "more-than-one-way", section: "customers", pace: "quick", label: "Using more than one way to get my name out" },
      { id: "followed-up", section: "customers", pace: "quick", label: "Following up with everyone who shows interest" },
      { id: "knew-someone", section: "customers", pace: "longer", label: "Asking every customer if they know someone" },
      { id: "book-again", section: "customers", pace: "longer", label: "Asking every customer if they'd like to book me again" },
      { id: "kept-track", section: "ready", pace: "quick", label: "Keeping track of every job that comes in" },
      { id: "confirmed", section: "ready", pace: "quick", label: "Confirming each job with the customer beforehand" },
      { id: "slipped", section: "ready", pace: "longer", label: "Nobody's appointment slipping my mind" },
      { id: "on-time", section: "job", pace: "quick", label: "Always showing up on time at each job" },
      { id: "brought-everything", section: "job", pace: "quick", label: "Always bringing everything I need" },
      { id: "enough-time", section: "job", pace: "longer", label: "Having enough time to deliver a good service" },
      { id: "names", section: "happy", pace: "quick", label: "Remembering all customer names and their pets' names" },
      { id: "feedback", section: "happy", pace: "quick", label: "Asking every customer for feedback" },
      { id: "photo", section: "happy", pace: "longer", label: "Always sending the owner a photo of their pet when I'm with them" },
      { id: "expect", section: "happy", pace: "longer", label: "The customer always knowing what to expect from me" },
    ],
    reflect: {
      context: "Looking back at what went well shows you what to keep doing, and it's a great reason to feel proud.",
      guidance: "Pick every statement that's true for you in each section. There are no wrong answers.",
      question: "What went well in your business?",
    },
    improve: {
      context: "Every business can get a little better. Choosing one small fix in each area keeps it simple, and each fix makes your next job go even better.",
      guidance: "Pick one thing to improve in each section. The grayed-out ones are already your wins.",
      question: "What will you improve next?",
      nailedTitle: "You nailed this one!",
      nailedLine: "Everything in {section} is already a win. Keep it up.",
      planContext: "A plan with dates is a plan you'll actually do. Here's when you'll start each improvement.",
      planGuidance: "Check your plan. Tap a start date if you want to change it.",
      starting: "{label}, starting",
      startFieldLabel: "Start date",
      startOptions: [
        { id: "this-week", label: "this week" },
        { id: "this-month", label: "this month" },
        { id: "next-three-months", label: "in the next three months" },
      ],
    },
    grow: {
      context: "Every business can grow a little. Trying one new idea is a simple way to bring in more work.",
      guidance: "Pick up to three ideas to try. Keeping it to three helps you focus on the ones you really want to do. Next, you'll plan how and when to start.",
      question: "What will you try?",
      salesLabel: "Grow your sales",
      serviceLabel: "Grow your service",
      success: "What will success look like?",
      tryStarting: "I will try it starting",
      closerHeadline: "See you in three months.",
      closerContext: "Checking in every three months shows you how your business is going. Set a reminder so you don't forget.",
      calendarNote: "NextGenAchiever$ check-in: review what worked, what to fix, and where to grow.",
      checkIn: "Your next check-in: {date}",
      copyLabel: "Copy",
      copyHint: "Add this to your calendar.",
      startFieldLabel: "Start date",
      startOptions: [
        { id: "next-job", label: "by my next job" },
        { id: "this-week", label: "this week" },
        { id: "in-a-month", label: "in a month" },
        { id: "next-quarter", label: "by next quarter" },
      ],
      ideas: [
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
          options: [
            { id: "dog-walking", label: "Dog walking" },
            { id: "grooming", label: "Grooming" },
            { id: "dog-sitting", label: "Dog sitting" },
            { id: "dog-training", label: "Dog Training" },
            { id: "manage-bookings-for-others", label: "Manage bookings for others" },
          ],
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
          options: [
            { id: "lawn", label: "Lawn mowing", cohorts: ["pathfinder", "maverick"] },
            { id: "bins", label: "Bin cleaning", cohorts: ["pathfinder", "maverick"] },
            { id: "curb", label: "Curb painting", cohorts: ["explorer", "pathfinder", "maverick"] },
            { id: "grocery", label: "Grocery delivery", cohorts: ["maverick"] },
            { id: "cleaning", label: "Cleaning", cohorts: ["pathfinder", "maverick"] },
          ],
          success: [
            { id: "neighbor", label: "One neighbor books it" },
            { id: "dog-owner", label: "A dog owner books it too" },
          ],
          start: "next-quarter",
        },
      ],
    },
  };
}
