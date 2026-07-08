#!/usr/bin/env node
/**
 * Spreadsheet → lesson content file
 * Usage: npm run lesson:import -- path/to/folder
 *
 * Folder needs: Lesson-Details.csv + Screens.csv
 * Optional reference: Characters.csv, Game-Types.csv
 */

import fs from "node:fs";
import path from "node:path";

const SCREEN_IDS = {
  1: "hook-word-drop",
  2: "short-fun-reality",
  3: "tap-short-vs-long",
  4: "sort-short-vs-long",
  5: "countdown-trap",
  6: "impulse-pause",
  7: "resolution",
  8: "milestone-splash",
};

const GAME_TYPE_MAP = {
  "word drop": "word-drop",
  "word bank rule": "word-drop",
  "two choices": "binary-choice",
  "standard quiz": "binary-choice",
  "true false": "true-false",
  "true / false": "true-false",
  "tap to reveal": "tap-reveal",
  "drag sort": "bucket-sort",
  "triage sorter": "bucket-sort",
  "speed choice": "binary-choice",
  "quick trap": "binary-choice",
  "scenario fork": "binary-choice",
  "narrative branch": "binary-choice",
  "pick one rounds": "spotlight-rounds",
  "hold button": "hold-to-fill",
  celebration: "narrative-bonus",
  "lesson complete": "completion",
  "tap pairs": "custom",
  "pair matcher": "custom",
  "pipeline leak monitor": "custom",
  "the pipeline leak monitor": "custom",
  "budget checkboxes": "custom",
  "budget slider": "custom",
  "rank choices": "custom",
  "priority ranker": "custom",
  "gift reveal": "custom",
  "balance scale": "custom",
  "the balance scale": "custom",
  "hotspot hunter": "custom",
  "error eliminator": "custom",
  "cash allocation splitter": "custom",
  "the cash allocation splitter": "custom",
  "market clock": "custom",
  "the market clock": "custom",
  "volatility clock": "custom",
  "the volatility clock": "custom",
  "tax routing pipeline": "custom",
  "the tax routing pipeline": "custom",
  "flowchart builder": "custom",
  "scalable curve engine": "custom",
  "the scalable curve engine": "custom",
  "value accumulator": "custom",
  "map explorer": "custom",
};

const CUSTOM_RENDERER = {
  "tap pairs": "tap-pairs",
  "pipeline leak monitor": "pipeline-leak",
  "budget checkboxes": "m1-l2-budget-wallet",
  "budget slider": "m1-l2-reserve-slider",
  "rank choices": "m1-l2-rank-stack",
  "gift reveal": "m1-l2-gift-reveal",
  "balance scale": "balance-scale",
  "hotspot hunter": "hotspot-hunter",
  "error eliminator": "error-eliminator",
  "cash allocation splitter": "cash-allocation",
  "market clock": "market-clock",
  "volatility clock": "volatility-clock",
  "tax routing pipeline": "tax-routing-pipeline",
  "flowchart builder": "tax-routing-pipeline",
  "scalable curve engine": "scalable-curve-engine",
  "value accumulator": "value-accumulator",
  "map explorer": "map-explorer",
};

const EMOJI_RE = /^(\p{Extended_Pictographic}+\uFE0F?)\s*(.*)$/u;

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
      } else if (ch === '"') inQuotes = false;
      else cell += ch;
      continue;
    }
    if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell.trim());
      if (row.some((v) => v.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((v) => v.length > 0)) rows.push(row);
  }
  return rows;
}

function readCsvFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "");
  const rows = parseCsv(text);
  if (!rows.length) return { headers: [], records: [] };
  const [headers, ...records] = rows;
  return { headers, records };
}

function readDetails(folder) {
  const { records } = readCsvFile(path.join(folder, "Lesson-Details.csv"));
  const details = {};
  for (const row of records) {
    if (row[0]) details[row[0]] = row[1] ?? "";
  }
  return normalizeDetails(details);
}

/** Accept new + legacy field names; fill character defaults. */
function normalizeDetails(details) {
  const pathfinder =
    details["Pathfinder Character"] ||
    details["Lead Character"] ||
    "Holly";
  const explorer = details["Explorer Character"] || "Lars";
  const maverick = details["Maverick Character"] || "Dash";

  return {
    ...details,
    "Pathfinder Character": pathfinder,
    "Lead Character": pathfinder,
    "Explorer Character": explorer,
    "Maverick Character": maverick,
  };
}

