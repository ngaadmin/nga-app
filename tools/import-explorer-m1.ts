/**
 * Rebuild Explorer Module 1 from the checked-in workbook, narration, and audio manifest.
 * Usage: npm run lesson:import:explorer-m1
 *
 * Replaces lessons.json and the trimmed manifest. MP3s stay in
 * public/academy-audio/explorer-m1/. Drop a replacement manifest.json in
 * that audio folder before running if the clips were regenerated.
 */
import { readFileSync, writeFileSync, rmSync, existsSync } from "node:fs";
import path from "node:path";

import { parseAuthoringTable, parseCsv } from "@/lib/academy/lessons/payload/parse-authoring-table";
import {
  convertExplorerModule1,
  trimmedManifest,
} from "@/lib/academy/lessons/payload/explorer-m1/convert-explorer-workbook";

const SOURCE_DIR = path.join(
  process.cwd(),
  "lib/academy/lessons/payload/source/explorer-m1",
);
const AUDIO_DIR = path.join(process.cwd(), "public/academy-audio/explorer-m1");

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

  const lessons = convertExplorerModule1({ table, narration, manifest });
  writeFileSync(
    path.join(SOURCE_DIR, "lessons.json"),
    `${JSON.stringify({ lessons }, null, 2)}\n`,
  );
  writeFileSync(
    path.join(SOURCE_DIR, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  const publicManifest = path.join(AUDIO_DIR, "manifest.json");
  if (existsSync(publicManifest)) rmSync(publicManifest);

  const beatCount = lessons.reduce(
    (count, lesson) => count + lesson.screens.filter((screen) => screen.gameType === "scenario-beat").length,
    0,
  );
  console.log(`Wrote ${lessons.length} lessons and ${beatCount} story beats.`);
}

main();
