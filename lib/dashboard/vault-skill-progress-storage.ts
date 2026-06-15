import type { SkillTrophyTier } from "@/lib/dashboard/skill-trophies";

export const VAULT_SKILL_PROGRESS_STORAGE_KEY = "nga_vault_skill_progress_v1";

export type VaultSkillTierOverrides = Partial<
  Record<string, SkillTrophyTier>
>;

export function readVaultSkillTierOverrides(): VaultSkillTierOverrides {
  if (typeof window === "undefined") return {};

  const raw = window.sessionStorage.getItem(VAULT_SKILL_PROGRESS_STORAGE_KEY);
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

  const current = readVaultSkillTierOverrides();
  saveVaultSkillTierOverrides({ ...current, [skillId]: tier });
}

export function saveVaultSkillTierOverrides(
  overrides: VaultSkillTierOverrides,
): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    VAULT_SKILL_PROGRESS_STORAGE_KEY,
    JSON.stringify(overrides),
  );
}