function colIndex(headers, names) {
  for (const name of names) {
    const i = headers.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
    if (i >= 0) return i;
  }
  return -1;
}

function readScreens(folder) {
  const { headers, records } = readCsvFile(path.join(folder, "Screens.csv"));
  const idx = {
    screen: colIndex(headers, ["Screen", "Screen #"]),
    gameType: colIndex(headers, ["Game Type", "Screen Type"]),
    t1: colIndex(headers, [
      "Pathfinder Text",
      "Tier 1 Main Text",
      "Holly Main Text",
    ]),
    t2: colIndex(headers, ["Explorer Text", "Tier 2 Main Text", "Lars Main Text"]),
    t3: colIndex(headers, ["Maverick Text", "Tier 3 Main Text", "Dash Main Text"]),
    extra: colIndex(headers, ["Extra Text"]),
    config: colIndex(headers, ["Game Settings", "Config", "Items Holly"]),
    configT2: colIndex(headers, [
      "Explorer Settings",
      "Config T2",
      "Config Explorer",
      "Items Lars",
    ]),
    configT3: colIndex(headers, [
      "Maverick Settings",
      "Config T3",
      "Config Maverick",
      "Items Dash",
    ]),
    err1: colIndex(headers, ["Error Pathfinder", "Error T1", "Error Holly"]),
    err2: colIndex(headers, ["Error Explorer", "Error T2", "Error Lars"]),
    err3: colIndex(headers, ["Error Maverick", "Error T3", "Error Dash"]),
  };

  return records
    .map((row) => {
      const get = (i) => (i >= 0 ? row[i] ?? "" : "");
      const screenRaw = get(idx.screen);
      const screen = Number.parseInt(screenRaw, 10);
      const gameSettings = mergeTieredSettings(get(idx.config));
      const explorerSettings = get(idx.configT2) || gameSettings.explorer;
      const maverickSettings = get(idx.configT3) || gameSettings.maverick;

      return {
        screen,
        gameType: get(idx.gameType),
        t1: get(idx.t1),
        t2: get(idx.t2),
        t3: get(idx.t3),
        extra: get(idx.extra),
        config: gameSettings.base,
        configT2: explorerSettings,
        configT3: maverickSettings,
        err1: get(idx.err1),
        err2: get(idx.err2),
        err3: get(idx.err3),
      };
    })
    .filter((row) => Number.isFinite(row.screen) && row.screen >= 1 && row.screen <= 8);
}

/** Optional [explorer] / [maverick] blocks inside Game Settings. */
function mergeTieredSettings(raw) {
  if (!raw?.trim()) return { base: "", explorer: "", maverick: "" };

  const sections = { base: [], explorer: [], maverick: [] };
  let current = "base";

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    const tag = trimmed.match(/^\[(pathfinder|explorer|maverick)\]$/i);
    if (tag) {
      const key = tag[1].toLowerCase();
      current = key === "pathfinder" ? "base" : key;
      continue;
    }
    if (trimmed) sections[current].push(line);
  }

  const hasTags =
    sections.explorer.length > 0 ||
    sections.maverick.length > 0 ||
    raw.match(/^\[(pathfinder|explorer|maverick)\]/im);

  if (!hasTags) {
    return { base: raw, explorer: "", maverick: "" };
  }

  return {
    base: sections.base.join("\n"),
    explorer: sections.explorer.join("\n"),
    maverick: sections.maverick.join("\n"),
  };
}

function parseConfig(raw) {
  const cfg = { lines: [], map: {} };
  if (!raw?.trim()) return cfg;

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    cfg.lines.push(trimmed);

    const colon = trimmed.indexOf(":");
    if (colon > 0) {
      const key = trimmed.slice(0, colon).trim().toUpperCase();
      const val = trimmed.slice(colon + 1).trim();
      cfg.map[key] = val;
    }
  }
  return cfg;
}

function applyCharacterTokens(text, lead, support) {
  if (!text) return text;
  return text
    .replace(/\{character\}/gi, lead || "the character")
    .replace(/\{support\}/gi, support || "their friend")
    .replace(/\{Character\}/g, lead || "The character")
    .replace(/\{Support\}/g, support || "Their friend");
}

