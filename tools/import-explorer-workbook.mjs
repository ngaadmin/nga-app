#!/usr/bin/env node
/**
 * Import Explorer Phase 1 workbook → declarative lesson JSON + TS definitions.
 *
 * Usage:
 *   npm run lesson:import:explorer
 *   node tools/import-explorer-workbook.mjs [path/to/Explorer M1 Lessons 1-4.xlsx]
 *
 * Reads:
 *   - Explorer M1 Lessons 1-4.xlsx (screen-by-screen Explorer copy)
 *   - NGA Academy Lesson Scaffold (3).xlsx (lesson metadata; L3/L4 drafts)
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const DEFAULT_EXPLORER_XLSX = [
  path.join(process.env.USERPROFILE ?? "", "Downloads", "Explorer M1 Lessons 1-4.xlsx"),
  path.join(process.env.USERPROFILE ?? "", "Downloads", "Explorer Detailed Lessons.xlsx"),
].find((p) => fs.existsSync(p)) ?? path.join(
  process.env.USERPROFILE ?? "",
  "Downloads",
  "Explorer M1 Lessons 1-4.xlsx",
);
const DEFAULT_SCAFFOLD_XLSX = [
  path.join(process.env.USERPROFILE ?? "", "Downloads", "NGA Academy Lesson Scaffold (3).xlsx"),
  path.join(process.env.USERPROFILE ?? "", "Downloads", "NGA Academy Lesson Scaffold (2).xlsx"),
].find((p) => fs.existsSync(p)) ?? path.join(
  process.env.USERPROFILE ?? "",
  "Downloads",
  "NGA Academy Lesson Scaffold (3).xlsx",
);
const BUNDLED_EXPLORER_CSV = path.join(
  ROOT,
  "templates/lesson-authoring/explorer-m1/explorer-phase-1.csv",
);
const BUNDLED_SCAFFOLD_CSV = path.join(
  ROOT,
  "templates/lesson-authoring/explorer-m1/lesson-scaffold.csv",
);

const SCREEN_IDS_L1 = [
  "hook-word-drop",
  "short-fun-reality",
  "tap-short-vs-long",
  "sort-short-vs-long",
  "countdown-trap",
  "impulse-pause",
  "resolution",
  "milestone-splash",
];

const SCREEN_IDS_L2 = [
  "empty-jar-hook",
  "want-vs-need-sort",
  "need-spotlight",
  "budget-wallet",
  "reserve-slider",
  "rank-stack",
  "gift-reveal",
  "milestone-splash",
];

const SCREEN_IDS_L3 = [
  "hook-finish-sentence",
  "spent-triage",
  "spare-vs-spend-tap",
  "spare-cash-first-rank",
  "mia-priority-choice",
  "reflection-word-drop",
  "resolution-bonus",
  "milestone-splash",
];

const SCREEN_IDS_L4 = [
  "skill-spotlight",
  "pause-sequence",
  "rush-vs-think-sort",
  "pressure-sign-tap",
  "check-not-rush",
  "coins-to-piggy",
  "workshop-goal",
  "milestone-splash",
];

const LEAD_CHARACTER = {
  1: "Lars",
  2: "Lars",
  3: "Mia",
  4: "Senna",
};

const STAGE_BY_SCREEN = {
  1: "hook",
  2: "core",
  3: "core",
  4: "core",
  5: "apply",
  6: "apply",
  7: "reward",
  8: "close",
};

const ARCHETYPE_MAP = {
  "the fill-the-blank drop": "word-drop",
  "the sentence finisher": "binary-choice",
  "the flash tap": "tap-reveal",
  "the sorting game": "bucket-sort",
  "the quick choice": "binary-choice",
  "the 24-hour freeze": "hold-to-fill",
  "the celebration": "narrative-bonus",
  "milestone splash page": "completion",
  "the fact finder": "true-false",
  "the stacked sorting triage": "bucket-sort",
  "the pick one / spotlight (3-round challenge)": "spotlight-rounds",
  "the budget balance": "custom:budget-wallet",
  "the allocation slider": "custom:reserve-slider",
  "the sequence stack": "custom:rank-stack",
  "the reveal tap": "custom:gift-reveal",
  "finish the sentence": "binary-choice",
  "triage sorter (standardized engine pattern)": "bucket-sort",
  "multiple choice": "binary-choice",
  "fill-in-the-blanks (drag & drop)": "word-drop",
  "fill-in-the-blank drop": "word-drop",
};

/** Numeric Game Archetype IDs used in L3+ workbook rows (CMS lookup fallback). */
const GAME_ID_TO_TYPE = {
  97: "binary-choice",
  101: "bucket-sort",
  105: "tap-reveal",
  108: "custom:rank-stack",
  111: "binary-choice",
  115: "word-drop",
  118: "narrative-bonus",
  121: "completion",
  52: "completion",
  123: "binary-choice",
  127: "custom:rank-stack",
  131: "bucket-sort",
  135: "tap-reveal",
  139: "binary-choice",
  143: "narrative-bonus",
  146: "narrative-bonus",
  150: "completion",
  151: "completion",
};

const CUSTOM_RENDERER_BY_LESSON = {
  2: {
    "budget-wallet": "m1-l2-budget-wallet",
    "reserve-slider": "m1-l2-reserve-slider",
    "rank-stack": "m1-l2-rank-stack",
    "gift-reveal": "m1-l2-gift-reveal",
  },
  3: {
    "rank-stack": "m1-l2-rank-stack",
  },
};

const SKILL_SLUG = {
  1: { slug: "stop-and-think", name: "Stop & Think", xp: 150, bonus: 50 },
  2: { slug: "put-needs-first", name: "Put Needs First", xp: 100, bonus: 50 },
  3: { slug: "keep-some-aside", name: "Smart Saving", xp: 150, bonus: 50 },
  4: { slug: "stop-and-think", name: "Stop & Think", xp: 150, bonus: 50 },
};

const LESSON_TITLES = {
  1: "Money In, Money Out",
  2: "Needs vs Wants Sort",
  3: "Keep Some Money Aside",
  4: "Pause Under Pressure",
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
      row.push(cell);
      if (row.some((c) => c.trim())) rows.push(row);
      row = [];
      cell = "";
      if (ch === "\r") i += 1;
    } else {
      cell += ch;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((c) => c.trim())) rows.push(row);
  }
  return rows;
}

