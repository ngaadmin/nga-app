import type { LaunchpadBronze, LaunchpadPictureScreen, LaunchpadSilver, LaunchpadTask } from "@/lib/launchpad/content/types";
import { BUDGETING_SCREEN_1, BUDGETING_SCREEN_2, BUDGETING_SCREEN_3, BUDGETING_TITLE, BUDGETING_VOICE_CREDIT } from "@/lib/launchpad/content/budgeting/copy";

const PAGES: LaunchpadPictureScreen["pages"] = [
  {
    id: "s1",
    image: "/launchpad/budgeting/l6-s1-lars-cashbox.webp",
    alt: "Lars dropping a coin into a cash box",
    body: BUDGETING_SCREEN_1,
    credit: BUDGETING_VOICE_CREDIT,
    audio: { src: "/launchpad/budgeting/l6-s1-vo.mp3", durationMs: 15073 },
  },
  {
    id: "s2",
    image: "/launchpad/budgeting/l6-s2-lars-tower.webp",
    alt: "Lars beside a tower of bricks, with a house, a car and a rocket",
    body: BUDGETING_SCREEN_2,
    audio: { src: "/launchpad/budgeting/l6-s2-vo.mp3", durationMs: 20820 },
  },
  {
    id: "s3",
    image: "/launchpad/budgeting/l6-s3-half-built.webp",
    alt: "A half-built house, car and rocket with loose bricks",
    body: BUDGETING_SCREEN_3,
    audio: { src: "/launchpad/budgeting/l6-s3-vo.mp3", durationMs: 24346 },
  },
];

function budgetingScreen(taskId: string): LaunchpadPictureScreen {
  return { id: `${taskId}-s1`, type: "picture", title: BUDGETING_TITLE, voice: true, pages: PAGES };
}

function budgetingTask(id: string): LaunchpadTask {
  return { id, title: BUDGETING_TITLE, placeholder: false, screens: [budgetingScreen(id)] };
}

/** The Level 6 door. One read-through of the three agreed pictures. */
export function budgetingDoor(id = "l6-s1-b1"): LaunchpadBronze {
  return { id, title: BUDGETING_TITLE, placeholder: false, tasks: [budgetingTask(`${id}-t1`)] };
}

export function applyBudgetingDoor(silver: LaunchpadSilver): LaunchpadSilver {
  const door = budgetingDoor();
  return {
    ...silver,
    placeholder: false,
    bronzes: silver.bronzes.map((item) => (item.id === door.id ? door : item)),
  };
}
