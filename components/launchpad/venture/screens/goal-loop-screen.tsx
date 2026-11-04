"use client";

import type { LaunchpadGoalLoopScreen } from "@/lib/launchpad/content/types";
import { goalLoopGoals, rankItemsFor } from "@/lib/launchpad/content/task-pages";
import { useCaptureAnswer } from "@/components/launchpad/venture/identity/answers-context";
import { ChoiceCaptureScreen } from "@/components/launchpad/venture/screens/choice-capture-screen";
import { ShortTextScreen } from "@/components/launchpad/venture/screens/short-text-screen";
import { ScreenEyebrow } from "@/components/launchpad/venture/screens/screen-ui";

/**
 * Goal loop drawn stacked (a task that is not paged). Paged tasks expand the
 * loop into one page per goal in the workbook instead (taskPages).
 */
export function GoalLoopScreen({ screen }: { screen: LaunchpadGoalLoopScreen }) {
  const { answers, floors } = useCaptureAnswer(screen.orderFrom);
  const goals = goalLoopGoals(screen, answers, rankItemsFor(floors, screen.orderFrom));
  return (
    <div className="flex flex-col gap-2" data-screen-type="goal-loop">
      {goals.map((g, i) => (
        <div key={g.screen.id}>
          <ScreenEyebrow>
            Goal {i + 1} of {goals.length}
          </ScreenEyebrow>
          {g.screen.type === "short-text" ? <ShortTextScreen screen={g.screen} /> : <ChoiceCaptureScreen screen={g.screen} />}
        </div>
      ))}
    </div>
  );
}
