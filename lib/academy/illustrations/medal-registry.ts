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

export type MedalDiskStatus =
  | "unlocked"
  | "unlock"
  | "white"
  | "bronze"
  | "silver"
  | "gold";

export type MedalIllustrationId = `medal-skill${number}-${MedalDiskStatus}`;

const MEDALS_BASE = "/assets/illustrations/medal";

/** Disk name for the unlocked / white medal when it is not `unlocked`. */
const UNLOCKED_DISK_STATUS: Partial<Record<number, "unlock" | "white">> = {
  6: "unlock",
  7: "white",
};

const TIER_STATUSES = ["unlocked", "bronze", "silver", "gold"] as const;

/** Skill numbers that currently have at least one medal file. */
export const SKILL_NUMBERS_WITH_MEDAL_ASSETS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
] as const;

function medalIllustrationId(
  skillNumber: number,
  status: (typeof TIER_STATUSES)[number],
): MedalIllustrationId {
  const diskStatus =
    status === "unlocked"
      ? (UNLOCKED_DISK_STATUS[skillNumber] ?? "unlocked")
      : status;
  return `medal-skill${skillNumber}-${diskStatus}`;
}

export const MEDAL_ILLUSTRATION_IDS = SKILL_NUMBERS_WITH_MEDAL_ASSETS.flatMap(
  (skillNumber) =>
    TIER_STATUSES.map((status) => medalIllustrationId(skillNumber, status)),
) as readonly MedalIllustrationId[];

export const MEDAL_ILLUSTRATION_REGISTRY: Record<MedalIllustrationId, string> =
  Object.fromEntries(
    MEDAL_ILLUSTRATION_IDS.map((id) => [id, `${MEDALS_BASE}/${id}.webp`]),
  ) as Record<MedalIllustrationId, string>;

const MEDAL_ID_BY_SKILL: Record<
  number,
  Partial<Record<MedalDisplayStatus, MedalIllustrationId>>
> = Object.fromEntries(
  SKILL_NUMBERS_WITH_MEDAL_ASSETS.map((skillNumber) => [
    skillNumber,
    {
      unlocked: medalIllustrationId(skillNumber, "unlocked"),
      bronze: medalIllustrationId(skillNumber, "bronze"),
      silver: medalIllustrationId(skillNumber, "silver"),
      gold: medalIllustrationId(skillNumber, "gold"),
    },
  ]),
);

export const MEDAL_PLACEHOLDER_SRC = `${MEDALS_BASE}/medal-placeholder.svg`;

export function getMedalIllustrationPath(id: MedalIllustrationId): string {
  return MEDAL_ILLUSTRATION_REGISTRY[id] ?? `${MEDALS_BASE}/${id}.webp`;
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

/**
 * Completion medal: authored screen `medalId`, then lesson-number helper,
 * then skill number + earned tier (bronze / silver / gold / unlocked).
 */
export function resolveCompletionMedalId(args: {
  medalId?: MedalIllustrationId;
  lessonNumber?: number;
  skillNumber?: number;
  tier?: MedalDisplayStatus | null;
}): MedalIllustrationId | undefined {
  if (args.medalId) return args.medalId;

  if (typeof args.lessonNumber === "number") {
    const fromLesson = medalIdForLessonNumber(args.lessonNumber);
    if (fromLesson) return fromLesson;
  }

  if (
    typeof args.skillNumber === "number" &&
    args.tier &&
    args.tier !== "locked"
  ) {
    return medalIdForSkillNumber(args.skillNumber, args.tier);
  }

  return undefined;
}
