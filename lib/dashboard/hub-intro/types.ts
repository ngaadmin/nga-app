export const HUB_INTRO_IDS = [
  "academy",
  "launchpad",
  "community",
  "vault",
] as const;

export type HubIntroId = (typeof HUB_INTRO_IDS)[number];

export type HubIntroSeenMap = Partial<Record<HubIntroId, boolean>>;
