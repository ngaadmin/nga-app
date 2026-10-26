import "server-only";

import { existsSync } from "node:fs";
import path from "node:path";

import { getPairSheetImagePath } from "@/lib/academy/illustrations/illustration-registry";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import { payloadGameDropsNamedPicture } from "@/lib/academy/lessons/resolve-lesson-screen-illustration";
import type { LessonPayload, PayloadCohortCopy } from "@/lib/academy/lessons/payload/types";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

const COHORTS: readonly MasteryCohort[] = ["explorer", "pathfinder", "maverick"];

function cohortField(copy: PayloadCohortCopy, cohort: MasteryCohort): string {
  const own = copy[cohort].trim();
  if (own) return own;
  return copy.pathfinder.trim();
}

export type MissingLessonImage = {
  cohort: MasteryCohort;
  screenLabel: string;
  fileName: string;
  requestedPath: string;
};

/**
 * Images the player will request. Completion rows store medal file names the
 * completion pane does not render, so those cells are not checked here.
 */
export function missingLessonImages(payload: LessonPayload): MissingLessonImage[] {
  const missing: MissingLessonImage[] = [];
  for (const screen of payload.screens) {
    if (screen.gameType === "completion") continue;
    for (const cohort of COHORTS) {
      if (payloadGameDropsNamedPicture(screen.gameType, cohortField(screen.settings, cohort))) {
        continue;
      }
      const fileName = cohortField(screen.image, cohort);
      if (!fileName || fileName.toLowerCase() === "not allowed") continue;
      const src = getPairSheetImagePath(fileName);
      const requestedPath = src ?? "";
      const file = src ? path.join(process.cwd(), "public", src) : "";
      if (!src || !existsSync(file)) {
        missing.push({
          cohort,
          screenLabel: screen.screenLabel,
          fileName,
          requestedPath: requestedPath || "(unresolved)",
        });
      }
    }
  }
  return missing;
}

const checkedAssetSignatures = new Set<string>();

function assetSignature(payload: LessonPayload, milestoneId: number): string {
  const images = payload.screens
    .map(
      (screen) =>
        `${screen.screenLabel}:${screen.gameType}:${screen.image.explorer}:${screen.image.pathfinder}:${screen.image.maverick}:${screen.settings.pathfinder}`,
    )
    .join("|");
  return `${milestoneId}:${images}`;
}

/** Throw when a GO target is unknown or a rendered image file is missing. */
export function assertLessonPayloadAssets(
  payload: LessonPayload,
  milestoneId: number,
): void {
  const signature = assetSignature(payload, milestoneId);
  if (checkedAssetSignatures.has(signature)) return;

  for (const cohort of COHORTS) {
    resolvePayloadLesson(payload, cohort, milestoneId);
  }
  const missing = missingLessonImages(payload);
  if (missing.length === 0) {
    checkedAssetSignatures.add(signature);
    return;
  }
  const lines = missing.map(
    (item) =>
      `${item.cohort} screen ${item.screenLabel}: ${item.fileName} → ${item.requestedPath}`,
  );
  throw new Error(
    `Module ${payload.moduleNumber} lesson ${payload.lessonNumber} is missing illustration files:\n${lines.join("\n")}`,
  );
}
