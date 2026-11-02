/**
 * Settings row icons in direction A (same style as the tab icons in
 * tab-icons-a.tsx): a 2px line in currentColor with a pastel duotone fill
 * read from --tab-icon-fill. Hand-authored, no third-party path data.
 */

type IconProps = { className?: string };

const FILL = "var(--tab-icon-fill, #BDE9FB)";
const LINE = {
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

/** Password reset: a key. */
export function KeyIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="8" cy="14" r="4.6" fill={FILL} {...LINE} />
      <circle cx="8" cy="14" r="1.2" fill="currentColor" />
      <path d="M11.4 10.8 20 3.2M16.4 6.4l2.4 2.4M18.6 4.4l1.8 1.8" {...LINE} />
    </svg>
  );
}

/** Parent PIN: a padlock with a keyhole. */
export function PadlockIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M7.5 10.5V7.8a4.5 4.5 0 0 1 9 0v2.7" {...LINE} />
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.6" fill={FILL} {...LINE} />
      <path d="M12 14.6v2.4" {...LINE} />
    </svg>
  );
}

/** Hub shield with a padlock inside (no longer used in Settings). */
export function ShieldLockIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M12 2.8 4 6v5.6c0 4.8 3.4 8.6 8 9.8 4.6-1.2 8-5 8-9.8V6Z" fill={FILL} {...LINE} />
      <path d="M10 11.2V10a2 2 0 0 1 4 0v1.2" {...LINE} strokeWidth={1.7} />
      <rect x="8.6" y="11.2" width="6.8" height="5" rx="1.3" fill="#fff" {...LINE} strokeWidth={1.7} />
    </svg>
  );
}

/** Family accounts: two grown-ups and a child. */
export function FamilyIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="7" cy="6.6" r="2.6" {...LINE} />
      <circle cx="17" cy="6.6" r="2.6" {...LINE} />
      <path d="M2.6 19.5v-3.2c0-2.4 1.9-4.3 4.4-4.3 1 0 1.9.3 2.6.8M21.4 19.5v-3.2c0-2.4-1.9-4.3-4.4-4.3-1 0-1.9.3-2.6.8" {...LINE} />
      <circle cx="12" cy="12.4" r="2.2" fill={FILL} {...LINE} />
      <path d="M8.4 20.5c0-2.1 1.6-3.7 3.6-3.7s3.6 1.6 3.6 3.7Z" fill={FILL} {...LINE} />
    </svg>
  );
}

/** Subscription: a card. */
export function CardIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="2.8" y="5" width="18.4" height="14" rx="2.8" fill={FILL} {...LINE} />
      <path d="M2.8 9.6h18.4" {...LINE} />
      <path d="M6.6 15h3.6" {...LINE} />
    </svg>
  );
}

/** Currency: a coin. */
export function CoinIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="12" r="8.8" fill={FILL} {...LINE} />
      <path d="M14.6 9.2c-.4-.9-1.4-1.5-2.6-1.5-1.5 0-2.6.8-2.6 2 0 2.7 5.4 1.5 5.4 4.4 0 1.2-1.2 2.1-2.8 2.1-1.3 0-2.4-.6-2.8-1.6M12 6.2v1.5M12 16.3v1.5" {...LINE} strokeWidth={1.7} />
    </svg>
  );
}

/** Child data and privacy: a shield with a check. */
export function PrivacyIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M12 2.8 4 6v5.6c0 4.8 3.4 8.6 8 9.8 4.6-1.2 8-5 8-9.8V6Z" fill={FILL} {...LINE} />
      <path d="m8.8 12.2 2.2 2.2 4.2-4.4" {...LINE} />
    </svg>
  );
}

/** My account: one person. */
export function PersonIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="8" r="3.8" fill={FILL} {...LINE} />
      <path d="M4.6 20.5c0-4 3.3-6.8 7.4-6.8s7.4 2.8 7.4 6.8Z" fill={FILL} {...LINE} />
    </svg>
  );
}

/** Log out: a door with an arrow. */
export function LogOutIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M13.5 3.5H6.3a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h7.2Z" fill={FILL} {...LINE} />
      <path d="M10.5 12h10M17.2 8.6 20.5 12l-3.3 3.4" {...LINE} />
    </svg>
  );
}

/** Class: a board with a pointer. */
export function ClassIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="3" y="4" width="18" height="12" rx="2.4" fill={FILL} {...LINE} />
      <path d="M8 20.5 12 16l4 4.5M7 8.5h6M7 11.5h4" {...LINE} />
    </svg>
  );
}
