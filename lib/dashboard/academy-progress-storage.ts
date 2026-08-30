import {
  createPhase1MilestoneScaffold,
  type AcademyLessonMilestoneNode,
} from "@/lib/dashboard/academy-state";
import { resolveContinueMilestoneId } from "@/lib/dashboard/resolve-active-step-index";
import { markAccountProgressDirty } from "@/lib/dashboard/account-progress-dirty";
import {
  readPersisted,
  writePersisted,
} from "@/lib/dev/client-persist";

export const ACADEMY_PROGRESS_STORAGE_KEY = "nga_academy_progress_v1";

export function defaultAcademyMilestones(): AcademyLessonMilestoneNode[] {
  return createPhase1MilestoneScaffold(1);
}

/** Repair multi-active or out-of-order progress from legacy dev overlays. */
function enforceSequentialAcademyProgress(
  milestones: readonly AcademyLessonMilestoneNode[],
): AcademyLessonMilestoneNode[] {
  const continueId = resolveContinueMilestoneId(milestones);
  if (continueId == null) return [...milestones];

  return milestones.map((node) => {
    if (node.id < continueId) {
      return { ...node, status: "completed" as const };
    }
    if (node.id === continueId) {
      return { ...node, status: "active" as const };
    }
    return { ...node, status: "locked" as const };
  });
}

export function readAcademyMilestones(): AcademyLessonMilestoneNode[] {
  if (typeof window === "undefined") {
    return defaultAcademyMilestones();
  }

  const raw = readPersisted(ACADEMY_PROGRESS_STORAGE_KEY);
  if (!raw) return defaultAcademyMilestones();

  try {
    const parsed = JSON.parse(raw) as AcademyLessonMilestoneNode[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return defaultAcademyMilestones();
    }
    return enforceSequentialAcademyProgress(parsed);
  } catch {
    return defaultAcademyMilestones();
  }
}

export function saveAcademyMilestones(
  milestones: readonly AcademyLessonMilestoneNode[],
): void {
  if (typeof window === "undefined") return;
  writePersisted(
    ACADEMY_PROGRESS_STORAGE_KEY,
    JSON.stringify(milestones),
  );
  markAccountProgressDirty();
}

/** Mark a lesson complete and activate the next milestone node. Replay is a no-op. */
export function completeAcademyMilestone(
  completedMilestoneId: number,
  milestones: readonly AcademyLessonMilestoneNode[],
): AcademyLessonMilestoneNode[] {
  const alreadyCompleted = milestones.some(
    (node) => node.id === completedMilestoneId && node.status === "completed",
  );
  if (alreadyCompleted) {
    return milestones.map((node) => ({ ...node }));
  }

  const nextId = completedMilestoneId + 1;

  return milestones.map((node) => {
    if (node.id < completedMilestoneId) {
      return { ...node, status: "completed" as const };
    }
    if (node.id === completedMilestoneId) {
      return { ...node, status: "completed" as const };
    }
    if (node.id === nextId) {
      return { ...node, status: "active" as const };
    }
    if (node.status === "active" && node.id !== nextId) {
      return { ...node, status: "locked" as const };
    }
    return node;
  });
}
