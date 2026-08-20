import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";
import { resolveCanonicalSkillSlug } from "@/lib/skills/skills-registry";
import { markAccountProgressDirty } from "@/lib/dashboard/account-progress-dirty";
import {
  readPersisted,
  writePersisted,
} from "@/lib/dev/client-persist";

export const VAULT_SKILL_PROGRESS_STORAGE_KEY = "nga_vault_skill_progress_v1";

export type VaultSkillTierOverrides = Partial<
  Record<string, SkillTrophyTier>
>;

export function readVaultSkillTierOverrides(): VaultSkillTierOverrides {
  if (typeof window === "undefined") return {};

  const raw = readPersisted(VAULT_SKILL_PROGRESS_STORAGE_KEY);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as VaultSkillTierOverrides;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function setVaultSkillTierOverride(
  skillId: string,
  tier: SkillTrophyTier,
): void {
  if (typeof window === "undefined") return;

  const canonicalId = resolveCanonicalSkillSlug(skillId);
  const current = readVaultSkillTierOverrides();
  saveVaultSkillTierOverrides({ ...current, [canonicalId]: tier });
}

export function saveVaultSkillTierOverrides(
  overrides: VaultSkillTierOverrides,
): void {
  if (typeof window === "undefined") return;
  writePersisted(
    VAULT_SKILL_PROGRESS_STORAGE_KEY,
    JSON.stringify(overrides),
  );
  markAccountProgressDirty();
}
