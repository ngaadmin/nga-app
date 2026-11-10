import type { LaunchpadBronze, LaunchpadSilver, LaunchpadTask } from "@/lib/launchpad/content/types";

export type LevelUpStep = "reflect" | "improve" | "grow";

export function levelUpTask(id: string, title: string, step: LevelUpStep): LaunchpadTask {
  return {
    id,
    title,
    placeholder: false,
    screens: [{ id: `${id}-s1`, type: "level-up", step, title, answerKey: `l7-${step}` }],
  };
}

export function levelUpBronze(id: string, title: string, step: LevelUpStep): LaunchpadBronze {
  return { id, title, placeholder: false, tasks: [levelUpTask(`${id}-t1`, title, step)] };
}

/** One Growing silver: Reflect, Improve, Grow. */
export function levelUpSilver(): LaunchpadSilver {
  return {
    id: "l7-s1",
    title: "Level Up",
    placeholder: false,
    bronzes: [
      levelUpBronze("l7-s1-b1", "Reflect", "reflect"),
      levelUpBronze("l7-s1-b2", "Improve", "improve"),
      levelUpBronze("l7-s1-b3", "Grow", "grow"),
    ],
  };
}
