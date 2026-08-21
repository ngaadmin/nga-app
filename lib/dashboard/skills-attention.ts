import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";
import type { VaultSkillTrophy } from "@/lib/dashboard/skill-trophies";
import { readPersisted, writePersisted } from "@/lib/dev/client-persist";

const SKILLS_SEEN_STORAGE_KEY = "nga_skills_panel_seen_v1";
const SKILLS_CUP_INTRO_STORAGE_KEY = "nga_skills_cup_intro_seen_v1";

const TIER_RANK: Record<SkillTrophyTier, number> = {
  locked: 0,
  unlocked: 1,
  bronze: 2,
  silver: 3,
  gold: 4,
};

function readSeenTiers(): Partial<Record<string, SkillTrophyTier>> {
  const raw = readPersisted(SKILLS_SEEN_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as Partial<Record<string, SkillTrophyTier>>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function hasUnseenSkillProgress(
  skills: readonly VaultSkillTrophy[],
): boolean {
  const seen = readSeenTiers();

  return skills.some((skill) => {
    const seenTier = seen[skill.id] ?? "locked";
    return TIER_RANK[skill.tier] > TIER_RANK[seenTier];
  });
}

export function markSkillsPanelSeen(skills: readonly VaultSkillTrophy[]): void {
  const snapshot: Partial<Record<string, SkillTrophyTier>> = {};
  for (const skill of skills) {
    snapshot[skill.id] = skill.tier;
  }
  writePersisted(SKILLS_SEEN_STORAGE_KEY, JSON.stringify(snapshot));
}

function hasFirstSkillMilestone(skills: readonly VaultSkillTrophy[]): boolean {
  return skills.some(
    (skill) =>
      skill.tier === "unlocked" ||
      skill.tier === "bronze" ||
      skill.tier === "silver" ||
      skill.tier === "gold",
  );
}

/** True until the first-unlock / first-Bronze cup tip has been recorded. */
export function shouldShowSkillsCupIntro(
  skills: readonly VaultSkillTrophy[],
): boolean {
  if (typeof window === "undefined") return false;
  if (readPersisted(SKILLS_CUP_INTRO_STORAGE_KEY) === "1") return false;
  return hasFirstSkillMilestone(skills);
}

export function markSkillsCupIntroSeen(): void {
  writePersisted(SKILLS_CUP_INTRO_STORAGE_KEY, "1");
}
