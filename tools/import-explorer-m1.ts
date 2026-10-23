/**
 * Rebuild Explorer Module 1 from the checked-in workbook, narration, intro, and audio manifest.
 * Usage: npm run lesson:import:explorer-m1
 *
 * Replaces lessons.json and the trimmed manifest. MP3s stay in
 * public/academy-audio/explorer-m1/. Drop a replacement manifest.json in
 * that audio folder before running if the clips were regenerated.
 * The module intro is not a workbook row. Its copy and Explorer Image filename
 * come from intro.json, and the clip comes from the audio manifest.
 */
import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";

import { getPairSheetImagePath } from "@/lib/academy/illustrations/illustration-registry";
import { parseAuthoringTable, parseCsv } from "@/lib/academy/lessons/payload/parse-authoring-table";
import {
  convertExplorerModule1,
  trimmedManifest,
  type ExplorerIntroBeat,
} from "@/lib/academy/lessons/payload/explorer-m1/convert-explorer-workbook";

const SOURCE_DIR = path.join(
  process.cwd(),
  "lib/academy/lessons/payload/source/explorer-m1",
);
const AUDIO_DIR = path.join(process.cwd(), "public/academy-audio/explorer-m1");

function readIntro(): ExplorerIntroBeat {
  const raw = JSON.parse(readFileSync(path.join(SOURCE_DIR, "intro.json"), "utf8")) as {
    beatId?: string;
    lessonNumber?: number;
    text?: string;
    image?: string;
    imageBrief?: string;
    follow?: string;
  };
  const intro: ExplorerIntroBeat = {
    beatId: (raw.beatId ?? "").trim(),
    lessonNumber: Number(raw.lessonNumber),
    text: (raw.text ?? "").trim(),
    image: (raw.image ?? "").trim(),
    imageBrief: (raw.imageBrief ?? "").trim(),
    follow: (raw.follow ?? "").trim(),
  };
  if (
    !intro.beatId ||
    !intro.text ||
    !intro.image ||
    !intro.imageBrief ||
    !intro.follow ||
    !Number.isInteger(intro.lessonNumber)
  ) {
    throw new Error("Explorer intro.json is missing beatId, lessonNumber, text, image, imageBrief, or follow.");
  }
  const src = getPairSheetImagePath(intro.image);
  const file = src ? path.join(process.cwd(), "public", src) : "";
  if (!src || !existsSync(file)) {
    throw new Error(`Explorer intro image ${intro.image} is not in the illustrations folder (${src ?? "unresolved"}).`);
  }
  return intro;
}

function readManifest(): unknown {
  const publicManifest = path.join(AUDIO_DIR, "manifest.json");
  const sourceManifest = path.join(SOURCE_DIR, "manifest.json");
  const file = existsSync(publicManifest) ? publicManifest : sourceManifest;
  return JSON.parse(readFileSync(file, "utf8")) as unknown;
}

function main(): void {
  const workbookPath = path.join(SOURCE_DIR, "workbook.xlsx");
  const narrationPath = path.join(SOURCE_DIR, "narration.csv");
  const workbook = readFileSync(workbookPath);
  const table = parseAuthoringTable({
    filename: "workbook.xlsx",
    bytes: new Uint8Array(workbook),
  });
  const narrationRows = parseCsv(readFileSync(narrationPath, "utf8"));
  const narrationHeader = narrationRows[0] ?? [];
  const beatIndex = narrationHeader.findIndex((name) => name.trim() === "beat_id");
  const briefIndex = narrationHeader.findIndex((name) => name.trim() === "image_brief");
  if (beatIndex < 0 || briefIndex < 0) {
    throw new Error("Narration CSV needs beat_id and image_brief columns.");
  }
  const narration = narrationRows.slice(1).filter((row) => (row[beatIndex] ?? "").trim()).map((row) => ({
    beatId: (row[beatIndex] ?? "").trim(),
    imageBrief: (row[briefIndex] ?? "").trim(),
  }));

  const manifest = trimmedManifest(
    readManifest() as { beat_id?: string; beatId?: string; file?: string; durationMs?: number; duration_ms?: number }[],
  );
  for (const beat of manifest) {
    const file = path.join(AUDIO_DIR, beat.file);
    if (!existsSync(file)) {
      throw new Error(`Missing audio file ${beat.file}.`);
    }
  }

  const lessons = convertExplorerModule1({ table, narration, manifest, intro: readIntro() });
  writeJson(path.join(SOURCE_DIR, "lessons.json"), { lessons });
  writeJson(path.join(SOURCE_DIR, "manifest.json"), manifest);
  const publicManifest = path.join(AUDIO_DIR, "manifest.json");
  if (existsSync(publicManifest)) rmSync(publicManifest);

  const beatCount = lessons.reduce(
    (count, lesson) => count + lesson.screens.filter((screen) => screen.gameType === "scenario-beat").length,
    0,
  );
  console.log(`Wrote ${lessons.length} lessons and ${beatCount} story beats.`);
}

/** Match the checked-in lessons file, which stores emoji as \\u escapes. */
function writeJson(file: string, value: unknown): void {
  const json = JSON.stringify(value, null, 2).replace(/[^\u0000-\u007f]/g, (char) => {
    return `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`;
  });
  writeFileSync(file, `${json}\n`);
}

main();
