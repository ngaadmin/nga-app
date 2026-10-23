import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { errorLineIsAcceptable, findBritishSpelling } from "@/lib/academy/lessons/payload/error-line";
import type { LessonPayload, PayloadCohortCopy, PayloadScreenRow } from "@/lib/academy/lessons/payload/types";
import { ACADEMY_AUDIO_BASE_URL, STORY_CREDIT } from "@/lib/academy/lessons/story-audio/audio-base";
import {
  lessonNumberFromBeatId,
  storyCreditBeatIds,
} from "@/lib/academy/lessons/story-audio/story-credit";

export type ExplorerManifestBeat = {
  beat_id: string;
  file: string;
  durationMs: number;
};

export type ExplorerNarrationBeat = {
  beatId: string;
  imageBrief: string;
};

/** Module intro. The workbook has no row for it, so the importer reads this instead. */
export type ExplorerIntroBeat = {
  beatId: string;
  lessonNumber: number;
  text: string;
  /** Explorer Image filename. The same file is used for every cohort. */
  image: string;
  imageBrief: string;
  follow: string;
};

const SCENARIO_LESSON = "scenario beat";

function mirror(value: string): PayloadCohortCopy {
  return { explorer: value, pathfinder: value, maverick: value };
}

function columnIndex(headers: readonly string[], name: string): number {
  const target = name.trim().toLowerCase();
  const index = headers.findIndex((header) => header.trim().toLowerCase() === target);
  if (index < 0) throw new Error(`Explorer workbook is missing column "${name}".`);
  return index;
}

function cell(row: readonly string[], index: number): string {
  return (row[index] ?? "").trim();
}

/**
 * Turn the Explorer Module 1 workbook into one payload per lesson.
 * Scenario beats stay in sheet order. A beat that sits after a lesson's
 * completion row is part of that lesson, after the completion screen.
 * Credit is the first voiced beat of each lesson. The module intro counts as lesson 1.
 */
