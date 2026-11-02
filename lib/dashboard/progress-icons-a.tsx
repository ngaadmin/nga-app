/**
 * Hub progress icons in direction A (same style as settings-icons-a.tsx and
 * the tab icons): a 2px line in currentColor with a pastel duotone fill read
 * from --tab-icon-fill. Used for Vault jars and Recent activity instead of
 * color emoji. Hand-authored, no third-party path data.
 */

import type { ComponentType } from "react";
import {
  ClassIconA,
  CoinIconA,
  FamilyIconA,
  KeyIconA,
  PersonIconA,
} from "@/lib/dashboard/settings-icons-a";

type IconProps = { className?: string };

const FILL = "var(--tab-icon-fill, #BDE9FB)";
const LINE = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Save jar: a jar with a lid and a coin slot. */
export function SaveJarIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="7" y="2.8" width="10" height="3.4" rx="1.2" {...LINE} />
      <path d="M7.6 6.2C5.6 7.6 4.6 9.6 4.6 12v5.4a3.6 3.6 0 0 0 3.6 3.6h7.6a3.6 3.6 0 0 0 3.6-3.6V12c0-2.4-1-4.4-3-5.8Z" fill={FILL} {...LINE} />
      <path d="M10 12.6h4" {...LINE} />
    </svg>
  );
}

/** Spend jar: a shopping cart. */
export function CartIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M5.6 6.4h14.2l-1.6 7.2a2 2 0 0 1-2 1.6H9a2 2 0 0 1-2-1.6Z" fill={FILL} {...LINE} />
      <path d="M2.6 3.4h2.2l.8 3M7 15.2l-.6 2.4h12" {...LINE} />
      <circle cx="9" cy="20.2" r="1.3" fill="currentColor" />
      <circle cx="17" cy="20.2" r="1.3" fill="currentColor" />
    </svg>
  );
}

/** Give jar: a gift box. */
export function GiftIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="4.4" y="11" width="15.2" height="10" rx="1.8" fill={FILL} {...LINE} />
      <rect x="3" y="7.4" width="18" height="3.6" rx="1.2" {...LINE} />
      <path d="M12 7.4V21" {...LINE} />
      <path d="M12 7.4c-1-2.6-3.4-4-4.8-2.8-1.2 1 .2 2.8 4.8 2.8Zm0 0c1-2.6 3.4-4 4.8-2.8 1.2 1-.2 2.8-4.8 2.8Z" {...LINE} />
    </svg>
  );
}

/** Emergency jar: a first-aid kit. */
export function FirstAidIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M9 6.6V5a1.6 1.6 0 0 1 1.6-1.6h2.8A1.6 1.6 0 0 1 15 5v1.6" {...LINE} />
      <rect x="3" y="6.6" width="18" height="13.6" rx="2.6" fill={FILL} {...LINE} />
      <path d="M12 10.2v6.4M8.8 13.4h6.4" {...LINE} />
    </svg>
  );
}

/** Finished a lesson: a graduation cap. */
export function GradCapIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M2.4 9.4 12 4.6l9.6 4.8-9.6 4.8Z" fill={FILL} {...LINE} />
      <path d="M6.4 11.4v4.4c0 1.6 2.5 3 5.6 3s5.6-1.4 5.6-3v-4.4M21.6 9.4v5.2" {...LINE} />
    </svg>
  );
}

/** Earned a medal: a round medal on a ribbon. */
export function MedalIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M8 2.8h3l1.6 5.4M16 2.8h-3l-1.2 4" {...LINE} />
      <circle cx="12" cy="15" r="6" fill={FILL} {...LINE} />
      <path d="m12 12 .9 1.9 2 .3-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.3Z" {...LINE} strokeWidth={1.5} />
    </svg>
  );
}

/** A Vault move: a safe with a dial. */
export function SafeIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="3" y="3.6" width="18" height="15.4" rx="2.6" fill={FILL} {...LINE} />
      <circle cx="12" cy="11.3" r="3.4" fill="#fff" {...LINE} />
      <path d="M12 9.6v1.7l1.2 1M6.4 19v1.6M17.6 19v1.6" {...LINE} />
    </svg>
  );
}

/** Joined date: a calendar page. */
export function CalendarIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="3.4" y="5" width="17.2" height="15.6" rx="2.6" fill={FILL} {...LINE} />
      <path d="M3.4 10h17.2" {...LINE} />
      <path d="M8 3v4M16 3v4" {...LINE} />
      <circle cx="8.4" cy="14.6" r="1.1" fill="currentColor" />
      <circle cx="12" cy="14.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

/** Email: an envelope. */
export function MailIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.6" fill={FILL} {...LINE} />
      <path d="m3.6 6.4 8.4 6.4 8.4-6.4" {...LINE} />
    </svg>
  );
}

/** Lifetime coins: a star. */
export function StarIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8Z" fill={FILL} {...LINE} />
    </svg>
  );
}

/** Activity history: a clock. */
export function ClockIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="12" r="8.8" fill={FILL} {...LINE} />
      <path d="M12 7.4V12l3 2" {...LINE} />
    </svg>
  );
}

