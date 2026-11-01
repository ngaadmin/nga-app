import {
  HUB_INTRO_IDS,
  type HubIntroSeenMap,
} from "@/lib/dashboard/hub-intro/types";

/** Seen page-intro ids stored on the account and inside learner_progress. */
export type AccountPageIntroFlags = {
  hubs?: HubIntroSeenMap;
  vaultAddMoney?: boolean;
  skillsCup?: boolean;
  medals?: boolean;
  /** One-time "Tap your avatar to switch profiles" tip in the top bar. */
  profileSwitcherTip?: boolean;
};

/** Union of seen flags. A dismissal never flips back to unseen. */
export function mergePageIntroFlags(
  left?: AccountPageIntroFlags | null,
  right?: AccountPageIntroFlags | null,
): AccountPageIntroFlags | undefined {
  const hubs: HubIntroSeenMap = {};
  for (const id of HUB_INTRO_IDS) {
    if (left?.hubs?.[id] === true || right?.hubs?.[id] === true) {
      hubs[id] = true;
    }
  }

  const vaultAddMoney =
    left?.vaultAddMoney === true || right?.vaultAddMoney === true;
  const skillsCup = left?.skillsCup === true || right?.skillsCup === true;
  const medals = left?.medals === true || right?.medals === true;
  const profileSwitcherTip =
    left?.profileSwitcherTip === true || right?.profileSwitcherTip === true;

  if (
    Object.keys(hubs).length === 0 &&
    !vaultAddMoney &&
    !skillsCup &&
    !medals &&
    !profileSwitcherTip
  ) {
    return undefined;
  }

  return {
    ...(Object.keys(hubs).length > 0 ? { hubs } : {}),
    ...(vaultAddMoney ? { vaultAddMoney: true } : {}),
    ...(skillsCup ? { skillsCup: true } : {}),
    ...(medals ? { medals: true } : {}),
    ...(profileSwitcherTip ? { profileSwitcherTip: true } : {}),
  };
}

export function hasPageIntroFlags(
  flags?: AccountPageIntroFlags | null,
): boolean {
  return mergePageIntroFlags(flags, null) != null;
}