function slugify(text) {
  return (
    String(text)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24) || "item"
  );
}

function normalizeBucket(raw) {
  const v = raw.trim().toUpperCase();
  if (v.startsWith("SHORT") || v === "WANT") return "short";
  if (v.startsWith("LONG") || v.startsWith("MORE FUN") || v === "NEED") return "long";
  if (v.startsWith("WANT")) return "want";
  if (v.startsWith("NEED")) return "need";
  return raw.trim().toLowerCase();
}

function parseItemBody(body, bucket) {
  const pipeParts = body.split("|").map((p) => p.trim()).filter(Boolean);
  if (pipeParts.length > 1 && !body.includes(":")) {
    return pipeParts.map((part) => parseSingleItem(part, bucket));
  }
  return [parseSingleItem(body, bucket)];
}

function parseSingleItem(body, bucket) {
  const emojiMatch = body.match(EMOJI_RE);
  if (emojiMatch) {
    return {
      id: slugify(emojiMatch[2] || emojiMatch[1]),
      emoji: emojiMatch[1],
      label: emojiMatch[2] || emojiMatch[1],
      bucket,
    };
  }
  return { id: slugify(body), label: body, bucket };
}

function parseItemsFromConfig(cfg) {
  const items = [];
  let inItems = false;

  for (const line of cfg.lines) {
    const upper = line.toUpperCase();
    if (upper.startsWith("ITEMS:")) {
      inItems = true;
      const rest = line.slice(line.indexOf(":") + 1).trim();
      if (rest) {
        const bucket = normalizeBucket(rest.split(":")[0] ?? "short");
        items.push(...parseItemBody(rest, bucket));
      }
      continue;
    }
    if (
      inItems &&
      (upper.startsWith("OPTIONS:") ||
        upper.startsWith("CORRECT:") ||
        upper.startsWith("CHOICE") ||
        upper.startsWith("STYLE:") ||
        upper.startsWith("HOLD:") ||
        upper.startsWith("RENDERER:") ||
        upper.startsWith("ROUNDS:") ||
        upper.startsWith("PAIRS:") ||
        upper.startsWith("TAP:") ||
        upper.startsWith("BONUS:"))
    ) {
      inItems = false;
    }
    if (!inItems) continue;

    const colon = line.indexOf(":");
    if (colon > 0) {
      const bucket = normalizeBucket(line.slice(0, colon));
      const body = line.slice(colon + 1).trim();
      items.push(...parseItemBody(body, bucket));
    }
  }

  if (items.length === 0 && cfg.map.ITEMS) {
    for (const part of cfg.map.ITEMS.split("|")) {
      items.push(parseSingleItem(part.trim(), "short"));
    }
  }

  return items;
}

function parseOptions(cfg) {
  if (cfg.map.OPTIONS) {
    return cfg.map.OPTIONS.split("|").map((p) => p.trim()).filter(Boolean);
  }
  return [];
}

function parsePairs(cfg) {
  const pairs = [];
  let inPairs = false;
  for (const line of cfg.lines) {
    if (line.toUpperCase().startsWith("PAIRS:")) {
      inPairs = true;
      const rest = line.slice(line.indexOf(":") + 1).trim();
      if (rest.includes("=")) pairs.push(rest);
      continue;
    }
    if (inPairs && line.includes("=")) pairs.push(line.trim());
    else if (inPairs && line.trim()) inPairs = false;
  }
  return pairs;
}

function parseRounds(cfg) {
  const rounds = [];
  for (const line of cfg.lines) {
    if (!line.toUpperCase().includes("ROUND") && !line.includes("|")) continue;
    if (line.toUpperCase().startsWith("ROUNDS:")) continue;
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 3) continue;
    const correct = parts.find((p) => p.toUpperCase().startsWith("CORRECT:"));
    const error = parts.find((p) => p.toUpperCase().startsWith("ERROR:"));
    const options = parts.filter((p) => !p.toUpperCase().startsWith("CORRECT:") && !p.toUpperCase().startsWith("ERROR:"));
    if (options.length >= 2) {
      rounds.push({
        iconA: "⬜",
        optionA: options[0].replace(/^A:\s*/i, ""),
        iconB: "⬜",
        optionB: options[1].replace(/^B:\s*/i, ""),
        correct: correct?.toUpperCase().includes("B") ? "b" : "a",
        error: error?.replace(/^ERROR:\s*/i, "") || "Try again!",
      });
    }
  }
  return rounds;
}

