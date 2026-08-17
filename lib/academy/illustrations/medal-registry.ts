/**
 * Skill medal assets in `public/assets/illustrations/medal/`.
 * Filenames: medal-skill{N}-{status}.webp
 * Status aliases on disk: unlocked | unlock | white | bronze | silver | gold.
 */

export type MedalDisplayStatus =
  | "locked"
  | "unlocked"
  | "bronze"
  | "silver"
  | "gold";

export const MEDAL_ILLUSTRATION_IDS = [
  "medal-skill1-unlocked",
  "medal-skill1-bronze",
  "medal-skill1-silver",
  "medal-skill1-gold",
  "medal-skill2-unlocked",
  "medal-skill2-bronze",
  "medal-skill2-silver",
  "medal-skill2-gold",
  "medal-skill5-unlocked",
  "medal-skill5-bronze",
  "medal-skill5-silver",
  "medal-skill5-gold",
  "medal-skill6-unlock",
  "medal-skill6-bronze",
  "medal-skill6-silver",
  "medal-skill6-gold",
  "medal-skill7-white",
  "medal-skill7-bronze",
  "medal-skill7-silver",
  "medal-skill7-gold",
  "medal-skill16-unlocked",
  "medal-skill16-bronze",
  "medal-skill16-silver",
  "medal-skill16-gold",
] as const;

export type MedalIllustrationId = (typeof MEDAL_ILLUSTRATION_IDS)[number];

const MEDALS_BASE = "/assets/illustrations/medal";

export const MEDAL_ILLUSTRATION_REGISTRY: Record<MedalIllustrationId, string> = {
  "medal-skill1-unlocked": `${MEDALS_BASE}/medal-skill1-unlocked.webp`,
  "medal-skill1-bronze": `${MEDALS_BASE}/medal-skill1-bronze.webp`,
  "medal-skill1-silver": `${MEDALS_BASE}/medal-skill1-silver.webp`,
  "medal-skill1-gold": `${MEDALS_BASE}/medal-skill1-gold.webp`,
  "medal-skill2-unlocked": `${MEDALS_BASE}/medal-skill2-unlocked.webp`,
  "medal-skill2-bronze": `${MEDALS_BASE}/medal-skill2-bronze.webp`,
  "medal-skill2-silver": `${MEDALS_BASE}/medal-skill2-silver.webp`,
  "medal-skill2-gold": `${MEDALS_BASE}/medal-skill2-gold.webp`,
  "medal-skill5-unlocked": `${MEDALS_BASE}/medal-skill5-unlocked.webp`,
  "medal-skill5-bronze": `${MEDALS_BASE}/medal-skill5-bronze.webp`,
  "medal-skill5-silver": `${MEDALS_BASE}/medal-skill5-silver.webp`,
  "medal-skill5-gold": `${MEDALS_BASE}/medal-skill5-gold.webp`,
  "medal-skill6-unlock": `${MEDALS_BASE}/medal-skill6-unlock.webp`,
  "medal-skill6-bronze": `${MEDALS_BASE}/medal-skill6-bronze.webp`,
  "medal-skill6-silver": `${MEDALS_BASE}/medal-skill6-silver.webp`,
  "medal-skill6-gold": `${MEDALS_BASE}/medal-skill6-gold.webp`,
  "medal-skill7-white": `${MEDALS_BASE}/medal-skill7-white.webp`,
  "medal-skill7-bronze": `${MEDALS_BASE}/medal-skill7-bronze.webp`,
  "medal-skill7-silver": `${MEDALS_BASE}/medal-skill7-silver.webp`,
  "medal-skill7-gold": `${MEDALS_BASE}/medal-skill7-gold.webp`,
  "medal-skill16-unlocked": `${MEDALS_BASE}/medal-skill16-unlocked.webp`,
  "medal-skill16-bronze": `${MEDALS_BASE}/medal-skill16-bronze.webp`,
  "medal-skill16-silver": `${MEDALS_BASE}/medal-skill16-silver.webp`,
  "medal-skill16-gold": `${MEDALS_BASE}/medal-skill16-gold.webp`,
};

