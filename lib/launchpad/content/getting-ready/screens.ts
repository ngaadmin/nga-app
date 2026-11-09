import type { GettingReadyStep, LaunchpadBronze, LaunchpadGettingReadyScreen, LaunchpadSilver, LaunchpadTask } from "@/lib/launchpad/content/types";
import {
  AFTER_HOW,
  AGREE_ITEMS,
  AGREE_NOTE,
  AGREE_PROMPT,
  BEFORE_HOW,
  CHANNELS,
  DELIVER_HINT,
  FEEDBACK_HOW,
  FIND_CUSTOMERS_KEY,
  FIND_HINT,
  AGREE_JOB_KEY,
  DELIVER_JOB_KEY,
  PAYMENT_HOW,
  POLISH_LEAD,
  POLISH_QUESTIONS,
  POLISH_RESULTS,
  POLISH_SERVICE_KEY,
  PRACTICE_RUN_KEY,
  PRACTICE_TIP,
  PRACTICE_WHEN,
  PRACTICE_WHO,
  SUGGESTION_PROMPT,
  WRAP_JOB_HINT,
  WRAP_JOB_KEY,
} from "@/lib/launchpad/content/getting-ready/copy";

const NOTE_STRONG = "Taking a customer order";

function withCopy(step: GettingReadyStep, answerKey: string, id: string): LaunchpadGettingReadyScreen {
  const base = { id: `${id}-s1`, type: "getting-ready" as const, step, answerKey };
  if (step === "find") {
    return {
      ...base,
      title: "Attract the customer",
      question: "How will you find your customers?",
      hint: FIND_HINT,
      alsoLabel: "Also: Add your own (optional)",
      channels: CHANNELS.map((row) => ({ id: row.id, label: row.label })),
    };
  }
  if (step === "agree") {
    return {
      ...base,
      title: "Agree the job",
      question: AGREE_PROMPT,
      readLabel: "I've read this",
      note: AGREE_NOTE.replace("Taking a customer order", "{strong}"),
      noteStrong: NOTE_STRONG,
      agreeSections: AGREE_ITEMS,
      agreePages: [
        { sectionIds: ["collect_info"], question: AGREE_PROMPT, showNote: true },
        { sectionIds: ["confirm_dog"] },
        { sectionIds: ["when_where", "cost_payment"] },
        { sectionIds: ["plans_change"] },
      ],
    };
  }
  if (step === "deliver") {
    return {
      ...base,
      title: "Deliver the job",
      question: "How will you deliver a good job?",
      hint: DELIVER_HINT,
      deliverBlocks: [
        { heading: "One day before the job", lead: "I will contact the owner to confirm the agreed details of the job by {pick}.", slot: "before" },
        { heading: "Straight after I've delivered the service", lead: "I will show proof by sending {pick}.", slot: "after" },
      ],
      beforeOptions: BEFORE_HOW.map((row) => ({ id: row.id, label: row.label, sentence: row.sentence })),
      afterOptions: AFTER_HOW.map((row) => ({ id: row.id, label: row.label, sentence: row.sentence })),
    };
  }
  if (step === "wrap-job") {
    return {
      ...base,
      title: "Wrap-up",
      question: "How will you wrap up a job?",
      hint: WRAP_JOB_HINT,
      payment: { heading: "Taking payment", lead: "I will collect payment by:", options: PAYMENT_HOW.map((row) => ({ ...row })) },
      feedback: {
        heading: "Getting feedback",
        lead: "I will ask the owner for feedback or a short review by:",
        options: FEEDBACK_HOW.map((row) => ({ ...row })),
      },
      summaryBoth: "I will collect payment by {payment}, and ask for feedback {feedback}.",
      summaryPayment: "I will collect payment by {payment}.",
      summaryFeedback: "I will ask for feedback {feedback}.",
    };
  }
  if (step === "practice") {
    return {
      ...base,
      title: "Do the practice run",
      eyebrow: "Test & Tweak",
      question: "How will you practice before your first paid job?",
      hint: PRACTICE_TIP,
      practiceWhoLead: "I will do a practice run for {pick}.",
      practiceServiceLead: "I will do the following service {pick}.",
      practiceWhenLead: "I will do it {pick}.",
      practicePlayback: "Your practice run",
      practiceWho: PRACTICE_WHO.map((row) => ({ id: row.id, label: row.label })),
      practiceWhen: PRACTICE_WHEN.map((row) => ({ id: row.id, label: row.label })),
    };
  }
  return {
    ...base,
    title: "Polish your service",
    eyebrow: "Test & Tweak",
    question: "What feedback did your trial customer give you?",
    hint: POLISH_LEAD,
    polishSuggestion: SUGGESTION_PROMPT,
    polishQuestions: POLISH_QUESTIONS.map((row) => ({ id: row.id, prompt: row.prompt })),
    polishResults: POLISH_RESULTS.map((row) => ({ id: row.id, label: row.label })),
  };
}

function task(id: string, title: string, step: GettingReadyStep, answerKey: string): LaunchpadTask {
  return { id, title, placeholder: false, screens: [withCopy(step, answerKey, id)] };
}

function door(id: string, title: string, step: GettingReadyStep, answerKey: string): LaunchpadBronze {
  return { id, title, placeholder: false, tasks: [task(`${id}-t1`, title, step, answerKey)] };
}

/** Silver 1. Four doors, rows 28-31. */
export function learnJourneySilver(): LaunchpadSilver {
  return {
    id: "l3-s1",
    title: "Learn the customer journey",
    placeholder: false,
    bronzes: [
      door("l3-s1-b1", "Attract the customer", "find", FIND_CUSTOMERS_KEY),
      door("l3-s1-b2", "Agree the job", "agree", AGREE_JOB_KEY),
      door("l3-s1-b3", "Deliver the job", "deliver", DELIVER_JOB_KEY),
      door("l3-s1-b4", "Wrap-up", "wrap-job", WRAP_JOB_KEY),
    ],
  };
}

/** Silver 3. Two doors, rows 32-33. There is no silver 2. */
export function testTweakSilver(): LaunchpadSilver {
  return {
    id: "l3-s3",
    title: "Test & Tweak",
    placeholder: false,
    bronzes: [
      door("l3-s3-b1", "Do the practice run", "practice", PRACTICE_RUN_KEY),
      door("l3-s3-b2", "Polish your service", "polish", POLISH_SERVICE_KEY),
    ],
  };
}

export function gettingReadyScreen(step: GettingReadyStep, answerKey: string): LaunchpadGettingReadyScreen {
  return withCopy(step, answerKey, step);
}
