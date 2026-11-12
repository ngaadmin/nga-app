import type { LaunchpadBronze, LaunchpadDeliveryScreen, LaunchpadSilver, LaunchpadTask } from "@/lib/launchpad/content/types";
import {
  DELIVERY_JOIN,
  GET_READY,
  GET_READY_KEY,
  RECORD_JOB,
  RECORD_JOB_KEY,
  WRAP_UP_JOB,
  WRAP_UP_JOB_KEY,
} from "@/lib/launchpad/content/delivery/copy";

const LOOKUPS = {
  deliverFrom: "deliver_the_job",
  wrapFrom: "wrap_up",
  costsFrom: "l2-costs",
  priceFrom: "l2-price",
  servicesFrom: "l1-offer",
  joinWord: DELIVERY_JOIN,
} as const;

function readyScreen(id: string): LaunchpadDeliveryScreen {
  return {
    id,
    type: "delivery",
    step: "ready",
    answerKey: GET_READY_KEY,
    title: GET_READY.title,
    question: GET_READY.question,
    context: GET_READY.context,
    guidance: GET_READY.guidance,
    doodles: GET_READY.doodles,
    playbackTitle: GET_READY.playbackTitle,
    ...LOOKUPS,
    ready: {
      emptyLabel: GET_READY.emptyLabel,
      remindBefore: GET_READY.remindBefore,
      remindAfter: GET_READY.remindAfter,
      aboutBefore: GET_READY.aboutBefore,
      aboutAfter: GET_READY.aboutAfter,
      aboutOptions: GET_READY.aboutOptions.map((row) => ({ ...row })),
      travelBefore: GET_READY.travelBefore,
      travelAfter: GET_READY.travelAfter,
      travelOptions: GET_READY.travelOptions.map((row) => ({ ...row })),
      leaveBefore: GET_READY.leaveBefore,
      leaveAfter: GET_READY.leaveAfter,
      leaveOptions: GET_READY.leaveOptions.map((row) => ({ ...row })),
      packBefore: GET_READY.packBefore,
      packAfter: GET_READY.packAfter,
      packOptions: GET_READY.packOptions.map((row) => ({ ...row })),
      packTitle: GET_READY.packTitle,
      packSep: GET_READY.packSep,
      packEmpty: GET_READY.packEmpty,
      note: GET_READY.note,
    },
  };
}

function wrapScreen(id: string): LaunchpadDeliveryScreen {
  return {
    id,
    type: "delivery",
    step: "wrap",
    answerKey: WRAP_UP_JOB_KEY,
    title: WRAP_UP_JOB.title,
    question: WRAP_UP_JOB.question,
    context: WRAP_UP_JOB.context,
    guidance: WRAP_UP_JOB.guidance,
    doodles: WRAP_UP_JOB.doodles,
    playbackTitle: WRAP_UP_JOB.playbackTitle,
    ...LOOKUPS,
    wrap: {
      emptyLabel: WRAP_UP_JOB.emptyLabel,
      proofBefore: WRAP_UP_JOB.proofBefore,
      proofAfter: WRAP_UP_JOB.proofAfter,
      paymentBefore: WRAP_UP_JOB.paymentBefore,
      paymentAfter: WRAP_UP_JOB.paymentAfter,
      askPayBefore: WRAP_UP_JOB.askPayBefore,
      askPayAfter: WRAP_UP_JOB.askPayAfter,
      askPayOptions: WRAP_UP_JOB.askPayOptions.map((row) => ({ ...row })),
      feedbackBefore: WRAP_UP_JOB.feedbackBefore,
      feedbackAfter: WRAP_UP_JOB.feedbackAfter,
      feedbackLines: WRAP_UP_JOB.feedbackLines.map((row) => ({ ...row })),
      askBefore: WRAP_UP_JOB.askBefore,
      askAfter: WRAP_UP_JOB.askAfter,
      askOptions: WRAP_UP_JOB.askOptions.map((row) => ({ ...row })),
      trackerLine: WRAP_UP_JOB.trackerLine,
      whenBefore: WRAP_UP_JOB.whenBefore,
      whenAfter: WRAP_UP_JOB.whenAfter,
      whenOptions: WRAP_UP_JOB.whenOptions.map((row) => ({ ...row })),
      note: WRAP_UP_JOB.note,
    },
  };
}

function recordScreen(id: string): LaunchpadDeliveryScreen {
  return {
    id,
    type: "delivery",
    step: "record",
    answerKey: RECORD_JOB_KEY,
    title: RECORD_JOB.title,
    question: RECORD_JOB.question,
    context: RECORD_JOB.context,
    guidance: RECORD_JOB.guidance,
    doodles: RECORD_JOB.doodles,
    playbackTitle: RECORD_JOB.playbackTitle,
    ...LOOKUPS,
    record: {
      emptyLabel: RECORD_JOB.emptyLabel,
      serviceBefore: RECORD_JOB.serviceBefore,
      serviceAfter: RECORD_JOB.serviceAfter,
      priceBefore: RECORD_JOB.priceBefore,
      priceAfter: RECORD_JOB.priceAfter,
      paidBefore: RECORD_JOB.paidBefore,
      paidPrefix: RECORD_JOB.paidPrefix,
      paidAfter: RECORD_JOB.paidAfter,
      paidHint: RECORD_JOB.paidHint,
      paidMax: RECORD_JOB.paidMax,
      costBefore: RECORD_JOB.costBefore,
      costAfter: RECORD_JOB.costAfter,
      keptBefore: RECORD_JOB.keptBefore,
      keptAfter: RECORD_JOB.keptAfter,
      lowKeep: RECORD_JOB.lowKeep,
      trackerLine: RECORD_JOB.trackerLine,
      addJob: RECORD_JOB.addJob,
      note: RECORD_JOB.note,
      serviceSuffix: RECORD_JOB.serviceSuffix,
      paidLead: RECORD_JOB.paidLead,
      costLead: RECORD_JOB.costLead,
      keptLead: RECORD_JOB.keptLead,
      lineAfter: RECORD_JOB.lineAfter,
    },
  };
}

function bronze(id: string, title: string, screen: LaunchpadDeliveryScreen): LaunchpadBronze {
  const task: LaunchpadTask = { id: `${id}-t1`, title, placeholder: false, screens: [{ ...screen, id: `${id}-t1-s1` }] };
  return { id, title, placeholder: false, tasks: [task] };
}

/** Level 5. Plan the work is gone. Silver 2 is the job. Silver 3 is the record. */
export function deliverySilvers(): LaunchpadSilver[] {
  return [
    {
      id: "l5-s2",
      title: GET_READY.silverTitle,
      placeholder: false,
      bronzes: [
        bronze("l5-s2-b1", GET_READY.title, readyScreen("l5-s2-b1")),
        bronze("l5-s2-b2", WRAP_UP_JOB.title, wrapScreen("l5-s2-b2")),
      ],
    },
    {
      id: "l5-s3",
      title: RECORD_JOB.silverTitle,
      placeholder: false,
      bronzes: [bronze("l5-s3-b1", RECORD_JOB.title, recordScreen("l5-s3-b1"))],
    },
  ];
}