export function convertExplorerModule1(input: {
  table: readonly (readonly string[])[];
  narration: readonly ExplorerNarrationBeat[];
  manifest: readonly ExplorerManifestBeat[];
  intro?: ExplorerIntroBeat;
  lessonMeta?: readonly Omit<LessonPayload, "screens">[];
}): LessonPayload[] {
  const headers = input.table[0] ?? [];
  const columns = {
    module: columnIndex(headers, "Module Number"),
    lesson: columnIndex(headers, "Lesson Number"),
    screen: columnIndex(headers, "Screen"),
    gameType: columnIndex(headers, "Game Type"),
    text: columnIndex(headers, "Explorer Text"),
    image: columnIndex(headers, "Explorer Image"),
    settings: columnIndex(headers, "Explorer Settings"),
    error: columnIndex(headers, "Error Explorer"),
    brief: columnIndex(headers, "Image Name"),
  };

  const manifestById = new Map<string, ExplorerManifestBeat>();
  for (const beat of input.manifest) {
    const id = beat.beat_id.trim();
    if (!id || !beat.file.trim()) {
      throw new Error("Explorer audio manifest row is missing beat_id or file.");
    }
    manifestById.set(id, beat);
  }

  const scenarioRows: { text: string; brief: string; where: string }[] = [];
  const lessons = new Map<number, PayloadScreenRow[]>();
  let currentLesson = 0;

  for (let index = 1; index < input.table.length; index += 1) {
    const row = input.table[index] ?? [];
    const lessonCell = cell(row, columns.lesson);
    const moduleCell = cell(row, columns.module);
    const where = `row ${index + 1}`;
    if (!moduleCell && !lessonCell && !cell(row, columns.text)) continue;
    const moduleNumber = Number(moduleCell);
    if (moduleNumber !== 1) {
      throw new Error(`Explorer workbook ${where} is not module 1.`);
    }

      if (lessonCell.toLowerCase() === SCENARIO_LESSON) {
      if (!currentLesson) {
        throw new Error(`Scenario beat ${where} appears before a lesson.`);
      }
      const scenarioBritish = findBritishSpelling(cell(row, columns.text));
      if (scenarioBritish) {
        throw new Error(`Explorer workbook ${where} uses British spelling "${scenarioBritish}".`);
      }
      scenarioRows.push({
        text: cell(row, columns.text),
        brief: cell(row, columns.brief),
        where,
      });
      const beat = input.narration[scenarioRows.length - 1];
      if (!beat) {
        throw new Error(`Scenario beat ${where} has no narration row.`);
      }
      if (beat.imageBrief.trim() !== cell(row, columns.brief)) {
        throw new Error(
          `Scenario beat ${where} image brief does not match narration ${beat.beatId}.`,
        );
      }
      const audio = manifestById.get(beat.beatId);
      if (!audio) {
        throw new Error(`No audio manifest entry for ${beat.beatId}.`);
      }
      const screens = lessons.get(currentLesson) ?? [];
      screens.push(
        scenarioScreen({
          beatId: beat.beatId,
          text: cell(row, columns.text),
          brief: cell(row, columns.brief),
          file: audio.file,
          durationMs: audio.durationMs,
          credit: false,
        }),
      );
      lessons.set(currentLesson, screens);
      continue;
    }

    const lessonNumber = Number(lessonCell);
    const gameType = cell(row, columns.gameType).toLowerCase();
    const screenLabel = cell(row, columns.screen);
    if (!lessonNumber || !gameType) {
      throw new Error(`Explorer workbook ${where} has no lesson or game type.`);
    }
    currentLesson = lessonNumber;
    const error = cell(row, columns.error);
    if (!errorLineIsAcceptable(1, error, { strict: true })) {
      throw new Error(
        `Explorer workbook ${where} error line must end with "Try again!" or be blank.`,
      );
    }
    const text = cell(row, columns.text);
    const british = findBritishSpelling(`${text}\n${error}`);
    if (british) {
      throw new Error(`Explorer workbook ${where} uses British spelling "${british}".`);
    }
    const screenNumber = Number.parseInt(screenLabel, 10);
    const screens = lessons.get(lessonNumber) ?? [];
    screens.push({
      screenNumber: Number.isFinite(screenNumber) ? screenNumber : screens.length + 1,
      screenLabel: screenLabel || String(screens.length + 1),
      gameType,
      text: mirror(text),
      image: mirror(cell(row, columns.image)),
      settings: mirror(cell(row, columns.settings)),
      error: mirror(error),
    });
    lessons.set(lessonNumber, screens);
  }

  if (scenarioRows.length !== input.narration.length) {
    throw new Error(
      `Workbook has ${scenarioRows.length} scenario beats and narration has ${input.narration.length}.`,
    );
  }

  if (input.intro) {
    prependIntro(lessons, manifestById, input.intro);
  }

  const credits = storyCreditBeatIds(creditCandidates(input.narration, manifestById));

  const metaByLesson = new Map(
    (input.lessonMeta ?? defaultLessonMeta()).map((meta) => [meta.lessonNumber, meta]),
  );

  const payloads: LessonPayload[] = [];
  for (let lessonNumber = 1; lessonNumber <= 9; lessonNumber += 1) {
    const screens = lessons.get(lessonNumber);
    const meta = metaByLesson.get(lessonNumber);
    if (!screens || screens.length === 0 || !meta) {
      throw new Error(`Explorer module 1 lesson ${lessonNumber} has no screens.`);
    }
    payloads.push({
      ...meta,
      moduleNumber: 1,
      lessonNumber,
      screens: screens.map((screen) => applyCredit(screen, credits)),
    });
  }

  for (const beat of input.narration) {
    const british = findBritishSpelling(beat.imageBrief);
    if (british) {
      throw new Error(`Narration ${beat.beatId} uses British spelling "${british}".`);
    }
  }

  return payloads;
}

/**
 * Narration order, with any voiced intro that is only in the audio manifest
 * counted first. That intro is lesson 1's first voice, so a re-import does
 * not put the credit back on the next beat.
 */
function creditCandidates(
  narration: readonly ExplorerNarrationBeat[],
  manifestById: ReadonlyMap<string, ExplorerManifestBeat>,
): { beatId: string; voiced: boolean }[] {
  const listed = new Set(narration.map((beat) => beat.beatId));
  const intros = [...manifestById.values()]
    .filter(
      (beat) =>
        !listed.has(beat.beat_id) &&
        /-intro-beat/i.test(beat.beat_id) &&
        lessonNumberFromBeatId(beat.beat_id) === 1,
    )
    .map((beat) => ({ beatId: beat.beat_id, voiced: Boolean(beat.file.trim()) }));
  return [
    ...intros,
    ...narration.map((beat) => ({
      beatId: beat.beatId,
      voiced: manifestById.has(beat.beatId),
    })),
  ];
}