/** Skill numbers that currently have at least one medal file. */
export const SKILL_NUMBERS_WITH_MEDAL_ASSETS = [1, 2, 5, 6, 7, 16] as const;

const MEDAL_ID_BY_SKILL: Record<
  number,
  Partial<Record<MedalDisplayStatus, MedalIllustrationId>>
> = {
  1: {
    unlocked: "medal-skill1-unlocked",
    bronze: "medal-skill1-bronze",
    silver: "medal-skill1-silver",
    gold: "medal-skill1-gold",
  },
  2: {
    unlocked: "medal-skill2-unlocked",
    bronze: "medal-skill2-bronze",
    silver: "medal-skill2-silver",
    gold: "medal-skill2-gold",
  },
  5: {
    unlocked: "medal-skill5-unlocked",
    bronze: "medal-skill5-bronze",
    silver: "medal-skill5-silver",
    gold: "medal-skill5-gold",
  },
  6: {
    unlocked: "medal-skill6-unlock",
    bronze: "medal-skill6-bronze",
    silver: "medal-skill6-silver",
    gold: "medal-skill6-gold",
  },
  7: {
    unlocked: "medal-skill7-white",
    bronze: "medal-skill7-bronze",
    silver: "medal-skill7-silver",
    gold: "medal-skill7-gold",
  },
  16: {
    unlocked: "medal-skill16-unlocked",
    bronze: "medal-skill16-bronze",
    silver: "medal-skill16-silver",
    gold: "medal-skill16-gold",
  },
};

export const MEDAL_PLACEHOLDER_SRC =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none"><circle cx="64" cy="64" r="54" fill="#F4F7F9" stroke="#BDE9FB" stroke-width="6"/><circle cx="64" cy="64" r="38" fill="#FFFFFF" stroke="#031F82" stroke-width="3" stroke-opacity="0.18"/></svg>`,
  );

export function getMedalIllustrationPath(id: MedalIllustrationId): string {
  return MEDAL_ILLUSTRATION_REGISTRY[id];
}

export function isMedalIllustrationId(value: string): value is MedalIllustrationId {
  return value in MEDAL_ILLUSTRATION_REGISTRY;
}

export function medalIdForSkillNumber(
  skillNumber: number,
  status: MedalDisplayStatus,
): MedalIllustrationId | undefined {
  const files = MEDAL_ID_BY_SKILL[skillNumber];
  if (!files) return undefined;

  if (status === "bronze" || status === "silver" || status === "gold") {
    return files[status];
  }

  // Locked and unlocked share the activated / white medal art.
  return files.unlocked;
}

export function getMedalIllustrationPathForSkill(
  skillNumber: number,
  status: MedalDisplayStatus,
): string {
  const id = medalIdForSkillNumber(skillNumber, status);
  return id ? getMedalIllustrationPath(id) : MEDAL_PLACEHOLDER_SRC;
}

export function skillHasMedalAssets(skillNumber: number): boolean {
  return skillNumber in MEDAL_ID_BY_SKILL;
}

/** Screen 8 medal art keyed by module lesson number (lessons 1-3 unlock, 4-6 bronze). */
export function medalIdForLessonNumber(
  lessonNumber: number,
): MedalIllustrationId | undefined {
  switch (lessonNumber) {
    case 1:
      return medalIdForSkillNumber(1, "unlocked");
    case 2:
      return medalIdForSkillNumber(2, "unlocked");
    case 3:
      return medalIdForSkillNumber(3, "unlocked");
    case 4:
      return medalIdForSkillNumber(1, "bronze");
    case 5:
      return medalIdForSkillNumber(2, "bronze");
    case 6:
      return medalIdForSkillNumber(3, "bronze");
    default:
      return undefined;
  }
}