/** Student logins: a group of three. */
export function GroupIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="8.4" r="3" fill={FILL} {...LINE} />
      <path d="M6.6 19.6c0-3.2 2.4-5.4 5.4-5.4s5.4 2.2 5.4 5.4Z" fill={FILL} {...LINE} />
      <path d="M6.4 10.6a2.3 2.3 0 1 1 .2-4.4M17.6 10.6a2.3 2.3 0 1 0-.2-4.4M2.6 17.4c0-2 1.2-3.6 3-4.2M21.4 17.4c0-2-1.2-3.6-3-4.2" {...LINE} />
    </svg>
  );
}

/** This device: a phone. */
export function DeviceIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="6.4" y="2.8" width="11.2" height="18.4" rx="2.6" fill={FILL} {...LINE} />
      <path d="M10.6 18h2.8" {...LINE} />
    </svg>
  );
}

export type JarIconId = "save-jar" | "spend-jar" | "give-jar" | "emergencies-jar";

export type ActivityIconKind =
  | "lesson"
  | "medal-bronze"
  | "medal-silver"
  | "medal-gold"
  | "coins"
  | "vault";

type IconSpec = {
  Icon: ComponentType<IconProps>;
  /** Circle background, line color and pastel fill. */
  toneClassName: string;
};

export const JAR_ICONS: Record<JarIconId, IconSpec> = {
  "save-jar": {
    Icon: SaveJarIconA,
    toneClassName: "bg-[#E8F6FC] text-[#031F82] [--tab-icon-fill:#BDE9FB]",
  },
  "spend-jar": {
    Icon: CartIconA,
    toneClassName: "bg-[#FFF3DC] text-[#031F82] [--tab-icon-fill:#FFD98A]",
  },
  "give-jar": {
    Icon: GiftIconA,
    toneClassName: "bg-[#FDEBF3] text-[#031F82] [--tab-icon-fill:#F8C4DB]",
  },
  "emergencies-jar": {
    Icon: FirstAidIconA,
    toneClassName: "bg-[#FDECEC] text-[#031F82] [--tab-icon-fill:#F7C2C2]",
  },
};

export const ACTIVITY_ICONS: Record<ActivityIconKind, IconSpec> = {
  lesson: {
    Icon: GradCapIconA,
    toneClassName: "bg-[#E8F6FC] text-[#031F82] [--tab-icon-fill:#BDE9FB]",
  },
  "medal-bronze": {
    Icon: MedalIconA,
    toneClassName: "bg-[#FBEFE4] text-[#031F82] [--tab-icon-fill:#EBC39E]",
  },
  "medal-silver": {
    Icon: MedalIconA,
    toneClassName: "bg-[#EEF2F5] text-[#031F82] [--tab-icon-fill:#CDD7DF]",
  },
  "medal-gold": {
    Icon: MedalIconA,
    toneClassName: "bg-[#FFF3DC] text-[#031F82] [--tab-icon-fill:#FFD98A]",
  },
  coins: {
    Icon: CoinIconA,
    toneClassName: "bg-[#FFF3DC] text-[#031F82] [--tab-icon-fill:#FFD98A]",
  },
  vault: {
    Icon: SafeIconA,
    toneClassName: "bg-[#E8F6FC] text-[#031F82] [--tab-icon-fill:#BDE9FB]",
  },
};

/** Rows in the "what we keep / what gets removed" lists. */
export type KeepIconKind =
  | "profile"
  | "login"
  | "email"
  | "children"
  | "class"
  | "students"
  | "lessons"
  | "lifetime-coins"
  | "coins"
  | "medals"
  | "vault"
  | "activity"
  | "device";

const SKY = "bg-[#E8F6FC] text-[#031F82] [--tab-icon-fill:#BDE9FB]";
const BUTTER = "bg-[#FFF3DC] text-[#031F82] [--tab-icon-fill:#FFD98A]";
const BLUSH = "bg-[#FDEBF3] text-[#031F82] [--tab-icon-fill:#F8C4DB]";
const MINT = "bg-[#E6F7F0] text-[#031F82] [--tab-icon-fill:#B5E8D2]";
const LILAC = "bg-[#EFEBFB] text-[#031F82] [--tab-icon-fill:#D3C8F5]";

export const KEEP_ICONS: Record<KeepIconKind, IconSpec> = {
  profile: { Icon: PersonIconA, toneClassName: SKY },
  login: { Icon: KeyIconA, toneClassName: LILAC },
  email: { Icon: MailIconA, toneClassName: SKY },
  children: { Icon: FamilyIconA, toneClassName: BLUSH },
  class: { Icon: ClassIconA, toneClassName: MINT },
  students: { Icon: GroupIconA, toneClassName: BLUSH },
  lessons: { Icon: GradCapIconA, toneClassName: SKY },
  "lifetime-coins": { Icon: StarIconA, toneClassName: BUTTER },
  coins: { Icon: CoinIconA, toneClassName: BUTTER },
  medals: { Icon: MedalIconA, toneClassName: BUTTER },
  vault: { Icon: SafeIconA, toneClassName: MINT },
  activity: { Icon: ClockIconA, toneClassName: LILAC },
  device: { Icon: DeviceIconA, toneClassName: SKY },
};
