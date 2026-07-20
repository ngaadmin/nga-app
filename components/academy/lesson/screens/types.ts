import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import type { LessonRewards, ScreenConfig } from "@/lib/academy/lessons/types";

export type CoreScreenProps<T extends ScreenConfig> = {
  screen: T;
  screenIndex: number;
  flow: LessonFlow;
};

export type StandardScreenProps<T extends ScreenConfig> = CoreScreenProps<T> & {
  rewards: LessonRewards;
};