function resolveGameType(raw) {
  const key = raw.trim().toLowerCase();
  return { internal: GAME_TYPE_MAP[key] ?? "custom", label: key };
}

function buildScreen(row, details) {
  const lead = details["Pathfinder Character"] || details["Lead Character"] || "";
  const support = details["Support Character"] || "";
  const { internal, label } = resolveGameType(row.gameType);
  const cfg = parseConfig(row.config);
  const main = applyCharacterTokens(row.t1, lead, support);
  const id = SCREEN_IDS[row.screen] ?? `screen-${row.screen}`;

  if (internal === "custom" || cfg.map.RENDERER) {
    const renderer =
      cfg.map.RENDERER?.trim() ||
      CUSTOM_RENDERER[label] ||
      slugify(row.gameType);
    return {
      type: "custom",
      id,
      renderer,
      __customBag: { config: cfg.map, rawConfig: row.config, screen: row.screen },
    };
  }

  switch (internal) {
    case "word-drop":
      return {
        type: "word-drop",
        id,
        narrativeBefore: main,
        narrativeAfter: row.extra || "right away!",
        options: parseOptions(cfg).length ? parseOptions(cfg) : ["Spent", "Saved", "Hidden"],
        correctOption: cfg.map.CORRECT || "Spent",
        wrongError: row.err1 || "Not quite! Try again.",
      };
    case "true-false":
      return {
        type: "true-false",
        id,
        prompt: main,
        correctAnswer: (cfg.map.CORRECT || "false").toLowerCase() === "true" ? "true" : "false",
        wrongError: row.err1 || "Try again!",
        promptLabel: cfg.map.LABEL || "Fact Finder",
      };
    case "binary-choice": {
      const correctA = (cfg.map.CORRECT || "A").toUpperCase() === "A";
      const banner =
        label.includes("speed") ||
        label.includes("scenario") ||
        label.includes("trap") ||
        label.includes("quick") ||
        cfg.map.STYLE?.toLowerCase() === "banner";
      const choiceA = cfg.map["CHOICE A"] || cfg.lines.find((l) => /^CHOICE A:/i.test(l))?.replace(/^CHOICE A:\s*/i, "") || "Option A";
      const choiceB = cfg.map["CHOICE B"] || cfg.lines.find((l) => /^CHOICE B:/i.test(l))?.replace(/^CHOICE B:\s*/i, "") || "Option B";
      return {
        type: "binary-choice",
        id,
        prompt: main,
        optionA: { label: choiceA, isCorrect: correctA },
        optionB: { label: choiceB, isCorrect: !correctA },
        wrongError: row.err1 || "Try again!",
        errorStyle: banner ? "banner" : "inline-red",
      };
    }
    case "tap-reveal": {
      const tapMode = cfg.map.TAP?.includes("label") ? "emoji-label" : "emoji-only";
      return {
        type: "tap-reveal",
        id,
        intro: main,
        tapDisplay: tapMode,
        revealDisplay: tapMode,
        buckets: [
          { id: "short", label: "Short Fun", tone: "short" },
          { id: "long", label: "More Fun for Longer", tone: "long" },
        ],
        items: parseItemsFromConfig(cfg),
      };
    }
    case "bucket-sort":
      return {
        type: "bucket-sort",
        id,
        intro: main || "Your turn! Sort these items into the correct bucket.",
        buckets: [
          { id: "short", label: "Short Fun" },
          { id: "long", label: "More Fun for Longer" },
        ],
        items: parseItemsFromConfig(cfg),
      };
    case "hold-to-fill":
      return {
        type: "hold-to-fill",
        id,
        narrative: main,
        holdLabel: cfg.map.HOLD || "HOLD",
        frozenLabel: cfg.map.FROZEN || "DONE",
        successMessage: cfg.map.SUCCESS || "",
        clearOnSuccess: (cfg.map.CLEAR || "yes").toLowerCase().startsWith("y"),
        holdDurationMs: Number.parseInt(cfg.map.MS || "2000", 10),
      };
    case "narrative-bonus": {
      const bonusXp = Number.parseInt(cfg.map.BONUS || "0", 10) || 0;
      return {
        type: "narrative-bonus",
        id,
        narrative: main,
        bonusXp,
        bonusTapLabel: cfg.map.LABEL || (bonusXp > 0 ? `[ COLLECT ${bonusXp} XP BONUS ]` : ""),
        autoReadyWhenNoBonus: bonusXp === 0,
      };
    }
    case "spotlight-rounds":
      return {
        type: "spotlight-rounds",
        id,
        prompt: main,
        rounds: parseRounds(cfg),
      };
    case "completion":
      return { type: "completion", id, __teenCompletion: true };
    default:
      return {
        type: "custom",
        id,
        renderer: slugify(row.gameType),
        __customBag: { config: cfg.map, rawConfig: row.config },
      };
  }
}

