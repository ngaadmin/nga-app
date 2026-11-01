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

/** Older pose ids point at the closest new 512px pose. */
const CHARACTER_POSE_FILE: Record<IllustrationCharacterPose, string> = {
  happy: "celebrating",
  questioning: "deciding",
  working: "hands-on-hips",
  thinking: "thinking",
  celebrating: "celebrating",
  walking: "walking",
};

function characterIllustrationFilename(
  character: IllustrationCharacterId,
  pose: IllustrationCharacterPose,
): string {
  // Mia has no new solo poses. Existing screens use a pairing image instead.
  if (character === "mia") {
    return `Mia-${pose}.webp`;
  }
  return `${character}-${CHARACTER_POSE_FILE[pose]}-512.webp`;
}

function characterIllustrationPath(
  character: IllustrationCharacterId,
  pose: IllustrationCharacterPose,
): string {
  return `${ILLUSTRATIONS_BASE}/characters/${character}/${characterIllustrationFilename(character, pose)}`;
}

/** Legacy pair ids, now the new chatting/side-by-side art. */
const PAIR_ILLUSTRATION_FILES: Record<PairIllustrationId, string> = {
  "pair-lars-mia-walking": "lars-mia-sidebyside.webp",
  "pair-senna-lars-walking": "lars-senna-sidebyside.webp",
  "pair-dash-saskia-walking": "aiden-dash-sidebyside.webp",
  "pair-holly-saskia-walking": "holly-immi-sidebyside.webp",
};

function pairIllustrationPath(id: PairIllustrationId): string {
  return `${ILLUSTRATIONS_BASE}/pairs/${PAIR_ILLUSTRATION_FILES[id]}`;
}

function conceptIllustrationPath(id: ConceptIllustrationId): string {
  return `${ILLUSTRATIONS_BASE}/concepts/${id}.webp`;
}

/**
 * Current prop art for the five concepts Jasper replaced in round 2.
 * The sheet token stays `concept-gift-box`. The painted file is the new name.
 */
const CONCEPT_PROP_FILE: Partial<Record<ConceptIllustrationId, string>> = {
  "concept-piggy-bank": "concept-piggy-bank-r2.webp",
  "concept-coin-stack": "concept-coin-stack-r2.webp",
  "concept-wallet": "concept-wallet-r2.webp",
  "concept-gift-box": "concept-gift-box-r2.webp",
  "concept-growth-chart": "concept-growth-chart-r2.webp",
};

export function conceptPropPath(id: string): string | undefined {
  if (!isConceptIllustrationId(id)) return undefined;
  const file = CONCEPT_PROP_FILE[id];
  if (!file) return conceptIllustrationPath(id);
  return `${ILLUSTRATIONS_BASE}/concepts/${file}`;
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
 * Path for a lesson screen image named in the workbook, under /public.
 * Lessons read from the database swap this for the academy-media bucket URL
 * when the picture is painted (see useAcademyMediaSrc). The bucket object is
 * the same file name, so `lars-celebrating` is `lars-celebrating-512.webp`.
 */
export function getPairSheetImagePath(fileName: string): string | undefined {
  return localPairSheetImagePath(fileName);
}

/** File under /public, before any storage base is applied. */
export function localPairSheetImagePath(fileName: string): string | undefined {
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
  // Pair art, including the versioned -rN and -512 card files. This runs
  // before the solo-pose rules so `lars-mason-chatting-512` and
  // `senna-older-max-*-512` stay in the pairs folder.
  if (
    /^(aiden-dash|aiden-max|holly-immi|holly-mia|holly-senna|lars-mason|lars-mia|lars-senna|senna-older-max|senna-older-aiden19)-(chatting|sidebyside)(?:-r\d+)?(?:-512)?$/.test(
      stem,
    )
  ) {
    return `${ILLUSTRATIONS_BASE}/pairs/${stem}.webp`;
  }
  if (stem.startsWith("senna-older-")) {
    return `${ILLUSTRATIONS_BASE}/characters/senna-older/${stem}.webp`;
  }
  if (stem.startsWith("saskia-")) {
    return `${ILLUSTRATIONS_BASE}/characters/saskia/${stem}.webp`;
  }
  const revisedConcept = /^(concept-[a-z0-9-]+)-r\d+$/.exec(stem);
  if (revisedConcept?.[1] && isConceptIllustrationId(revisedConcept[1])) {
    return `${ILLUSTRATIONS_BASE}/concepts/${stem}.webp`;
  }
  if (/^medal-skill\d+-(?:unlocked|unlock|white|bronze|silver|gold)(?:-r\d+)?(?:-app)?$/.test(stem)) {
    return `${ILLUSTRATIONS_BASE}/medal/${stem}.webp`;
  }
  const pose = /^(lars|holly|aiden|senna|immi|dash)-[a-z0-9-]+-512$/.exec(stem);
  if (pose) {
    return `${ILLUSTRATIONS_BASE}/characters/${pose[1]}/${stem}.webp`;
  }
  const loosePose = characterPoseFilePath(stem);
  if (loosePose) return loosePose;
  return `${PAIR_SHEET_IMAGES_BASE}/${withExt}`;
}

/**
 * Support-cast pose files such as `dash-celebrating` live next to the
 * `*-512.webp` art. Registered character ids are resolved earlier.
 * `max-celebrating` and `pippa-celebrating` use this same rule. The
 * folders stay empty until those pose files are added.
 * A cast name with an age suffix, such as `aiden19-celebrating`, uses the
 * revised `{name}-{pose}-r1-512.webp` file in that character's folder.
 */
const MIA_POSE_NAMES = new Set([
  "celebrating",
  "happy",
  "thinking",
  "walking",
  "working",
]);

export function characterPoseFilePath(fileName: string): string | undefined {
  const trimmed = fileName.trim().split(/[/\\]/).pop() ?? "";
  const stem = trimmed.replace(/\.(webp|png|jpe?g)$/i, "").toLowerCase();
  const mia = /^mia-([a-z]+)(?:-512)?$/.exec(stem);
  if (mia && MIA_POSE_NAMES.has(mia[1] ?? "")) {
    const pose = mia[1] ?? "";
    if (stem.endsWith("-512")) {
      return `${ILLUSTRATIONS_BASE}/characters/mia/Mia-${pose}-512.webp`;
    }
    const titled = `${pose.charAt(0).toUpperCase()}${pose.slice(1)}`;
    return `${ILLUSTRATIONS_BASE}/characters/mia/Mia-${titled}.webp`;
  }
  const aged = /^([a-z]+\d+)-([a-z]+)(?:-r\d+)?(?:-512)?$/.exec(stem);
  if (aged?.[1] && aged[2]) {
    const character = aged[1];
    const pose = aged[2];
    const fileStem =
      /-r\d+(?:-512)?$/.test(stem) || stem.endsWith("-512")
        ? stem
        : `${character}-${pose}-r1-512`;
    return `${ILLUSTRATIONS_BASE}/characters/${character}/${fileStem}.webp`;
  }
  const match = /^(lars|holly|aiden|senna|immi|dash|max|pippa)-[a-z]+$/.exec(stem);
  if (!match || stem.endsWith("-512")) return undefined;
  return `${ILLUSTRATIONS_BASE}/characters/${match[1]}/${stem}-512.webp`;
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