function loadExplorerCsv(csvPath) {
  const raw = fs.readFileSync(csvPath, "utf8");
  const [header, ...dataRows] = parseCsv(raw).filter((r) => r[0] && !r[0].startsWith("#"));
  const colIndex = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  return dataRows.map((cols) => [
    cols[colIndex.lessonId] ?? "",
    cols[colIndex.screenNumber] ?? "",
    cols[colIndex.objective] ?? "",
    cols[colIndex.gameArchetype] ?? "",
    cols[colIndex.simpleScreenText] ?? "",
    cols[colIndex.theAction] ?? "",
    cols[colIndex.contentForGame] ?? "",
    cols[colIndex.errorMessage] ?? "",
  ]);
}

function loadScaffoldCsv(csvPath) {
  const raw = fs.readFileSync(csvPath, "utf8");
  const [header, ...dataRows] = parseCsv(raw);
  const colIndex = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  return dataRows.map((cols) => [
    cols[colIndex.moduleNumber] ?? "",
    cols[colIndex.lessonNumber] ?? "",
    cols[colIndex.lessonNumber] ?? "",
    cols[colIndex.skillHubId] ?? "",
    cols[colIndex.skillName] ?? "",
    cols[colIndex.learningArc] ?? "",
    cols[colIndex.focus] ?? "",
    cols[colIndex.learningOutcome] ?? "",
    cols[colIndex.conceptTruth] ?? "",
    cols[colIndex.behaviourShift] ?? "",
    cols[colIndex.newPossibility] ?? "",
    cols[colIndex.ruleEnforcement] ?? "",
  ]);
}

// ─── XLSX parsing (inline) ─────────────────────────────────────────────────