function pickIfDifferent(base, cohort) {
  const a = String(base ?? "").trim();
  const b = String(cohort ?? "").trim();
  if (!b || b === a) return undefined;
  return b;
}

function applyNarrativePatch(patch, base, main, err, t1, err1) {
  if (pickIfDifferent(t1, main)) {
    if (base.type === "word-drop") patch.narrativeBefore = main;
    if (base.type === "binary-choice") patch.prompt = main;
    if (base.type === "tap-reveal") patch.intro = main;
    if (base.type === "bucket-sort") patch.intro = main;
    if (base.type === "hold-to-fill") patch.narrative = main;
    if (base.type === "narrative-bonus") patch.narrative = main;
    if (base.type === "true-false") patch.prompt = main;
  }
  if (pickIfDifferent(err1, err)) {
    patch.wrongError = err;
  }
}

function applyConfigPatch(patch, base, extraConfig, baseConfig, tier) {
  const extra = parseConfig(extraConfig || "");
  if (!extraConfig?.trim()) return;

  if (base.type === "tap-reveal" || base.type === "bucket-sort") {
    const items = parseItemsFromConfig(extra);
    if (items.length) patch.items = items;
  }

  if (base.type === "binary-choice") {
    const correctA = (parseConfig(baseConfig).map.CORRECT || "A").toUpperCase() === "A";
    if (extra.map["CHOICE A"]) patch.optionA = { label: extra.map["CHOICE A"], isCorrect: correctA };
    if (extra.map["CHOICE B"]) patch.optionB = { label: extra.map["CHOICE B"], isCorrect: !correctA };
  }

  if (base.type === "hold-to-fill") {
    if (extra.map.HOLD) patch.holdLabel = extra.map.HOLD;
    if (extra.map.FROZEN) patch.frozenLabel = extra.map.FROZEN;
    if (extra.map.SUCCESS) patch.successMessage = extra.map.SUCCESS;
    if (extra.map.CLEAR) patch.clearOnSuccess = extra.map.CLEAR.toLowerCase().startsWith("y");
  }

  if (base.type === "narrative-bonus" && extra.map.BONUS !== undefined) {
    const bonusXp = Number.parseInt(extra.map.BONUS, 10) || 0;
    patch.bonusXp = bonusXp;
    patch.bonusTapLabel = extra.map.LABEL || (bonusXp > 0 ? `[ COLLECT ${bonusXp} XP BONUS ]` : "");
    patch.autoReadyWhenNoBonus = bonusXp === 0;
  }

  if (tier === "explorer" && base.type === "tap-reveal") {
    patch.tapDisplay = "emoji-label";
    patch.revealDisplay = "emoji-label";
  }
}

