import type { ReactElement } from "react";
import type { LaunchpadTaskScreen, LaunchpadTaskScreenType } from "@/lib/launchpad/content/types";
import { ChecklistScreen } from "@/components/launchpad/venture/screens/checklist-screen";
import { PlaceholderScreen } from "@/components/launchpad/venture/screens/placeholder-screen";
import { TextScreen } from "@/components/launchpad/venture/screens/text-screen";

type Renderers = {
  [T in LaunchpadTaskScreenType]: (screen: Extract<LaunchpadTaskScreen, { type: T }>) => ReactElement;
};

/**
 * Task screen registry, keyed by screen type (mirrors Academy's
 * LESSON_SCREEN_RENDERERS). The mapped type makes a new screen type in
 * types.ts a compile error until it has a renderer here.
 */
export const LAUNCHPAD_TASK_SCREEN_RENDERERS: Renderers = {
  placeholder: (screen) => <PlaceholderScreen screen={screen} />,
  text: (screen) => <TextScreen screen={screen} />,
  checklist: (screen) => <ChecklistScreen screen={screen} />,
};

export const REGISTERED_LAUNCHPAD_TASK_SCREEN_TYPES = Object.keys(
  LAUNCHPAD_TASK_SCREEN_RENDERERS,
) as LaunchpadTaskScreenType[];

export function TaskScreen({ screen }: { screen: LaunchpadTaskScreen }): ReactElement {
  const render = LAUNCHPAD_TASK_SCREEN_RENDERERS[screen.type] as (s: LaunchpadTaskScreen) => ReactElement;
  return render(screen);
}
