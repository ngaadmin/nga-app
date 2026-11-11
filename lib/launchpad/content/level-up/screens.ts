import type { LaunchpadLevelUpContent } from "@/lib/launchpad/content/level-up/model";
import { levelUpContent } from "@/lib/launchpad/content/level-up/content";
import type { LaunchpadBronze, LaunchpadSilver, LaunchpadTask } from "@/lib/launchpad/content/types";

export type LevelUpStep = "reflect" | "improve" | "grow";

function levelUpTask(id: string, title: string, step: LevelUpStep, content: LaunchpadLevelUpContent): LaunchpadTask {
  return {
    id,
    title,
    placeholder: false,
    screens: [{ id: `${id}-s1`, type: "level-up", step, title, answerKey: `l7-${step}`, content }],
  };
}

function levelUpBronze(id: string, title: string, step: LevelUpStep, content: LaunchpadLevelUpContent): LaunchpadBronze {
  return { id, title, placeholder: false, tasks: [levelUpTask(`${id}-t1`, title, step, content)] };
}

/** One Growing silver: Reflect, Improve, Grow. All three screens share one content object. */
export function levelUpSilver(): LaunchpadSilver {
  const content = levelUpContent();
  return {
    id: "l7-s1",
    title: "Level Up",
    placeholder: false,
    bronzes: [
      levelUpBronze("l7-s1-b1", "Reflect", "reflect", content),
      levelUpBronze("l7-s1-b2", "Improve", "improve", content),
      levelUpBronze("l7-s1-b3", "Grow", "grow", content),
    ],
  };
}
