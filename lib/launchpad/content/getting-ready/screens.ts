import type { GettingReadyStep, LaunchpadBronze, LaunchpadGettingReadyScreen, LaunchpadSilver, LaunchpadTask } from "@/lib/launchpad/content/types";
import {
  AGREE_JOB_KEY,
  DELIVER_JOB_KEY,
  FIND_CUSTOMERS_KEY,
  POLISH_SERVICE_KEY,
  PRACTICE_RUN_KEY,
  WRAP_JOB_KEY,
} from "@/lib/launchpad/content/getting-ready/copy";

function task(id: string, title: string, step: GettingReadyStep, answerKey: string): LaunchpadTask {
  const screen: LaunchpadGettingReadyScreen = { id: `${id}-s1`, type: "getting-ready", step, answerKey };
  return { id, title, placeholder: false, screens: [screen] };
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