function colLettersToIndex(col) {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function parseCellRef(ref) {
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  if (!m) return { col: 0, row: 0 };
  return { col: colLettersToIndex(m[1]), row: Number.parseInt(m[2], 10) - 1 };
}

function decodeXml(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function readSharedStrings(zipDir) {
  const p = path.join(zipDir, "xl/sharedStrings.xml");
  if (!fs.existsSync(p)) return [];
  const xml = fs.readFileSync(p, "utf8");
  const strings = [];
  for (const block of xml.match(/<si>([\s\S]*?)<\/si>/g) ?? []) {
    const parts = [...block.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => decodeXml(x[1]));
    strings.push(parts.join(""));
  }
  return strings;
}

function listSheets(zipDir) {
  const wb = fs.readFileSync(path.join(zipDir, "xl/workbook.xml"), "utf8");
  const rels = fs.readFileSync(path.join(zipDir, "xl/_rels/workbook.xml.rels"), "utf8");
  const relMap = {};
  for (const m of rels.matchAll(/Id="([^"]+)"[^>]+Target="([^"]+)"/g)) {
    relMap[m[1]] = m[2].replace(/^\.\.\//, "xl/");
  }
  const sheets = [];
  for (const m of wb.matchAll(/<sheet[^>]+name="([^"]+)"[^>]+r:id="([^"]+)"/g)) {
    const target = relMap[m[2]] ?? "";
    const file = target.startsWith("xl/") ? target : `xl/${target.replace(/^\.\.\//, "")}`;
    sheets.push({ name: m[1], file });
  }
  return sheets;
}

function readSheetRows(zipDir, sheetFile) {
  const strings = readSharedStrings(zipDir);
  const xml = fs.readFileSync(path.join(zipDir, sheetFile), "utf8");
  const rows = new Map();
  const cellRe = /<c r="([A-Z]+\d+)"([^>]*)>([\s\S]*?)<\/c>/g;
  let m;
  while ((m = cellRe.exec(xml))) {
    const { col, row } = parseCellRef(m[1]);
    const attrs = m[2];
    const inner = m[3];
    let val = "";
    if (attrs.includes('t="s"')) {
      const v = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      val = strings[Number.parseInt(v ?? "0", 10)] ?? "";
    } else if (inner.includes("<is>")) {
      val = [...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => decodeXml(x[1])).join("");
    } else {
      val = decodeXml(inner.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "");
    }
    if (!rows.has(row)) rows.set(row, []);
    const arr = rows.get(row);
    while (arr.length <= col) arr.push("");
    arr[col] = fixEncoding(val.trim());
  }
  return [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r);
}

function fixEncoding(s) {
  return s
    .replace(/ΓÇÖ/g, "'")
    .replace(/ΓÇ£/g, '"')
    .replace(/ΓÇ¥/g, '"')
    .replace(/ΓÇó/g, "•")
    .replace(/ΓÇö/g, "—")
    .replace(/ΓåÆ/g, "→")
    .replace(/≡ƒ[\w\s]+/g, (m) => m)
    .replace(/[^\x00-\x7F]/g, (ch) => {
      const map = { "🟢": "🟢", "🔴": "🔴", "✅": "✅", "❌": "❌" };
      return map[ch] ?? ch;
    });
}

function loadWorkbook(xlsxPath) {
  const tmp = path.join(ROOT, ".tmp-import-xlsx");
  fs.mkdirSync(tmp, { recursive: true });
  const zipCopy = path.join(tmp, `${path.basename(xlsxPath)}.zip`);
  fs.copyFileSync(xlsxPath, zipCopy);
  const dest = path.join(tmp, path.basename(xlsxPath, ".xlsx"));
  fs.mkdirSync(dest, { recursive: true });
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -Path '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force"`,
    { stdio: "pipe" },
  );
  const sheets = listSheets(dest);
  const out = {};
  for (const s of sheets) out[s.name] = readSheetRows(dest, s.file);
  return out;
}

// ─── Content parsers ───────────────────────────────────────────────────────

function normArchetype(raw) {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function authoringFromRow(row, lessonNum, screenNum) {
  return {
    objective: row.objective,
    gameArchetype: row.gameArchetype,
    simpleScreenText: row.simpleScreenText,
    theAction: row.theAction,
    contentForGame: row.contentForGame,
    errorMessage: row.errorMessage,
    pedagogicalStage: STAGE_BY_SCREEN[screenNum],
    screenNumber: screenNum,
    lessonKey: `L${lessonNum}-M1-T1`,
  };
}

function parseRow(cols) {
  return {
    lessonId: cols[0],
    screenNumber: Number.parseFloat(cols[1] ?? "0"),
    objective: cols[2] ?? "",
    gameArchetype: cols[3] ?? "",
    simpleScreenText: cols[4] ?? "",
    theAction: cols[5] ?? "",
    contentForGame: cols[6] ?? "",
    errorMessage: cols[7] ?? "",
  };
}

function stripQuotes(s) {
  return s.replace(/^["']|["']$/g, "").trim();
}

function parseWordDrop(row, id, authoring) {
  const content = row.contentForGame;
  const correct = content.match(/Correct:\s*\[?([^\]\n]+)/i)?.[1]?.trim() ?? "Spent";
  const pool = content.match(/Pool:\s*([^\n]+)/i)?.[1] ?? "Spent, Saved, Hidden";
  const options = pool.replace(/[\[\]]/g, "").split(",").map((p) => p.trim());
  const text = stripQuotes(row.simpleScreenText);
  const parts = text.split("[ ______ ]");
  return {
    type: "word-drop",
    id,
    narrativeBefore: (parts[0] ?? text).trim(),
    narrativeAfter: (parts[1] ?? "right away!").trim(),
    options,
    correctOption: correct.replace(/[\[\]]/g, ""),
    wrongError: stripQuotes(row.errorMessage),
    authoring,
    advance: { mode: "on-complete" },
  };
}

function parseBinaryChoice(row, id, authoring, banner = false) {
  const content = row.contentForGame;
  const green = content.match(/🟢\s*\[?\.\.\.([^\]\n]+)/)?.[1]?.trim()
    ?? content.match(/🟢\s*\[([^\]\n]+)/)?.[1]?.trim()
    ?? content.match(/✅\s*\[Icon\]\s*([^\n]+)/)?.[1]?.trim();
  const red = content.match(/🔴\s*\[?\.\.\.([^\]\n]+)/)?.[1]?.trim()
    ?? content.match(/🔴\s*\[([^\]\n]+)/)?.[1]?.trim()
    ?? content.match(/❌\s*\[Icon\]\s*([^\n]+)/)?.[1]?.trim();
  const correctGreen = content.includes("🟢") || content.includes("✅");
  return {
    type: "binary-choice",
    id,
    prompt: stripQuotes(row.simpleScreenText),
    optionA: { label: green ? `...${green}` : "Option A", isCorrect: correctGreen },
    optionB: { label: red ? `...${red}` : "Option B", isCorrect: !correctGreen },
    wrongError: stripQuotes(row.errorMessage.replace(/^Persistent Error:\s*/i, "")),
    errorStyle: banner ? "banner" : "inline-red",
    authoring,
    advance: { mode: "on-complete" },
  };
}

function parseTrueFalse(row, id, authoring) {
  const falseCorrect = row.contentForGame.includes("🟢") && row.contentForGame.includes("FALSE")
    || row.contentForGame.toUpperCase().includes("FALSE") && row.contentForGame.includes("🟢");
  return {
    type: "true-false",
    id,
    prompt: stripQuotes(row.simpleScreenText),
    correctAnswer: falseCorrect ? "false" : "true",
    wrongError: stripQuotes(row.errorMessage.replace(/^Persistent Error:\s*/i, "")),
    promptLabel: "Fact Finder",
    authoring,
    advance: { mode: "on-complete" },
  };
}

function parseTapReveal(row, id, authoring) {
  const items = [];
  for (const line of row.contentForGame.split("\n")) {
    const m = line.match(/(.+?)──>\s*Flashes (red|green) to (.+?)\./i);
    if (!m) continue;
    const label = m[1].trim();
    const bucket = m[2].toLowerCase() === "red" ? "short" : "long";
    const emojiMatch = label.match(/^(\S+)\s+(.+)$/);
    items.push({
      id: slugify(emojiMatch?.[2] ?? label),
      emoji: emojiMatch?.[1],
      label: emojiMatch?.[2] ?? label,
      bucket,
    });
  }
  return {
    type: "tap-reveal",
    id,
    intro: stripQuotes(row.simpleScreenText),
    tapDisplay: "emoji-label",
    revealDisplay: "emoji-label",
    buckets: [
      { id: "short", label: "Short Fun", tone: "short" },
      { id: "long", label: "More Fun for Longer", tone: "long" },
    ],
    items,
    authoring,
    advance: { mode: "all-taps-revealed" },
  };
}

function parseBucketSort(row, id, authoring, wantNeed = false) {
  const items = [];
  const buckets = wantNeed
    ? [{ id: "want", label: "Things Lars wants" }, { id: "need", label: "Things Lars needs" }]
    : [{ id: "short", label: "Short Fun" }, { id: "long", label: "More Fun for Longer" }];

  if (wantNeed) {
    const cardRe = /\d+\.\s*(.+?)\s*\((Wants|Needs)\)/gi;
    let m;
    const errors = parseBulletErrors(row.errorMessage);
    let i = 0;
    while ((m = cardRe.exec(row.contentForGame))) {
      const label = m[1].trim();
      const bucket = m[2].toLowerCase() === "needs" ? "need" : "want";
      const emojiMatch = label.match(/^(\S+)\s+(.+)$/);
      items.push({
        id: slugify(emojiMatch?.[2] ?? label),
        emoji: emojiMatch?.[1],
        label: emojiMatch?.[2] ?? label,
        bucket,
        wrongDropError: errors[i++] ?? "",
      });
    }
  } else {
    let mode = "short";
    for (const line of row.contentForGame.split("\n")) {
      if (/short fun/i.test(line)) { mode = "short"; continue; }
      if (/more fun for longer/i.test(line)) { mode = "long"; continue; }
      const trimmed = line.trim();
      if (!trimmed) continue;
      const emojiMatch = trimmed.match(/^(\S+)\s+(.+)$/);
      items.push({
        id: slugify(emojiMatch?.[2] ?? trimmed),
        emoji: emojiMatch?.[1],
        label: emojiMatch?.[2] ?? trimmed,
        bucket: mode,
      });
    }
  }

  return {
    type: "bucket-sort",
    id,
    intro: stripQuotes(row.simpleScreenText),
    buckets,
    items,
    authoring,
    advance: { mode: "all-items-sorted" },
  };
}

function parseBulletErrors(raw) {
  return [...raw.matchAll(/•\s*Card \d+:\s*(.+?)(?=\n•|\n\(Tap|$)/gs)].map((m) => m[1].trim());
}

function parseSpotlight(row, id, authoring) {
  const rounds = [];
  const errors = [...row.errorMessage.matchAll(/•\s*Round \d+:\s*(.+?)(?=\n•|\n\(Tap|$)/gs)].map((m) => m[1].trim());
  const chunks = row.contentForGame.split(/Round \d+:/i).slice(1);
  chunks.forEach((chunk, i) => {
    const wrong = chunk.match(/❌\s*\[Icon\]\s*([^\n]+)/)?.[1]?.trim();
    const right = chunk.match(/✅\s*\[Icon\]\s*([^\n]+)/)?.[1]?.trim();
    if (!wrong || !right) return;
    rounds.push({
      iconA: "⬜",
      optionA: wrong,
      iconB: "⬜",
      optionB: right,
      correct: "b",
      error: errors[i] ?? "Try again!",
    });
  });
  return {
    type: "spotlight-rounds",
    id,
    prompt: stripQuotes(row.simpleScreenText),
    rounds,
    authoring,
    advance: { mode: "spotlight-rounds-complete" },
  };
}

function parseHold(row, id, authoring) {
  const btn =
    row.contentForGame.match(/Button:\s*\[([^\]]+)\]/i)?.[1]
    ?? row.contentForGame.match(/\[([^\]]+)\]/)?.[1]
    ?? "HOLD";
  const success =
    row.contentForGame.match(/SUCCESS:\s*(.+)/i)?.[1]?.trim()
    ?? "Success! Lars has to wait 24 hours.";
  return {
    type: "hold-to-fill",
    id,
    narrative: stripQuotes(row.simpleScreenText),
    holdLabel: btn,
    frozenLabel: row.contentForGame.includes("FREEZE") ? "❄️ FROZEN ❄️" : "FROZEN",
    successMessage: success,
    clearOnSuccess: false,
    holdDurationMs: 2000,
    releaseHint: stripQuotes(row.errorMessage),
    authoring,
    advance: { mode: "on-complete" },
  };
}

function parseCelebration(row, id, authoring) {
  const bonus = /50\s*xp|bonus\s*50|50xp/i.test(row.simpleScreenText) ? 50 : 0;
  const text = stripQuotes(row.simpleScreenText.split("\n")[0]);
  return {
    type: "narrative-bonus",
    id,
    narrative: text,
    bonusXp: bonus,
    bonusTapLabel: bonus > 0 ? `[ COLLECT ${bonus} XP BONUS ]` : "",
    autoReadyWhenNoBonus: bonus === 0,
    authoring,
    advance: { mode: bonus > 0 ? "on-complete" : "auto-ready" },
  };
}

function parseCompletion(row, id, authoring) {
  return {
    type: "completion",
    id,
    useStandardPane: true,
    authoring,
    advance: { mode: "manual-next" },
  };
}

function parseCustom(row, id, renderer, authoring, advance, configRef) {
  return {
    type: "custom",
    id,
    renderer,
    configRef: configRef ?? id,
    authoring,
    advance,
  };
}

const CUSTOM_CONFIG_REF = {
  "budget-wallet": "budget",
  "reserve-slider": "reserve",
  "rank-stack": "rank",
  "gift-reveal": "gift",
  sequence: "sequence",
};

function decodeHtml(s) {
  return String(s)
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function resolveInternalType(row, lessonNum, screenNum) {
  const archetype = normArchetype(row.gameArchetype);
  if (ARCHETYPE_MAP[archetype]) return ARCHETYPE_MAP[archetype];
  if (/^\d+$/.test(archetype) && GAME_ID_TO_TYPE[Number(archetype)]) {
    return GAME_ID_TO_TYPE[Number(archetype)];
  }

  const action = decodeHtml(row.theAction).toLowerCase();
  if (action.includes("finish the sentence")) return "binary-choice";
  if (action.includes("triage sorter")) return "bucket-sort";
  if (action.includes("multiple choice")) return "binary-choice";
  if (action.includes("fill-in-the-blank")) return "word-drop";
  if (action.includes("choose the correct answer")) return "binary-choice";
  if (action.includes("sequencer") || action.includes("chronological order")) {
    return "custom:rank-stack";
  }
  if (action.includes("thought bubble") || action.includes("bucket")) {
    return "bucket-sort";
  }
  if (action.includes("taps each of the three lines")) return "tap-reveal";
  if (action.includes("clickable buttons")) return "binary-choice";
  if (action.includes("swipe and move")) return "narrative-bonus";
  if (action.includes("progress bar") || action.includes("meter")) {
    return "narrative-bonus";
  }
  if (screenNum === 8) return "completion";
  if (Number(archetype) === 105) return "tap-reveal";
  if (Number(archetype) === 108) return "custom:rank-stack";
  if (Number(archetype) === 118 || Number(archetype) === 146) {
    return "narrative-bonus";
  }

  return null;
}

function parseBulletLines(content) {
  return content
    .split("\n")
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

function parseConceptTruthChoice(row, id, authoring, defaultPrompt) {
  const content = decodeHtml(row.contentForGame);
  const options = [...content.matchAll(/\[([^\]]+)\]\s*\((The Trap|The Concept Truth)\)/gi)].map(
    (m) => ({ label: m[1].trim(), kind: m[2].toLowerCase() }),
  );
  const correct = options.find((o) => o.kind.includes("concept truth"));
  const wrong = options.find((o) => o.kind.includes("trap"));
  const err = decodeHtml(row.errorMessage);
  const wrongErr =
    err.match(/If #1 or #3:\s*"([^"]+)"/i)?.[1]
    ?? err.match(/If submitted incorrect[^:]*:\s*"([^"]+)"/i)?.[1]
    ?? err.split("\n").find((l) => l.includes("trap"))?.replace(/^[^"]*"([^"]+)".*$/, "$1")
    ?? "Try again!";

  return {
    type: "binary-choice",
    id,
    prompt: stripQuotes(decodeHtml(row.simpleScreenText)) || defaultPrompt,
    optionA: { label: correct?.label ?? "Smart choice", isCorrect: true },
    optionB: { label: wrong?.label ?? "Risky choice", isCorrect: false },
    wrongError: wrongErr,
    errorStyle: "inline-red",
    authoring,
    advance: { mode: "on-complete" },
  };
}

function parseL3Screen1(row, id, authoring) {
  const bullets = parseBulletLines(decodeHtml(row.contentForGame));
  const correct = bullets[0] ?? "Mia has no money to buy a new pair";
  const wrong = bullets[1] ?? "Mia tries to fix them with sticky tape";
  const err = decodeHtml(row.errorMessage);
  const wrongErr = err.match(/incorrect answer:\s*"([^"]+)"/i)?.[1]
    ?? "Haha, maybe. But let's try again";

  return {
    type: "binary-choice",
    id,
    prompt:
      stripQuotes(decodeHtml(row.simpleScreenText))
      || "Mia borrowed her sister's headphones and broke them. What happened next?",
    optionA: { label: correct, isCorrect: true },
    optionB: { label: wrong, isCorrect: false },
    wrongError: wrongErr,
    errorStyle: "inline-red",
    authoring,
    advance: { mode: "on-complete" },
  };
}

function parseL3Screen2(row, id, authoring) {
  const content = decodeHtml(row.contentForGame);
  const itemSpecs = [
    { id: "squishy", emoji: "🧸", label: "Squishy toy ($25)", price: 25 },
    { id: "slime", emoji: "🫧", label: "Slime tub ($8)", price: 8 },
    { id: "snacks", emoji: "🍫", label: "Snacks ($7)", price: 7 },
  ];
  const popupMsg = content.match(/pop up shows the message:\s*"([^"]+)"/i)?.[1]
    ?? decodeHtml(row.errorMessage).match(/"([^"]+)"/)?.[1]
    ?? "Mia has no money left to pay for new headphones";

  return {
    type: "bucket-sort",
    id,
    intro:
      stripQuotes(decodeHtml(row.simpleScreenText))
      || "Mia had $40. Drag each purchase into Spent to see what's left for her sister's headphones.",
    buckets: [{ id: "spent", label: "Spent" }],
    items: itemSpecs.map((item) => ({ ...item, bucket: "spent" })),
    successMessage: popupMsg,
    authoring,
    advance: { mode: "all-items-sorted" },
  };
}

function parseL3Screen3(row, id, authoring) {
  return {
    type: "tap-reveal",
    id,
    intro:
      stripQuotes(decodeHtml(row.simpleScreenText))
      || "Mia spent everything on fun stuff. Tap each idea — Spare Cash thinking or Spend-Everything thinking?",
    tapDisplay: "emoji-label",
    revealDisplay: "emoji-label",
    buckets: [
      { id: "spare", label: "Spare Cash", tone: "long" },
      { id: "spend", label: "Spend Everything", tone: "short" },
    ],
    items: [
      { id: "aside", emoji: "🎧", label: "Set $20 aside for headphones", bucket: "spare" },
      { id: "squishy", emoji: "🧸", label: "Buy another squishy toy", bucket: "spend" },
      { id: "save-first", emoji: "💡", label: "Save before spending on fun", bucket: "spare" },
      { id: "snacks", emoji: "🍫", label: "Spend every last dollar on snacks", bucket: "spend" },
    ],
    authoring,
    advance: { mode: "all-taps-revealed" },
  };
}

function parseL3Screen6(row, id, authoring) {
  const content = decodeHtml(row.contentForGame);
  return {
    type: "word-drop",
    id,
    narrativeBefore: "Because I didn't",
    narrativeAfter:
      "everything, I had Spare Cash to replace the headphones immediately.",
    options: ["spend", "save"],
    correctOption: "spend",
    wrongError:
      decodeHtml(row.errorMessage).replace(/^\d+\s*$/, "").trim()
      || "Think about what Mia did — she didn't use all her money.",
    authoring,
    advance: { mode: "on-complete" },
  };
}

function parseL3Screen7(row, id, authoring) {
  const narrative =
    decodeHtml(row.errorMessage).split("\n").find((l) => l.length > 20)
    ?? "Exactly! Keeping some money means you're in charge.";
  return {
    type: "narrative-bonus",
    id,
    narrative,
    bonusXp: /50\s*xp|bonus\s*50/i.test(row.simpleScreenText) ? 50 : 50,
    bonusTapLabel: "[ COLLECT 50 XP BONUS ]",
    autoReadyWhenNoBonus: false,
    authoring,
    advance: { mode: "on-complete" },
  };
}

function parseL4Screen1(row, id, authoring) {
  const content = decodeHtml(row.contentForGame);
  const options = [...content.matchAll(/Option ([ABC]):\s*"([^"]+)"\s*\((Correct|Wrong)\)/gi)];
  const correct = options.find((o) => o[3].toLowerCase() === "correct");
  const wrong = options.find((o) => o[3].toLowerCase() === "wrong");
  const err = decodeHtml(row.errorMessage);
  return {
    type: "binary-choice",
    id,
    prompt:
      stripQuotes(decodeHtml(row.simpleScreenText))
      || "What skill is Senna practicing?",
    optionA: { label: correct?.[2] ?? "Senna stops to think.", isCorrect: true },
    optionB: { label: wrong?.[2] ?? "Senna has run out of money.", isCorrect: false },
    wrongError: err.match(/^B\s*-(.+)/m)?.[1]?.trim() ?? "Not quite — look for what Senna chooses to do.",
    errorStyle: "inline-red",
    authoring,
    advance: { mode: "on-complete" },
  };
}

function parseL4Screen2(row, id, authoring) {
  return parseCustom(
    row,
    id,
    "m1-l2-rank-stack",
    authoring,
    {
      mode: "validate-on-next",
      rules: [{
        kind: "rank-order",
        correctOrder: ["see-offer", "remember", "wait", "buy-if-cheaper"],
      }],
    },
    "rank",
  );
}

function parseL4Screen3(row, id, authoring) {
  const content = decodeHtml(row.contentForGame);
  const items = [];
  for (const line of content.split("\n")) {
    const m = line.match(/"([^"]+)"\s*\(Bucket ([AB])\)/i);
    if (!m) continue;
    items.push({
      id: slugify(m[1]),
      label: m[1],
      bucket: m[2].toUpperCase() === "B" ? "think" : "rush",
    });
  }
  return {
    type: "bucket-sort",
    id,
    intro:
      stripQuotes(decodeHtml(row.simpleScreenText))
      || "Sort each thought — is Senna rushing or thinking?",
    buckets: [
      { id: "rush", label: "I'm Rushing" },
      { id: "think", label: "I'm Thinking" },
    ],
    items,
    authoring,
    advance: { mode: "all-items-sorted" },
  };
}

function parseL4Screen4(row, id, authoring) {
  const content = decodeHtml(row.contentForGame);
  const lines = [...content.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  return {
    type: "tap-reveal",
    id,
    intro:
      stripQuotes(decodeHtml(row.simpleScreenText))
      || "Tap the parts of the sign that are making Lars rush.",
    tapDisplay: "label",
    revealDisplay: "label",
    buckets: [
      { id: "pressure", label: "Pressure tricks", tone: "short" },
      { id: "neutral", label: "Just info", tone: "long" },
    ],
    items: lines.map((label, i) => ({
      id: slugify(label),
      label,
      bucket: /don't miss|only \d|ends tomorrow/i.test(label) ? "pressure" : "neutral",
    })),
    authoring,
    advance: { mode: "all-taps-revealed" },
  };
}

function parseL4Screen5(row, id, authoring) {
  const content = decodeHtml(row.contentForGame);
  const checks = [...content.matchAll(/\[Check\]\s*"([^"]+)"/gi)].map((m) => m[1]);
  const dud = content.match(/\[Dud\]\s*"([^"]+)"/i)?.[1] ?? "CLICK HERE TO BUY NOW!";
  return {
    type: "binary-choice",
    id,
    prompt:
      stripQuotes(decodeHtml(row.simpleScreenText))
      || "Which question helps Senna pause before buying?",
    optionA: { label: checks[1] ?? checks[0] ?? "Do I really want this now?", isCorrect: true },
    optionB: { label: dud, isCorrect: false },
    wrongError:
      decodeHtml(row.errorMessage).match(/"([^"]+)"/)?.[1]
      ?? "Caught you! That button is trying to do the thinking for you.",
    errorStyle: "inline-red",
    authoring,
    advance: { mode: "on-complete" },
  };
}

function parseL4Screen6(row, id, authoring) {
  return {
    type: "narrative-bonus",
    id,
    narrative:
      stripQuotes(decodeHtml(row.simpleScreenText))
      || "Drag your coins into the piggy bank — saving beats rushing every time.",
    bonusXp: 0,
    bonusTapLabel: "",
    autoReadyWhenNoBonus: true,
    authoring,
    advance: { mode: "auto-ready" },
  };
}

function parseL4Screen7(row, id, authoring) {
  const content = decodeHtml(row.contentForGame);
  const items = content.match(/"([^"$]+)\s*\$?\d+/g)?.join(", ") ?? content;
  return {
    type: "narrative-bonus",
    id,
    narrative:
      `Senna saved up for the Wheelie Workshop! ${items}`.trim()
      || decodeHtml(row.errorMessage),
    bonusXp: 50,
    bonusTapLabel: "[ COLLECT 50 XP BONUS ]",
    autoReadyWhenNoBonus: false,
    authoring,
    advance: { mode: "on-complete" },
  };
}

function buildL3Screen(row, screenNum, screenId, authoring) {
  switch (screenNum) {
    case 1: return parseL3Screen1(row, screenId, authoring);
    case 2: return parseL3Screen2(row, screenId, authoring);
    case 3: return parseL3Screen3(row, screenId, authoring);
    case 4:
      return parseCustom(
        row,
        screenId,
        "m1-l2-rank-stack",
        authoring,
        {
          mode: "validate-on-next",
          rules: [{ kind: "rank-order", correctOrder: ["spare", "fun", "all"] }],
        },
        "rank",
      );
    case 5:
      return parseConceptTruthChoice(
        row,
        screenId,
        authoring,
        "What should Mia do?",
      );
    case 6: return parseL3Screen6(row, screenId, authoring);
    case 7: return parseL3Screen7(row, screenId, authoring);
    case 8: return parseCompletion(row, screenId, authoring);
    default: return parseCompletion(row, screenId, authoring);
  }
}

function buildL4Screen(row, screenNum, screenId, authoring) {
  switch (screenNum) {
    case 1: return parseL4Screen1(row, screenId, authoring);
    case 2: return parseL4Screen2(row, screenId, authoring);
    case 3: return parseL4Screen3(row, screenId, authoring);
    case 4: return parseL4Screen4(row, screenId, authoring);
    case 5: return parseL4Screen5(row, screenId, authoring);
    case 6: return parseL4Screen6(row, screenId, authoring);
    case 7: return parseL4Screen7(row, screenId, authoring);
    case 8: return parseCompletion(row, screenId, authoring);
    default: return parseCompletion(row, screenId, authoring);
  }
}

function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "item";
}

function buildScreen(row, lessonNum, screenNum, screenId) {
  const authoring = authoringFromRow(row, lessonNum, screenNum);
  const enriched = {
    ...row,
    simpleScreenText: decodeHtml(row.simpleScreenText),
    theAction: decodeHtml(row.theAction),
    contentForGame: decodeHtml(row.contentForGame),
    errorMessage: decodeHtml(row.errorMessage),
    objective: decodeHtml(row.objective),
    gameArchetype: decodeHtml(row.gameArchetype),
  };

  if (lessonNum === 3) {
    return buildL3Screen(enriched, screenNum, screenId, authoring);
  }
  if (lessonNum === 4) {
    return buildL4Screen(enriched, screenNum, screenId, authoring);
  }

  const archetype = normArchetype(enriched.gameArchetype);
  const internal = resolveInternalType(enriched, lessonNum, screenNum);

  if (!internal) {
    return {
      type: "narrative-bonus",
      id: screenId,
      narrative: `[Draft — content TBD for ${enriched.gameArchetype}]`,
      bonusXp: 0,
      bonusTapLabel: "",
      autoReadyWhenNoBonus: true,
      authoring,
      advance: { mode: "auto-ready" },
    };
  }

  if (internal === "word-drop") return parseWordDrop(enriched, screenId, authoring);
  if (internal === "binary-choice") {
    return parseBinaryChoice(enriched, screenId, authoring, archetype.includes("quick"));
  }
  if (internal === "true-false") return parseTrueFalse(enriched, screenId, authoring);
  if (internal === "tap-reveal") return parseTapReveal(enriched, screenId, authoring);
  if (internal === "bucket-sort") {
    return parseBucketSort(enriched, screenId, authoring, lessonNum === 2 && screenNum === 2);
  }
  if (internal === "spotlight-rounds") return parseSpotlight(enriched, screenId, authoring);
  if (internal === "hold-to-fill") return parseHold(enriched, screenId, authoring);
  if (internal === "narrative-bonus") return parseCelebration(enriched, screenId, authoring);
  if (internal === "completion") return parseCompletion(enriched, screenId, authoring);

  if (internal.startsWith("custom:")) {
    const rendererKey = internal.split(":")[1];
    const renderer =
      CUSTOM_RENDERER_BY_LESSON[lessonNum]?.[rendererKey] ?? rendererKey;
    const configRef = CUSTOM_CONFIG_REF[rendererKey] ?? screenId;
    const advanceRules = {
      "budget-wallet": {
        mode: "validate-on-next",
        rules: [{
          kind: "budget-wallet",
          correctIds: ["bus", "cable"],
          maxTotal: 30,
          errors: {
            overBudget: "Uncheck the item you don't really 'need'.",
            missingCable: "Wait! Your phone is dead without that cable.",
            missingBus: "Hold up! You're stranded at school without that Bus Pass.",
          },
        }],
      },
      "reserve-slider": {
        mode: "validate-on-next",
        rules: [{ kind: "reserve-slider", targetMin: 20, total: 25 }],
      },
      "rank-stack": {
        mode: "validate-on-next",
        rules: [{ kind: "rank-order", correctOrder: ["keep", "cheaper", "borrow"] }],
      },
      "gift-reveal": { mode: "on-complete" },
    };
    return parseCustom(
      enriched,
      screenId,
      renderer,
      authoring,
      advanceRules[rendererKey] ?? { mode: "on-complete" },
      configRef,
    );
  }

  return parseCompletion(enriched, screenId, authoring);
}

function parseScaffoldLesson(scaffoldRows, lessonNum) {
  const row = scaffoldRows.find((r) => r[2] === String(lessonNum) || r[2] === `${lessonNum}.0`);
  if (!row) return {};
  return {
    skillHubId: row[3],
    skillName: row[4],
    learningArc: row[5],
    focus: row[6],
    learningOutcome: row[7],
    conceptTruth: row[8],
    behaviourShift: row[9],
    newPossibility: row[10],
    ruleEnforcement: row[11],
  };
}

function buildLessonDefinition(lessonNum, screens, scaffold, draft = false) {
  const skill = SKILL_SLUG[lessonNum];
  const title = LESSON_TITLES[lessonNum];
  const lead = LEAD_CHARACTER[lessonNum] ?? "Lars";
  const custom =
    lessonNum === 2 ? M1_L2_CUSTOM_BAG
    : lessonNum === 3 ? M1_L3_CUSTOM_BAG
    : lessonNum === 4 ? M1_L4_CUSTOM_BAG
    : undefined;

  return {
    meta: {
      milestoneId: lessonNum,
      levelId: 1,
      lessonNumber: lessonNum,
      moduleTitle: "Module 1",
      lessonTitle: title,
      shellLabel: `Module 1 · Lesson ${lessonNum} · ${title}`,
      totalScreens: 8,
      lessonKey: `L${lessonNum}-M1-T1`,
      skillName: scaffold.skillName ?? skill.name,
      skillHubId: scaffold.skillHubId,
      learningOutcome: scaffold.learningOutcome,
      conceptTruth: scaffold.conceptTruth,
      behaviourShift: scaffold.behaviourShift,
      ruleEnforcement: scaffold.ruleEnforcement,
      learningArc: scaffold.learningArc,
      focus: scaffold.focus,
      characters: {
        lead,
        support: lessonNum === 3 ? "Sister" : "Senna",
        explorer: lead,
        pathfinder: "Holly",
        maverick: "Dash",
      },
    },
    rewards: {
      skillSlug: skill.slug,
      achievementSkillSlug: skill.slug,
      xpReward: skill.xp,
      perfectStreakBonus: skill.bonus,
    },
    custom,
    baseScreens: screens,
    byCohort: {
      explorer: { characterName: lead },
      pathfinder: { characterName: "Holly", rewards: { xpReward: 50, perfectStreakBonus: 0 } },
      maverick: { characterName: "Dash", rewards: { xpReward: 50, perfectStreakBonus: 0 } },
    },
    _draft: draft,
  };
}

const M1_L2_CUSTOM_BAG = {
  budget: {
    total: 30,
    intro: "You have $30 left. Check the boxes to buy what you actually need.",
    walletLabel: "Digital Wallet",
    items: [
      { id: "bus", label: "🚍 Bus Pass ($15)", price: 15 },
      { id: "drink", label: "⚡ Energy Drink ($10)", price: 10 },
      { id: "cable", label: "🔌 Phone Cable ($15)", price: 15 },
    ],
    correctIds: ["bus", "cable"],
    errors: {
      overBudget: "Uncheck the item you don't really 'need'.",
      missingCable: "Wait! Your phone is dead without that cable. Uncheck the drink and secure your phone lifeline!",
      missingBus: "Hold up! You're stranded at school without that Bus Pass. Swap out the drink for a ride home!",
      wrongSelection: "Uncheck the item you don't really 'need'.",
    },
  },
  reserve: {
    total: 25,
    target: 20,
    energyDrinkPrice: 10,
    intro: "Lars has $25 total. He needs $20 next week for his brother's phone case. Help him put the money aside so he doesn't spend it. Slide the divider to secure that money now.",
    phoneCaseLabel: "Phone Case",
    phoneCaseAmount: 20,
    energyDrinkLabel: "Energy Drink",
    energyDrinkAmount: 10,
    sliderError: "Not quite! If you leave less than $20 in the reserve, you won't have enough to buy your brother's gift next week. Slide the line to protect the full $20!",
  },
  rank: {
    intro: "Drag the choices in the correct order, starting with what would be best for Lars to do.",
    dragHint: "Drag the choices in the correct order, starting with what would be best for Lars to do.",
    axisLabel: "Best → Avoid",
    submitLabel: "Submit Answer",
    successMessage: "Perfect sequence! Keeping the $5 safe first, then only spending what you have left without borrowing money is correct.",
    items: [
      { id: "keep", label: "Don't buy anything - keep the $5." },
      { id: "cheaper", label: "Choose something cheaper for $5 to enjoy now." },
      { id: "borrow", label: "Borrow $5 from dad to buy the $10 bottle." },
    ],
    correctOrder: ["keep", "cheaper", "borrow"],
    errors: {
      borrow: "Not quite! Borrowing money creates debt — put this option at the bottom.",
      cheaperTop: "Not quite! There's a better option to choose first.",
    },
  },
  gift: {
    intro: "Fast forward to next week! Tap the gift box to help Lars deliver his promise to Senna.",
    characterLeft: { emoji: "🧑", label: "Lars" },
    characterRight: { emoji: "🧒", label: "Senna" },
    revealMessage: "Lesson Complete! By securing your needs before spending on temporary wants, you ensure your promises are always safe and your goals are reached.",
  },
};

const M1_L3_CUSTOM_BAG = {
  rank: {
    intro: "Drag the choices in the correct order — Spare Cash first, then fun!",
    dragHint: "Spare Cash first, then fun. What would Mia do best?",
    axisLabel: "Best → Avoid",
    submitLabel: "Submit Answer",
    successMessage: "Perfect! Spare Cash first, then fun. You're ready for anything!",
    items: [
      { id: "spare", label: "Set aside Spare Cash for the headphones first" },
      { id: "fun", label: "Spend what's left on small treats" },
      { id: "all", label: "Spend everything on fun stuff right away" },
    ],
    correctOrder: ["spare", "fun", "all"],
    errors: {
      all: "Not quite! Spending everything first leaves no Spare Cash — put that at the bottom.",
      fun: "Not quite! Setting aside Spare Cash comes first.",
    },
  },
};

const M1_L4_CUSTOM_BAG = {
  sequence: {
    intro: "Put Senna's pause steps in the right order.",
    dragHint: "Drag each step into the order Senna should follow.",
    axisLabel: "First → Last",
    submitLabel: "Submit Answer",
    successMessage: "Perfect! He didn't rush in, he checked the price, and he stayed in control of his own cash.",
    items: [
      { id: "see-offer", label: "Senna sees the Limited Time offer." },
      { id: "remember", label: "He stops and remembers the price might drop later." },
      { id: "wait", label: "He waits two days to check the price again." },
      {
        id: "buy-if-cheaper",
        label: "Senna only buys it if the price is cheaper and he still wants it.",
      },
    ],
    correctOrder: ["see-offer", "remember", "wait", "buy-if-cheaper"],
    errors: {
      "buy-if-cheaper": "Not quite! Senna checks the price before buying — that step comes later.",
      wait: "Not quite! Remembering to pause comes before waiting.",
    },
  },
  rank: {
    intro: "Put Senna's pause steps in the right order.",
    dragHint: "Drag each step into the order Senna should follow.",
    axisLabel: "First → Last",
    submitLabel: "Submit Answer",
    successMessage: "Perfect! He didn't rush in, he checked the price, and he stayed in control of his own cash.",
    items: [
      { id: "see-offer", label: "Senna sees the Limited Time offer." },
      { id: "remember", label: "He stops and remembers the price might drop later." },
      { id: "wait", label: "He waits two days to check the price again." },
      {
        id: "buy-if-cheaper",
        label: "Senna only buys it if the price is cheaper and he still wants it.",
      },
    ],
    correctOrder: ["see-offer", "remember", "wait", "buy-if-cheaper"],
    errors: {
      "buy-if-cheaper": "Not quite! Senna checks the price before buying — that step comes later.",
      wait: "Not quite! Remembering to pause comes before waiting.",
    },
  },
};

function draftScreensFromScaffold(lessonNum, scaffold) {
  const ids = lessonNum <= 2 ? (lessonNum === 1 ? SCREEN_IDS_L1 : SCREEN_IDS_L2) : SCREEN_IDS_L1.map((id) => `${id}-l${lessonNum}`);
  const archetypes = [
    "The Fill-the-Blank Drop",
    "The Sentence Finisher",
    "The Flash Tap",
    "The Sorting Game",
    "The Quick Choice",
    "The 24-Hour Freeze",
    "The Celebration",
    "Milestone Splash Page",
  ];
  return ids.map((id, i) => {
    const screenNum = i + 1;
    if (screenNum === 8) {
      return {
        type: "completion",
        id: "milestone-splash",
        useStandardPane: true,
        authoring: {
          objective: `${STAGE_BY_SCREEN[screenNum]} stage`,
          gameArchetype: archetypes[i],
          simpleScreenText: "",
          pedagogicalStage: STAGE_BY_SCREEN[screenNum],
          screenNumber: screenNum,
          lessonKey: `L${lessonNum}-M1-T1`,
        },
        advance: { mode: "manual-next" },
      };
    }
    return {
      type: "narrative-bonus",
      id,
      narrative: `[Draft L${lessonNum} Screen ${screenNum}] ${scaffold.focus ?? "TBD"} — ${scaffold.learningOutcome ?? ""}`.trim(),
      bonusXp: 0,
      bonusTapLabel: "",
      autoReadyWhenNoBonus: true,
      authoring: {
        objective: `${STAGE_BY_SCREEN[screenNum]} stage`,
        gameArchetype: archetypes[i],
        simpleScreenText: "",
        pedagogicalStage: STAGE_BY_SCREEN[screenNum],
        screenNumber: screenNum,
        lessonKey: `L${lessonNum}-M1-T1`,
      },
      advance: { mode: "auto-ready" },
    };
  });
}

function serializeTs(definition, exportName) {
  return `/* AUTO-GENERATED from Explorer workbook — npm run lesson:import:explorer */

import type { CohortLessonDefinition } from "@/lib/academy/lessons/types";

export const ${exportName}: CohortLessonDefinition = ${JSON.stringify(definition, null, 2)} as const;
`;
}

// ─── Main ──────────────────────────────────────────────────────────────────

function main() {
  const explorerPath = process.argv[2] ?? DEFAULT_EXPLORER_XLSX;
  const scaffoldPath = DEFAULT_SCAFFOLD_XLSX;

  let explorerRows;
  let scaffoldRows;

  if (fs.existsSync(explorerPath) && explorerPath.toLowerCase().endsWith(".xlsx")) {
    console.log("Reading workbook:", explorerPath);
    const explorerWb = loadWorkbook(explorerPath);
    explorerRows = (explorerWb["Explorer Phase 1"] ?? []).slice(1);
    scaffoldRows = fs.existsSync(scaffoldPath)
      ? (loadWorkbook(scaffoldPath)["Lesson Scaffold"] ?? [])
      : [];
  } else if (fs.existsSync(BUNDLED_EXPLORER_CSV)) {
    console.warn("Workbook not found — using bundled CSV:", BUNDLED_EXPLORER_CSV);
    explorerRows = loadExplorerCsv(BUNDLED_EXPLORER_CSV);
    scaffoldRows = fs.existsSync(BUNDLED_SCAFFOLD_CSV)
      ? loadScaffoldCsv(BUNDLED_SCAFFOLD_CSV)
      : [];
  } else {
    console.error("Explorer workbook not found:", explorerPath);
    console.error("Bundled CSV missing:", BUNDLED_EXPLORER_CSV);
    process.exit(1);
  }

  const outDir = path.join(ROOT, "lib/academy/lessons/content/data/explorer");
  fs.mkdirSync(outDir, { recursive: true });

  for (let lessonNum = 1; lessonNum <= 4; lessonNum += 1) {
    const block = explorerRows.slice((lessonNum - 1) * 8, lessonNum * 8);
    const screenIds =
      lessonNum === 1 ? SCREEN_IDS_L1
      : lessonNum === 2 ? SCREEN_IDS_L2
      : lessonNum === 3 ? SCREEN_IDS_L3
      : SCREEN_IDS_L4;
    const scaffold = parseScaffoldLesson(scaffoldRows, lessonNum);
    const isDraft = block.length < 8;

    let screens;
    if (isDraft) {
      screens = draftScreensFromScaffold(lessonNum, scaffold);
    } else {
      screens = block.map((cols, i) => {
        const row = parseRow(cols);
        return buildScreen(row, lessonNum, i + 1, screenIds[i]);
      });
    }

    const definition = buildLessonDefinition(lessonNum, screens, scaffold, isDraft);
    const suffix = isDraft ? ".draft" : "";
    const jsonPath = path.join(outDir, `m1-l${lessonNum}${suffix}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(definition, null, 2), "utf8");

    const tsName = isDraft ? `M1_L${lessonNum}_DRAFT_DEFINITION` : `M1_L${lessonNum}_EXPLORER_DEFINITION`;
    const tsPath = path.join(outDir, `m1-l${lessonNum}${suffix}.ts`);
    fs.writeFileSync(tsPath, serializeTs(definition, tsName), "utf8");

    console.log(`✓ Lesson ${lessonNum}${isDraft ? " (draft)" : ""}: ${jsonPath}`);
  }

  console.log("\nNext: wire JSON into registry or merge authoring into live m1-l1.ts / m1-l2.ts");
}

main();
