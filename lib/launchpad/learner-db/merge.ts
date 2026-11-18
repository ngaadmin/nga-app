import type { LaunchpadAnswer, LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import type { TaskProgressEntry, VentureTestProgress } from "@/lib/launchpad/venture-test/venture-test-progress";

/** One side of a merge. Stamps are ISO times. A missing stamp loses to a real one. */
export type LaunchpadLearnerSnapshot = {
  progress: VentureTestProgress;
  onboardingSeen: boolean;
  answerUpdatedAt: Readonly<Record<string, string>>;
  taskUpdatedAt: Readonly<Record<string, string>>;
};

function unionIds(left: readonly string[], right: readonly string[]): string[] {
  const out = [...left];
  const seen = new Set(left);
  for (const id of right) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

function newer(left: string | undefined, right: string | undefined): "left" | "right" | "tie" {
  if (left && right) return left === right ? "tie" : left > right ? "left" : "right";
  if (left) return "left";
  if (right) return "right";
  return "tie";
}

function mergeAnswers(
  local: LaunchpadLearnerSnapshot,
  remote: LaunchpadLearnerSnapshot,
): { answers: LaunchpadAnswers; answerUpdatedAt: Record<string, string> } {
  const keys = new Set([
    ...Object.keys(local.progress.answers ?? {}),
    ...Object.keys(remote.progress.answers ?? {}),
  ]);
  const answers: Record<string, LaunchpadAnswer> = {};
  const answerUpdatedAt: Record<string, string> = {};
  for (const key of keys) {
    const localAnswer = local.progress.answers?.[key];
    const remoteAnswer = remote.progress.answers?.[key];
    const pick = newer(local.answerUpdatedAt[key], remote.answerUpdatedAt[key]);
    const chosen =
      pick === "right" && remoteAnswer
        ? remoteAnswer
        : pick === "left" && localAnswer
          ? localAnswer
          : (localAnswer ?? remoteAnswer);
    if (!chosen) continue;
    answers[key] = chosen;
    const stamp = pick === "right" ? remote.answerUpdatedAt[key] : local.answerUpdatedAt[key] ?? remote.answerUpdatedAt[key];
    if (stamp) answerUpdatedAt[key] = stamp;
  }
  return { answers, answerUpdatedAt };
}

function mergeTasks(
  local: LaunchpadLearnerSnapshot,
  remote: LaunchpadLearnerSnapshot,
  completed: readonly string[],
): { tasks: Record<string, TaskProgressEntry>; taskUpdatedAt: Record<string, string> } {
  const keys = new Set([...Object.keys(local.progress.tasks ?? {}), ...Object.keys(remote.progress.tasks ?? {})]);
  const tasks: Record<string, TaskProgressEntry> = {};
  const taskUpdatedAt: Record<string, string> = {};
  for (const id of keys) {
    const localTask = local.progress.tasks?.[id];
    const remoteTask = remote.progress.tasks?.[id];
    if (completed.includes(id)) {
      tasks[id] = { status: "done" };
      continue;
    }
    const pick = newer(local.taskUpdatedAt[id], remote.taskUpdatedAt[id]);
    const chosen = pick === "right" && remoteTask ? remoteTask : (localTask ?? remoteTask);
    if (!chosen) continue;
    tasks[id] = chosen.status === "done" ? { status: "done" } : chosen;
    const stamp = pick === "right" ? remote.taskUpdatedAt[id] : local.taskUpdatedAt[id] ?? remote.taskUpdatedAt[id];
    if (stamp) taskUpdatedAt[id] = stamp;
  }
  return { tasks, taskUpdatedAt };
}

/**
 * Furthest progress wins: a completed task is never dropped.
 * Each answer keeps the copy with the newer stamp. A tie keeps the browser copy.
 */
export function mergeLaunchpadLearnerSnapshot(
  local: LaunchpadLearnerSnapshot,
  remote: LaunchpadLearnerSnapshot,
): LaunchpadLearnerSnapshot {
  const completedTaskIds = unionIds(local.progress.completedTaskIds, remote.progress.completedTaskIds);
  const { answers, answerUpdatedAt } = mergeAnswers(local, remote);
  const { tasks, taskUpdatedAt } = mergeTasks(local, remote, completedTaskIds);
  const complete = local.progress.complete === true || remote.progress.complete === true;
  return {
    progress: {
      completedTaskIds,
      ...(Object.keys(answers).length ? { answers } : {}),
      ...(Object.keys(tasks).length ? { tasks } : {}),
      ...(complete ? { complete: true } : {}),
    },
    onboardingSeen: local.onboardingSeen || remote.onboardingSeen,
    answerUpdatedAt,
    taskUpdatedAt,
  };
}