/**
 * The intro is voiced in the audio manifest and is not a workbook row.
 * Prepend it so a re-import keeps the beat, its art, and its follow line.
 */
function prependIntro(
  lessons: Map<number, PayloadScreenRow[]>,
  manifestById: ReadonlyMap<string, ExplorerManifestBeat>,
  intro: ExplorerIntroBeat,
): void {
  const british = findBritishSpelling(`${intro.text}\n${intro.imageBrief}\n${intro.follow}`);
  if (british) {
    throw new Error(`Explorer intro uses British spelling "${british}".`);
  }
  const image = intro.image.trim();
  if (!image || image.toLowerCase() === "not allowed" || image.includes("..")) {
    throw new Error(`Explorer intro ${intro.beatId} is missing an image filename.`);
  }
  const audio = manifestById.get(intro.beatId);
  if (!audio) {
    throw new Error(`No audio manifest entry for ${intro.beatId}.`);
  }
  const screens = lessons.get(intro.lessonNumber);
  if (!screens) {
    throw new Error(`Explorer intro ${intro.beatId} has no lesson ${intro.lessonNumber}.`);
  }
  screens.unshift(
    scenarioScreen({
      beatId: intro.beatId,
      text: intro.text.trim(),
      brief: intro.imageBrief.trim(),
      file: audio.file,
      durationMs: audio.durationMs,
      credit: false,
      image,
      follow: intro.follow.trim(),
    }),
  );
}

function applyCredit(screen: PayloadScreenRow, credits: ReadonlySet<string>): PayloadScreenRow {
  if (screen.gameType !== "scenario-beat") return screen;
  const id = screen.screenLabel;
  if (!credits.has(id)) return screen;
  const current = screen.settings.explorer;
  if (current.split("\n").some((line) => line.startsWith("CREDIT:"))) return screen;
  const followAt = current.indexOf("\nFOLLOW:");
  const next =
    followAt >= 0
      ? `${current.slice(0, followAt)}\nCREDIT: ${STORY_CREDIT}${current.slice(followAt)}`
      : `${current}\nCREDIT: ${STORY_CREDIT}`;
  return {
    ...screen,
    settings: mirror(next),
  };
}

function scenarioScreen(args: {
  beatId: string;
  text: string;
  brief: string;
  file: string;
  durationMs: number;
  credit: boolean;
  image?: string;
  follow?: string;
}): PayloadScreenRow {
  const file = args.file.split(/[/\\]/).pop() ?? args.file;
  const lines = [
    `ID: ${args.beatId}`,
    `AUDIO: ${ACADEMY_AUDIO_BASE_URL}/${file}`,
    `AUDIO_MS: ${Math.max(0, Math.round(args.durationMs))}`,
    ...(args.brief ? [`IMAGE_BRIEF: ${args.brief}`] : []),
    ...(args.credit ? [`CREDIT: ${STORY_CREDIT}`] : []),
    ...(args.follow ? [`FOLLOW: ${args.follow}`] : []),
  ];
  return {
    screenNumber: 0,
    screenLabel: args.beatId,
    gameType: "scenario-beat",
    text: mirror(args.text),
    image: mirror(args.image ?? ""),
    settings: mirror(lines.join("\n")),
    error: mirror(""),
  };
}

function defaultLessonMeta(): Omit<LessonPayload, "screens">[] {
  return Array.from({ length: 9 }, (_, index) => {
    const payload = loadBundledLessonPayload(1, index + 1);
    return {
      moduleNumber: payload.moduleNumber,
      lessonNumber: payload.lessonNumber,
      lessonTitle: payload.lessonTitle,
      moduleName: payload.moduleName,
      level: payload.level,
      characters: payload.characters,
      skillName: payload.skillName,
      skillId: payload.skillId,
    };
  });
}

export function trimmedManifest(
  rows: readonly { beat_id?: string; beatId?: string; file?: string; durationMs?: number; duration_ms?: number }[],
): ExplorerManifestBeat[] {
  return rows.map((row) => {
    const beat_id = (row.beat_id ?? row.beatId ?? "").trim();
    const file = (row.file ?? "").trim();
    const durationMs = Number(row.durationMs ?? row.duration_ms ?? 0);
    if (!beat_id || !file || !Number.isFinite(durationMs)) {
      throw new Error(`Audio manifest row ${beat_id || "(missing id)"} is incomplete.`);
    }
    return { beat_id, file, durationMs };
  });
}