function buildOverrides(rows, baseScreens, details) {
  const explorer = {};
  const maverick = {};
  const support = details["Support Character"] || "";
  const explorerChar = details["Explorer Character"] || "Lars";
  const maverickChar = details["Maverick Character"] || "Dash";

  rows.forEach((row, i) => {
    const base = baseScreens[i];
    const id = SCREEN_IDS[row.screen];

    if (row.screen === 8) {
      explorer[id] = { _replace: true, type: "completion", id, useStandardPane: true };
      return;
    }

    if (row.t2 || row.err2 || row.configT2) {
      const patch = {};
      applyNarrativePatch(
        patch,
        base,
        applyCharacterTokens(row.t2, explorerChar, support),
        row.err2,
        row.t1,
        row.err1,
      );
      applyConfigPatch(patch, base, row.configT2, row.config, "explorer");
      if (Object.keys(patch).length) explorer[id] = patch;
    }

    if (row.t3 || row.err3 || row.configT3) {
      const patch = {};
      applyNarrativePatch(
        patch,
        base,
        applyCharacterTokens(row.t3, maverickChar, support),
        row.err3,
        row.t1,
        row.err1,
      );
      applyConfigPatch(patch, base, row.configT3, row.config, "maverick");
      if (Object.keys(patch).length) maverick[id] = patch;
    }
  });

  return { explorer, maverick };
}

function esc(v) {
  return JSON.stringify(v ?? "");
}

function formatValue(v, indent) {
  if (typeof v === "string") return esc(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    if (!v.length) return "[]";
    return `[\n${v.map((x) => `${indent}  ${formatValue(x, `${indent}  `)},`).join("\n")}\n${indent}]`;
  }
  if (v && typeof v === "object") {
    return `{\n${Object.entries(v)
      .filter(([, val]) => val !== undefined)
      .map(([k, val]) => `${indent}  ${k}: ${formatValue(val, `${indent}  `)},`)
      .join("\n")}\n${indent}}`;
  }
  return esc(String(v));
}

function serializeScreen(screen, indent) {
  if (screen.__teenCompletion) {
    return `${indent}teenCompletionScreen({ skillTitle: SKILL_TITLE, xpReward: TEEN_XP }),`;
  }
  const copy = { ...screen };
  delete copy.__customBag;
  delete copy.__teenCompletion;
  const lines = [`${indent}{`];
  lines.push(`${indent}  type: ${esc(copy.type)},`);
  lines.push(`${indent}  id: ${esc(copy.id)},`);
  for (const [k, v] of Object.entries(copy)) {
    if (k === "type" || k === "id") continue;
    lines.push(`${indent}  ${k}: ${formatValue(v, `${indent}  `)},`);
  }
  lines.push(`${indent}},`);
  return lines.join("\n");
}

function serializeOverrides(map, indent) {
  const entries = Object.entries(map);
  if (!entries.length) return "{}";
  return `{\n${entries.map(([k, v]) => `${indent}  ${esc(k)}: ${formatValue(v, `${indent}  `)},`).join("\n")}\n${indent}}`;
}

