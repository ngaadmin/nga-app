import type {
  LaunchpadChoiceCaptureScreen,
  LaunchpadFloor,
  LaunchpadGoalLoopGoal,
  LaunchpadGoalLoopScreen,
  LaunchpadRankOrderScreen,
  LaunchpadShortTextScreen,
  LaunchpadTask,
  LaunchpadTaskScreen,
} from "@/lib/launchpad/content/types";
import {
  fieldsOf,
  rankingAnswer,
  rankingOf,
  selectionOf,
  type LaunchpadAnswer,
  type LaunchpadAnswers,
} from "@/lib/launchpad/content/answers";
import { isShortTextAnswered } from "@/lib/launchpad/content/fields";
import { isIdentityTaskAnswered } from "@/lib/launchpad/content/identity-content";

/** A screen that renders on its own (goal loops expand into these). */
export type LaunchpadPageScreen = Exclude<LaunchpadTaskScreen, LaunchpadGoalLoopScreen>;

/** One page of a paged task: a screen, plus the goal it belongs to inside a goal loop. */
export type TaskPage = { screen: LaunchpadPageScreen; goal?: LaunchpadGoalLoopGoal };

/**
 * The goals a goal loop shows, in order: ranked goals in the learner's
 * ranking order (reasons struck out as not applicable, and the loop's
 * skipRankItemIds, are left out), then the "after-ranked" goals, then the
 * optional "last" goal. Before the ranking is saved the items' authored
 * order stands in.
 */
export function goalLoopGoals(
  loop: LaunchpadGoalLoopScreen,
  answers: LaunchpadAnswers | undefined,
  rankItemOrder: readonly string[] = [],
): LaunchpadGoalLoopGoal[] {
  const ranking = rankingOf(answers, loop.orderFrom);
  const order = ranking?.order.length ? ranking.order : rankItemOrder;
  const struck = new Set(ranking?.notApplicable ?? []);
  const ranked = loop.goals.filter((g) => g.position === "ranked" && g.rankItemId);
  const pos = (g: LaunchpadGoalLoopGoal) => {
    const i = order.indexOf(g.rankItemId!);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const keep = (g: LaunchpadGoalLoopGoal) =>
    !g.rankItemId || (!struck.has(g.rankItemId) && !loop.skipRankItemIds.includes(g.rankItemId));
  return [
    ...ranked.filter(keep).sort((a, b) => pos(a) - pos(b)),
    ...loop.goals.filter((g) => g.position === "after-ranked" && keep(g)),
    ...loop.goals.filter((g) => g.position === "last"),
  ];
}

/** Every page of a task, goal loops expanded for these answers. */
export function taskPages(
  task: Pick<LaunchpadTask, "screens">,
  answers: LaunchpadAnswers | undefined,
  floors: readonly LaunchpadFloor[] = [],
): TaskPage[] {
  const pages: TaskPage[] = [];
  for (const screen of task.screens) {
    if (screen.type === "goal-loop") {
      const items = rankItemsFor(floors, screen.orderFrom);
      for (const goal of goalLoopGoals(screen, answers, items)) pages.push({ screen: goal.screen, goal });
    } else pages.push({ screen });
  }
  return pages;
}

/** The authored item order of the rank-order screen saving `answerKey`. */
export function rankItemsFor(floors: readonly LaunchpadFloor[], answerKey: string): string[] {
  for (const f of floors)
    for (const s of f.silvers)
      for (const b of s.bronzes)
        for (const t of b.tasks)
          for (const sc of t.screens) if (sc.type === "rank-order" && sc.answerKey === answerKey) return sc.items.map((i) => i.id);
  return [];
}

/** True once a page's interaction holds a valid answer (context and copy screens always are). */
export function isPageAnswered(screen: LaunchpadPageScreen, answers: LaunchpadAnswers | undefined): boolean {
  switch (screen.type) {
    case "choice-capture":
      return (selectionOf(answers, screen.answerKey)?.selected ?? []).some((id) => screen.options.some((o) => o.id === id));
    case "rank-order":
      // The authored order is a valid ranking, so Next is always on; see pageDefaultAnswer.
      return true;
    case "short-text":
      return isShortTextAnswered(screen, fieldsOf(answers, screen.answerKey));
    case "logo-picker":
    case "name-picker":
      return isIdentityTaskAnswered({ screens: [screen] }, answers);
    default:
      return true;
  }
}

/** True when every page of the task is answered (stacked tasks gate Next on this). */
export function isTaskAnswered(
  task: Pick<LaunchpadTask, "screens">,
  answers: LaunchpadAnswers | undefined,
  floors: readonly LaunchpadFloor[] = [],
): boolean {
  return taskPages(task, answers, floors).every((p) => isPageAnswered(p.screen, answers));
}

/** The answer to save when Next leaves a page that has none yet (a rank order left as shown). */
export function pageDefaultAnswer(
  screen: LaunchpadPageScreen,
  answers: LaunchpadAnswers | undefined,
): { answerKey: string; answer: LaunchpadAnswer } | null {
  if (screen.type === "rank-order" && !rankingOf(answers, screen.answerKey)) {
    return { answerKey: screen.answerKey, answer: rankingAnswer(screen.items.map((i) => i.id)) };
  }
  return null;
}

/** Every capture screen in the venture by answerKey (goal-loop goals included). */
export type CaptureScreen = LaunchpadChoiceCaptureScreen | LaunchpadRankOrderScreen | LaunchpadShortTextScreen;

export function captureScreens(floors: readonly LaunchpadFloor[]): Map<string, CaptureScreen> {
  const out = new Map<string, CaptureScreen>();
  for (const f of floors)
    for (const s of f.silvers)
      for (const b of s.bronzes)
        for (const t of b.tasks)
          for (const sc of t.screens) {
            if (sc.type === "choice-capture" || sc.type === "rank-order" || sc.type === "short-text") out.set(sc.answerKey, sc);
            if (sc.type === "goal-loop") for (const g of sc.goals) out.set(g.screen.answerKey, g.screen);
          }
  return out;
}
