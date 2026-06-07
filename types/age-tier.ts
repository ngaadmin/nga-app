/**
 * Compliance tiers from global minor standards (COPPA / GDPR-K).
 * Explorers require verifiable parental consent before account creation.
 */
export const AGE_TIER = {
  explorer: {
    id: "explorer",
    label: "Explorer",
    minAge: 10,
    maxAge: 13,
  },
  titan: {
    id: "titan",
    label: "Titan",
    minAge: 14,
    maxAge: 17,
  },
} as const;

export type AgeTierId = keyof typeof AGE_TIER;

export type AgeTier = (typeof AGE_TIER)[AgeTierId];