function generateFile(details, rows, baseScreens, overrides) {
  const moduleNum = Number.parseInt(details["Module Number"] || "1", 10);
  const lessonNum = Number.parseInt(details["Lesson Number"] || "1", 10);
  const title = details["Lesson Title"] || "Untitled Lesson";
  const skillName = details["Skill Name"] || "Skill";
  const skillId = details["Skill ID"] || slugify(skillName);
  const explorerXp = Number.parseInt(details["Explorer XP"] || "150", 10);
  const teenXp = Number.parseInt(details["Teen XP"] || "50", 10);
  const perfectBonus = Number.parseInt(details["Explorer Perfect Bonus"] || "50", 10);
  const lead = details["Pathfinder Character"] || details["Lead Character"] || "Holly";
  const explorerChar = details["Explorer Character"] || "Lars";
  const maverickChar = details["Maverick Character"] || "Dash";
  const prefix = `M${moduleNum}_L${lessonNum}`;

  const customScreens = baseScreens.filter((s) => s.type === "custom");
  const hasCustom = customScreens.length > 0;

  return {
    fileName: `m${moduleNum}-l${lessonNum}.ts`,
    content: `/* AUTO-GENERATED from spreadsheet — re-run: npm run lesson:import -- your-folder */

import { teenCompletionScreen } from "@/lib/academy/lessons/completion-screen";
import type { CohortLessonDefinition, ScreenConfig, ScreenOverrideMap } from "@/lib/academy/lessons/types";

const SKILL_TITLE = ${esc(skillName)};
const LEAD_CHARACTER = ${esc(lead)};

const ${prefix}_META = {
  milestoneId: ${lessonNum},
  levelId: ${moduleNum},
  lessonNumber: ${lessonNum},
  moduleTitle: ${esc(`Module ${moduleNum}`)},
  lessonTitle: ${esc(title)},
  shellLabel: ${esc(`Module ${moduleNum} · Lesson ${lessonNum} · ${title}`)},
  totalScreens: ${rows.length},
} as const;

const ${prefix}_REWARDS = {
  skillSlug: ${esc(skillId)},
  achievementSkillSlug: ${esc(skillId)},
  xpReward: ${explorerXp},
  perfectStreakBonus: ${perfectBonus},
} as const;

const TEEN_XP = ${teenXp};
const TEEN_REWARDS = { xpReward: TEEN_XP, perfectStreakBonus: 0 } as const;

const ${prefix}_BASE_SCREENS: ScreenConfig[] = [
${baseScreens.map((s) => serializeScreen(s, "  ")).join("\n")}
];

const EXPLORER_OVERRIDES: ScreenOverrideMap = ${serializeOverrides(overrides.explorer, "")};

const MAVERICK_OVERRIDES: ScreenOverrideMap = ${serializeOverrides(overrides.maverick, "")};

export const ${prefix}_LESSON_DEFINITION: CohortLessonDefinition = {
  meta: ${prefix}_META,
  rewards: ${prefix}_REWARDS,
  baseScreens: ${prefix}_BASE_SCREENS,
  byCohort: {
    explorer: { characterName: ${esc(explorerChar)}, screenOverrides: EXPLORER_OVERRIDES },
    pathfinder: { characterName: ${esc(lead)}, rewards: TEEN_REWARDS },
    maverick: { characterName: ${esc(maverickChar)}, screenOverrides: MAVERICK_OVERRIDES, rewards: TEEN_REWARDS },
  },
};
${hasCustom ? `\n// ⚠️ This lesson uses custom game types (${customScreens.map((s) => s.renderer).join(", ")}). A developer must wire renderers before it can ship.\n` : ""}`,
  };
}

function main() {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const install = process.argv.includes("--install");
  const input = args[0];

  if (!input) {
    console.error("Usage: npm run lesson:import -- path/to/lesson-folder [--install]");
    console.error("  Default: writes Generated-mX-lY.ts into the folder (safe preview).");
    console.error("  --install: writes into lib/academy/lessons/content/ (for developers).");
    process.exit(1);
  }

  const folder = path.resolve(process.cwd(), input);
  if (!fs.existsSync(path.join(folder, "Lesson-Details.csv")) || !fs.existsSync(path.join(folder, "Screens.csv"))) {
    console.error("Folder must contain Lesson-Details.csv and Screens.csv");
    process.exit(1);
  }

  const details = readDetails(folder);
  const rows = readScreens(folder).filter((r) => r.screen >= 1 && r.screen <= 8);

  if (rows.length < 1) {
    console.error("No screen rows found in Screens.csv");
    process.exit(1);
  }

  const baseScreens = rows.map((row) => buildScreen(row, details));
  const overrides = buildOverrides(rows, baseScreens, details);
  const { fileName, content } = generateFile(details, rows, baseScreens, overrides);

  const unknownTypes = [
    ...new Set(
      rows
        .map((r) => r.gameType.trim())
        .filter((t) => t && !GAME_TYPE_MAP[t.toLowerCase()] && t.toLowerCase() !== "lesson complete"),
    ),
  ];
  if (unknownTypes.length) {
    console.log(`⚠ Unknown game type(s) — will import as custom: ${unknownTypes.join(", ")}`);
    console.log("  Check spelling against Game-Types.csv");
  }

  const outPath = install
    ? path.join(process.cwd(), "lib/academy/lessons/content", fileName)
    : path.join(folder, `Generated-${fileName}`);

  fs.writeFileSync(outPath, content, "utf8");

  console.log(`✓ Wrote ${outPath}`);
  const custom = baseScreens.filter((s) => s.type === "custom");
  if (custom.length) {
    console.log(`⚠ Custom game types need developer UI: ${custom.map((s) => s.renderer).join(", ")}`);
  }
  if (!install) {
    console.log("\nPreview only. To install: npm run lesson:import -- your-folder --install");
  } else {
    console.log("\nNext: register the lesson in registry.ts + add a thin lesson component.");
  }
}

main();
