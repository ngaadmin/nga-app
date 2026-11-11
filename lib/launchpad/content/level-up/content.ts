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
      planHeader: "You've selected your focus areas.",
      planContext: "You can't give all your focus areas equal attention at once, so we suggest one focus per week. Choose the order you want to tackle them.",
      weekLabels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    },
    grow: {
      guidance: "Pick up to three ideas to try.",
      question: "What will you try?",
      closerHeadline: "See you in three months.",
      closerContext: "Checking in every three months shows you how your business is going. Set a reminder so you don't forget.",
      calendarNote: "NextGenAchiever$ check-in: review what worked, what to fix, and where to grow.",
      checkIn: "Your next check-in: {date}",
      copyLabel: "Copy",
      copyHint: "Add this to your calendar.",
      ideas: [
        {
          id: "referral",
          label: "Start a referral program",
          options: [
            { id: "free-walk", label: "A free walk" },
            { id: "discount", label: "A discount" },
            { id: "add-on", label: "A free add-on" },
            { id: "priority", label: "Priority booking" },
          ],
        },
        {
          id: "prepaid",
          label: "Offer a prepaid pack",
          options: [
            { id: "monthly", label: "A monthly pack" },
            { id: "ten-walk", label: "A ten-walk pack" },
            { id: "school", label: "A school break pack" },
          ],
        },
        {
          id: "bundle",
          label: "Build a bundle",
          options: [
            { id: "walk-wash", label: "Walk and wash" },
            { id: "two-dogs", label: "Two dogs, one price" },
            { id: "quiet", label: "Quiet-time walk deal" },
          ],
        },
        {
          id: "new-service",
          label: "Add a new dog service",
          options: [
            { id: "dog-walking", label: "Dog walking" },
            { id: "grooming", label: "Grooming" },
            { id: "dog-sitting", label: "Dog sitting" },
            { id: "dog-training", label: "Dog Training" },
            { id: "manage-bookings-for-others", label: "Manage bookings for others" },
          ],
        },
        {
          id: "expand",
          label: "Expand your services",
          options: [
            { id: "lawn", label: "Lawn mowing", cohorts: ["pathfinder", "maverick"] },
            { id: "bins", label: "Bin cleaning", cohorts: ["pathfinder", "maverick"] },
            { id: "curb", label: "Curb painting", cohorts: ["explorer", "pathfinder", "maverick"] },
            { id: "grocery", label: "Grocery delivery", cohorts: ["maverick"] },
            { id: "cleaning", label: "Cleaning", cohorts: ["pathfinder", "maverick"] },
          ],
        },
      ],
    },
  };
}
