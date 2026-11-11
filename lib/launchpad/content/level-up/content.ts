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
      question: "What will you try to grow your business?",
      context: "A growth experiment isn't about polishing what you have, it's one new thing you try to see if it pays off.",
      guidance: "Try at least one growth experiment.",
      optionPrompt: "Select at least one.",
      startLabel: "Start",
      checkInLabel: "Check-in",
      successFieldLabel: "How many customers",
      startOptions: [
        { id: "this-week", label: "This week" },
        { id: "two-weeks", label: "In two weeks" },
        { id: "in-a-month", label: "In a month" },
      ],
      checkInOptions: [
        { id: "one-month", label: "one month", months: 1 },
        { id: "two-months", label: "two months", months: 2 },
        { id: "three-months", label: "three months", months: 3 },
      ],
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
          successLine: "{count} new customers book through a referral",
          options: [
            { id: "free-walk", label: "A free walk" },
            { id: "discount", label: "A discount" },
            { id: "add-on", label: "A free add-on" },
            { id: "priority", label: "A priority booking" },
          ],
        },
        {
          id: "prepaid",
          label: "Offer subscriptions and prepays",
          successLine: "{count} customers sign up and pay upfront",
          options: [
            { id: "prepaid-multi", label: "Prepaid multi-buy" },
            { id: "subscription", label: "Subscription" },
            { id: "prepaid-holiday", label: "Prepaid holiday bookings" },
          ],
        },
        {
          id: "bundle",
          label: "Build service bundles",
          successLine: "{count} customers book a bundle",
          options: [
            { id: "walk-wash", label: "Walk and wash" },
            { id: "walk-manners", label: "Walk and manners" },
            { id: "neighbor", label: "Neighbor bundle" },
          ],
        },
        {
          id: "new-service",
          label: "Add a new dog service",
          successLine: "{count} customers book my new service",
          options: [
            { id: "dog-sitting", label: "Dog sitting" },
            { id: "grooming", label: "Grooming" },
            { id: "dog-training", label: "Dog training" },
            { id: "holiday-care", label: "Holiday care" },
            { id: "manage-bookings-for-others", label: "Manage bookings for others" },
          ],
        },
        {
          id: "expand",
          label: "Expand beyond dog walking",
          successLine: "{count} customers give me more to do",
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
    workbookPages: [{ id: "weekly-focus", title: "My weekly focus areas" }],
  };
}
