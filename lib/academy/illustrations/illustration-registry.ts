/**
 * Master illustration registry — maps standardized asset IDs to public paths.
 * Assets live under `public/assets/illustrations/` (served as `/assets/illustrations/...`).
 */

export const ILLUSTRATION_CHARACTERS = [
  "lars",
  "senna",
  "mia",
  "holly",
  "aiden",
] as const;

export type IllustrationCharacterId = (typeof ILLUSTRATION_CHARACTERS)[number];

export const ILLUSTRATION_CHARACTER_POSES = [
  "happy",
  "questioning",
  "working",
  "thinking",
  "celebrating",
  "walking",
] as const;

export type IllustrationCharacterPose = (typeof ILLUSTRATION_CHARACTER_POSES)[number];

export type CharacterIllustrationId =
  `${IllustrationCharacterId}-${IllustrationCharacterPose}`;

export const ILLUSTRATION_PAIRS = [
  "pair-lars-mia-walking",
  "pair-senna-lars-walking",
  "pair-dash-saskia-walking",
  "pair-holly-saskia-walking",
] as const;

export type PairIllustrationId = (typeof ILLUSTRATION_PAIRS)[number];

/** General reusable concept art (non-badge). */
export const ILLUSTRATION_GENERAL_CONCEPTS = [
  "concept-piggy-bank",
  "concept-coin-stack",
  "concept-wallet",
  "concept-gift-box",
  "concept-growth-chart",
] as const;

/** Skill trophy badge illustrations (18). */
export const ILLUSTRATION_SKILL_BADGE_CONCEPTS = [
  "concept-brain",
  "concept-scale",
  "concept-coin-stack",
  "concept-magnifying-glass",
  "concept-target",
  "concept-jars",
  "concept-ledger",
  "concept-tools",
  "concept-price-tag",
  "concept-shield",
  "concept-sprout",
  "concept-handshake",
  "concept-lock",
  "concept-rocket",
  "concept-vault",
  "concept-heart",
  "concept-signpost",
  "concept-trophy",
] as const;

/** Unique concept IDs — `concept-coin-stack` appears once (shared general + badge). */
export const ILLUSTRATION_CONCEPTS = [
  ...ILLUSTRATION_GENERAL_CONCEPTS,
  ...ILLUSTRATION_SKILL_BADGE_CONCEPTS.filter(
    (id) => id !== "concept-coin-stack",
  ),
] as const;

export type ConceptIllustrationId = (typeof ILLUSTRATION_CONCEPTS)[number];

export type IllustrationId =
  | CharacterIllustrationId
  | PairIllustrationId
  | ConceptIllustrationId;

const ILLUSTRATIONS_BASE = "/assets/illustrations";

function characterIllustrationFilename(
  character: IllustrationCharacterId,
  pose: IllustrationCharacterPose,
): string {
  // On-disk names mix case: Aiden/Holly/Senna PascalCase, lars lowercase,
  // holly-working.webp is the only holly file that is lowercase.
  if (character === "aiden") {
    return `Aiden-${pose}.webp`;
  }
  if (character === "holly") {
    if (pose === "working") return "holly-working.webp";
    return `Holly-${pose}.webp`;
  }
  if (character === "senna") {
    return `Senna-${pose}.webp`;
  }
  return `${character}-${pose}.webp`;
}

function characterIllustrationPath(
  character: IllustrationCharacterId,
  pose: IllustrationCharacterPose,
): string {
  return `${ILLUSTRATIONS_BASE}/characters/${character}/${characterIllustrationFilename(character, pose)}`;
}

function pairIllustrationPath(id: PairIllustrationId): string {
  return `${ILLUSTRATIONS_BASE}/pairs/${id}.webp`;
}

function conceptIllustrationPath(id: ConceptIllustrationId): string {
  return `${ILLUSTRATIONS_BASE}/concepts/${id}.webp`;
}

function buildCharacterIllustrationRegistry(): Record<
  CharacterIllustrationId,
  string
> {
  const entries = {} as Record<CharacterIllustrationId, string>;

  for (const character of ILLUSTRATION_CHARACTERS) {
    for (const pose of ILLUSTRATION_CHARACTER_POSES) {
      const id = `${character}-${pose}` as CharacterIllustrationId;
      entries[id] = characterIllustrationPath(character, pose);
    }
  }

  return entries;
}

function buildPairIllustrationRegistry(): Record<PairIllustrationId, string> {
  return Object.fromEntries(
    ILLUSTRATION_PAIRS.map((id) => [id, pairIllustrationPath(id)]),
  ) as Record<PairIllustrationId, string>;
}

function buildConceptIllustrationRegistry(): Record<
  ConceptIllustrationId,
  string
> {
  return Object.fromEntries(
    ILLUSTRATION_CONCEPTS.map((id) => [id, conceptIllustrationPath(id)]),
  ) as Record<ConceptIllustrationId, string>;
}

/** Character pose lookups (30). */
export const CHARACTER_ILLUSTRATION_REGISTRY = buildCharacterIllustrationRegistry();

/** Character pair lookups (4). */
export const PAIR_ILLUSTRATION_REGISTRY = buildPairIllustrationRegistry();

/** Concept & skill badge lookups (22 unique — coin-stack shared). */
export const CONCEPT_ILLUSTRATION_REGISTRY = buildConceptIllustrationRegistry();

/**
 * Master lookup — 56 unique asset IDs.
 * Spreadsheet row count is 57: `concept-coin-stack` is one file used for both
 * general concepts and the coin-stack skill badge.
 */
export const ILLUSTRATION_REGISTRY: Record<IllustrationId, string> = {
  ...CHARACTER_ILLUSTRATION_REGISTRY,
  ...PAIR_ILLUSTRATION_REGISTRY,
  ...CONCEPT_ILLUSTRATION_REGISTRY,
};

export const PAIR_SHEET_IMAGES_BASE = `${ILLUSTRATIONS_BASE}/characters/pairs`;

const PAIR_SHEET_FILE_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*\.(webp|png|jpe?g)$/i;

/**
 * Resolve a Screens.csv file name.
 * Known character/concept ids use the illustration registry; anything else
 * is a file in `public/assets/illustrations/characters/pairs/`.
 */
export function getPairSheetImagePath(fileName: string): string | undefined {
  const trimmed = fileName.trim();
  if (!trimmed || trimmed.includes("..")) return undefined;
  const base = trimmed.split(/[/\\]/).pop() ?? "";
  const withExt = PAIR_SHEET_FILE_RE.test(base)
    ? base
    : PAIR_SHEET_FILE_RE.test(`${base}.webp`)
      ? `${base}.webp`
      : "";
  if (!withExt) return undefined;
  const stem = withExt.replace(/\.[^.]+$/, "").toLowerCase();
  if (isIllustrationId(stem)) {
    return getIllustrationPath(stem);
  }
  return `${PAIR_SHEET_IMAGES_BASE}/${withExt}`;
}

export function getIllustrationPath(id: IllustrationId): string {
  return ILLUSTRATION_REGISTRY[id];
}

export function isIllustrationId(value: string): value is IllustrationId {
  return value in ILLUSTRATION_REGISTRY;
}

export function isCharacterIllustrationId(
  value: string,
): value is CharacterIllustrationId {
  return value in CHARACTER_ILLUSTRATION_REGISTRY;
}

export function isPairIllustrationId(value: string): value is PairIllustrationId {
  return value in PAIR_ILLUSTRATION_REGISTRY;
}

export function isConceptIllustrationId(
  value: string,
): value is ConceptIllustrationId {
  return value in CONCEPT_ILLUSTRATION_REGISTRY;
}
