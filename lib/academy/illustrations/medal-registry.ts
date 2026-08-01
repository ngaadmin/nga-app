/**
 * Skill medal assets — `public/assets/illustrations/medal/`.
 * Module 1 lessons 1–3 award unlock art; lessons 4–6 award bronze art.
 */

export const MEDAL_ILLUSTRATION_IDS = [
  "medal-skill1-unlocked",
  "medal-skill1-bronze",
  "medal-skill2-unlock",
  "medal-skill2-bronze",
  "medal-skill3-unlock",
  "medal-skill3-bronze",
] as const;

export type MedalIllustrationId = (typeof MEDAL_ILLUSTRATION_IDS)[number];

const MEDALS_BASE = "/assets/illustrations/medal";

export const MEDAL_ILLUSTRATION_REGISTRY: Record<MedalIllustrationId, string> = {
  "medal-skill1-unlocked": `${MEDALS_BASE}/medal-skill1-unlocked.webp`,
  "medal-skill1-bronze": `${MEDALS_BASE}/medal-skill1-bronze.webp`,
  "medal-skill2-unlock": `${MEDALS_BASE}/medal-skill2-unlock.webp`,
  "medal-skill2-bronze": `${MEDALS_BASE}/medal-skill2-bronze.webp`,
  "medal-skill3-unlock": `${MEDALS_BASE}/medal-skill3-unlock.webp`,
  "medal-skill3-bronze": `${MEDALS_BASE}/medal-skill3-bronze.webp`,
};

export function getMedalIllustrationPath(id: MedalIllustrationId): string {
  return MEDAL_ILLUSTRATION_REGISTRY[id];
}

export function isMedalIllustrationId(value: string): value is MedalIllustrationId {
  return value in MEDAL_ILLUSTRATION_REGISTRY;
}

/** Screen 8 medal art keyed by module lesson number (Module 1: lessons 1–6). */
export function medalIdForLessonNumber(
  lessonNumber: number,
): MedalIllustrationId | undefined {
  switch (lessonNumber) {
    case 1:
      return "medal-skill1-unlocked";
    case 2:
      return "medal-skill2-unlock";
    case 3:
      return "medal-skill3-unlock";
    case 4:
      return "medal-skill1-bronze";
    case 5:
      return "medal-skill2-bronze";
    case 6:
      return "medal-skill3-bronze";
    default:
      return undefined;
  }
}

/** Achievements carousel — Skills 1–3 unlock vs bronze medal art. */
export function medalIdForSkillNumber(
  skillNumber: number,
  tier: "unlocked" | "bronze",
): MedalIllustrationId | undefined {
  if (skillNumber < 1 || skillNumber > 3) {
    return undefined;
  }

  if (tier === "bronze") {
    return `medal-skill${skillNumber}-bronze` as MedalIllustrationId;
  }

  if (skillNumber === 1) {
    return "medal-skill1-unlocked";
  }

  return `medal-skill${skillNumber}-unlock` as MedalIllustrationId;
}
