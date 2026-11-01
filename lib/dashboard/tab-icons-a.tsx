/**
 * Direction A icons (hand-authored for NextGenAchiever$, no third-party path
 * data): soft line icons with a pastel duotone fill. The line uses
 * currentColor; the fill reads --tab-icon-fill (pastel blue by default) so the
 * selected tab and the top bar can swap it without new artwork.
 */

type IconProps = { className?: string };

const FILL = "var(--tab-icon-fill, #BDE9FB)";

export function AcademyTabIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M12 4.5 22 9.2 12 13.9 2 9.2Z" fill={FILL} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6.2 11.7v4.1c0 1.7 2.6 3.2 5.8 3.2s5.8-1.5 5.8-3.2v-4.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M20.4 10v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="20.4" cy="16.4" r="1.4" fill="currentColor"/>
    </svg>
  );
}

export function LaunchpadTabIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <g transform="rotate(42 12 12.2)"><path d="M10 18c0 1.4.8 2.6 2 3.4 1.2-.8 2-2 2-3.4Z" fill={FILL} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.7 11.6 5 14.6v3.4l2.7-2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16.3 11.6 19 14.6v3.4l-2.7-2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 3c2.9 2 4.3 5.1 4.3 8.6v3.9H7.7v-3.9C7.7 8.1 9.1 5 12 3Z" fill="#fff" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="9.6" r="1.9" fill={FILL} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>
    </svg>
  );
}

export function VaultTabIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <rect x="3" y="4" width="18" height="14.5" rx="3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7.2 18.5v2M16.8 18.5v2M18 9.3v4.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="10.6" cy="11.25" r="3.6" fill={FILL} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="10.6" cy="11.25" r="1" fill="currentColor"/>
    </svg>
  );
}

export function CommunityTabIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="16.6" cy="7.4" r="2.7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17.3 12.9c2.5.4 4.2 2.6 4.2 5.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.2 20.5c0-3.7 2.8-6.3 6.3-6.3s6.3 2.6 6.3 6.3Z" fill={FILL} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9.5" cy="8.2" r="3.4" fill={FILL} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function SettingsTabIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M21.40 12.00 L21.40 12.12 L21.40 12.25 L21.39 12.37 L21.39 12.49 L21.38 12.61 L21.37 12.74 L21.36 12.86 L21.35 12.98 L21.33 13.10 L21.24 13.22 L21.03 13.31 L20.71 13.38 L20.34 13.43 L19.94 13.47 L19.54 13.50 L19.19 13.53 L18.91 13.56 L18.74 13.62 L18.69 13.70 L18.66 13.79 L18.64 13.87 L18.62 13.96 L18.59 14.05 L18.56 14.13 L18.53 14.22 L18.50 14.30 L18.47 14.39 L18.44 14.47 L18.41 14.56 L18.37 14.64 L18.34 14.72 L18.30 14.81 L18.27 14.89 L18.23 14.97 L18.19 15.05 L18.15 15.13 L18.11 15.21 L18.06 15.29 L18.02 15.37 L17.98 15.45 L17.93 15.53 L17.91 15.62 L17.99 15.78 L18.16 16.00 L18.39 16.27 L18.65 16.57 L18.91 16.88 L19.14 17.18 L19.31 17.46 L19.40 17.68 L19.38 17.82 L19.31 17.92 L19.23 18.01 L19.15 18.10 L19.07 18.20 L18.99 18.29 L18.90 18.38 L18.82 18.47 L18.73 18.56 L18.65 18.65 L18.56 18.73 L18.47 18.82 L18.38 18.90 L18.29 18.99 L18.20 19.07 L18.10 19.15 L18.01 19.23 L17.92 19.31 L17.82 19.38 L17.68 19.40 L17.46 19.31 L17.18 19.14 L16.88 18.91 L16.57 18.65 L16.27 18.39 L16.00 18.16 L15.78 17.99 L15.62 17.91 L15.53 17.93 L15.45 17.98 L15.37 18.02 L15.29 18.06 L15.21 18.11 L15.13 18.15 L15.05 18.19 L14.97 18.23 L14.89 18.27 L14.81 18.30 L14.72 18.34 L14.64 18.37 L14.56 18.41 L14.47 18.44 L14.39 18.47 L14.30 18.50 L14.22 18.53 L14.13 18.56 L14.05 18.59 L13.96 18.62 L13.87 18.64 L13.79 18.66 L13.70 18.69 L13.62 18.74 L13.56 18.91 L13.53 19.19 L13.50 19.54 L13.47 19.94 L13.43 20.34 L13.38 20.71 L13.31 21.03 L13.22 21.24 L13.10 21.33 L12.98 21.35 L12.86 21.36 L12.74 21.37 L12.61 21.38 L12.49 21.39 L12.37 21.39 L12.25 21.40 L12.12 21.40 L12.00 21.40 L11.88 21.40 L11.75 21.40 L11.63 21.39 L11.51 21.39 L11.39 21.38 L11.26 21.37 L11.14 21.36 L11.02 21.35 L10.90 21.33 L10.78 21.24 L10.69 21.03 L10.62 20.71 L10.57 20.34 L10.53 19.94 L10.50 19.54 L10.47 19.19 L10.44 18.91 L10.38 18.74 L10.30 18.69 L10.21 18.66 L10.13 18.64 L10.04 18.62 L9.95 18.59 L9.87 18.56 L9.78 18.53 L9.70 18.50 L9.61 18.47 L9.53 18.44 L9.44 18.41 L9.36 18.37 L9.28 18.34 L9.19 18.30 L9.11 18.27 L9.03 18.23 L8.95 18.19 L8.87 18.15 L8.79 18.11 L8.71 18.06 L8.63 18.02 L8.55 17.98 L8.47 17.93 L8.38 17.91 L8.22 17.99 L8.00 18.16 L7.73 18.39 L7.43 18.65 L7.12 18.91 L6.82 19.14 L6.54 19.31 L6.32 19.40 L6.18 19.38 L6.08 19.31 L5.99 19.23 L5.90 19.15 L5.80 19.07 L5.71 18.99 L5.62 18.90 L5.53 18.82 L5.44 18.73 L5.35 18.65 L5.27 18.56 L5.18 18.47 L5.10 18.38 L5.01 18.29 L4.93 18.20 L4.85 18.10 L4.77 18.01 L4.69 17.92 L4.62 17.82 L4.60 17.68 L4.69 17.46 L4.86 17.18 L5.09 16.88 L5.35 16.57 L5.61 16.27 L5.84 16.00 L6.01 15.78 L6.09 15.62 L6.07 15.53 L6.02 15.45 L5.98 15.37 L5.94 15.29 L5.89 15.21 L5.85 15.13 L5.81 15.05 L5.77 14.97 L5.73 14.89 L5.70 14.81 L5.66 14.72 L5.63 14.64 L5.59 14.56 L5.56 14.47 L5.53 14.39 L5.50 14.30 L5.47 14.22 L5.44 14.13 L5.41 14.05 L5.38 13.96 L5.36 13.87 L5.34 13.79 L5.31 13.70 L5.26 13.62 L5.09 13.56 L4.81 13.53 L4.46 13.50 L4.06 13.47 L3.66 13.43 L3.29 13.38 L2.97 13.31 L2.76 13.22 L2.67 13.10 L2.65 12.98 L2.64 12.86 L2.63 12.74 L2.62 12.61 L2.61 12.49 L2.61 12.37 L2.60 12.25 L2.60 12.12 L2.60 12.00 L2.60 11.88 L2.60 11.75 L2.61 11.63 L2.61 11.51 L2.62 11.39 L2.63 11.26 L2.64 11.14 L2.65 11.02 L2.67 10.90 L2.76 10.78 L2.97 10.69 L3.29 10.62 L3.66 10.57 L4.06 10.53 L4.46 10.50 L4.81 10.47 L5.09 10.44 L5.26 10.38 L5.31 10.30 L5.34 10.21 L5.36 10.13 L5.38 10.04 L5.41 9.95 L5.44 9.87 L5.47 9.78 L5.50 9.70 L5.53 9.61 L5.56 9.53 L5.59 9.44 L5.63 9.36 L5.66 9.28 L5.70 9.19 L5.73 9.11 L5.77 9.03 L5.81 8.95 L5.85 8.87 L5.89 8.79 L5.94 8.71 L5.98 8.63 L6.02 8.55 L6.07 8.47 L6.09 8.38 L6.01 8.22 L5.84 8.00 L5.61 7.73 L5.35 7.43 L5.09 7.12 L4.86 6.82 L4.69 6.54 L4.60 6.32 L4.62 6.18 L4.69 6.08 L4.77 5.99 L4.85 5.90 L4.93 5.80 L5.01 5.71 L5.10 5.62 L5.18 5.53 L5.27 5.44 L5.35 5.35 L5.44 5.27 L5.53 5.18 L5.62 5.10 L5.71 5.01 L5.80 4.93 L5.90 4.85 L5.99 4.77 L6.08 4.69 L6.18 4.62 L6.32 4.60 L6.54 4.69 L6.82 4.86 L7.12 5.09 L7.43 5.35 L7.73 5.61 L8.00 5.84 L8.22 6.01 L8.38 6.09 L8.47 6.07 L8.55 6.02 L8.63 5.98 L8.71 5.94 L8.79 5.89 L8.87 5.85 L8.95 5.81 L9.03 5.77 L9.11 5.73 L9.19 5.70 L9.28 5.66 L9.36 5.63 L9.44 5.59 L9.53 5.56 L9.61 5.53 L9.70 5.50 L9.78 5.47 L9.87 5.44 L9.95 5.41 L10.04 5.38 L10.13 5.36 L10.21 5.34 L10.30 5.31 L10.38 5.26 L10.44 5.09 L10.47 4.81 L10.50 4.46 L10.53 4.06 L10.57 3.66 L10.62 3.29 L10.69 2.97 L10.78 2.76 L10.90 2.67 L11.02 2.65 L11.14 2.64 L11.26 2.63 L11.39 2.62 L11.51 2.61 L11.63 2.61 L11.75 2.60 L11.88 2.60 L12.00 2.60 L12.12 2.60 L12.25 2.60 L12.37 2.61 L12.49 2.61 L12.61 2.62 L12.74 2.63 L12.86 2.64 L12.98 2.65 L13.10 2.67 L13.22 2.76 L13.31 2.97 L13.38 3.29 L13.43 3.66 L13.47 4.06 L13.50 4.46 L13.53 4.81 L13.56 5.09 L13.62 5.26 L13.70 5.31 L13.79 5.34 L13.87 5.36 L13.96 5.38 L14.05 5.41 L14.13 5.44 L14.22 5.47 L14.30 5.50 L14.39 5.53 L14.47 5.56 L14.56 5.59 L14.64 5.63 L14.72 5.66 L14.81 5.70 L14.89 5.73 L14.97 5.77 L15.05 5.81 L15.13 5.85 L15.21 5.89 L15.29 5.94 L15.37 5.98 L15.45 6.02 L15.53 6.07 L15.62 6.09 L15.78 6.01 L16.00 5.84 L16.27 5.61 L16.57 5.35 L16.88 5.09 L17.18 4.86 L17.46 4.69 L17.68 4.60 L17.82 4.62 L17.92 4.69 L18.01 4.77 L18.10 4.85 L18.20 4.93 L18.29 5.01 L18.38 5.10 L18.47 5.18 L18.56 5.27 L18.65 5.35 L18.73 5.44 L18.82 5.53 L18.90 5.62 L18.99 5.71 L19.07 5.80 L19.15 5.90 L19.23 5.99 L19.31 6.08 L19.38 6.18 L19.40 6.32 L19.31 6.54 L19.14 6.82 L18.91 7.12 L18.65 7.43 L18.39 7.73 L18.16 8.00 L17.99 8.22 L17.91 8.38 L17.93 8.47 L17.98 8.55 L18.02 8.63 L18.06 8.71 L18.11 8.79 L18.15 8.87 L18.19 8.95 L18.23 9.03 L18.27 9.11 L18.30 9.19 L18.34 9.28 L18.37 9.36 L18.41 9.44 L18.44 9.53 L18.47 9.61 L18.50 9.70 L18.53 9.78 L18.56 9.87 L18.59 9.95 L18.62 10.04 L18.64 10.13 L18.66 10.21 L18.69 10.30 L18.74 10.38 L18.91 10.44 L19.19 10.47 L19.54 10.50 L19.94 10.53 L20.34 10.57 L20.71 10.62 L21.03 10.69 L21.24 10.78 L21.33 10.90 L21.35 11.02 L21.36 11.14 L21.37 11.26 L21.38 11.39 L21.39 11.51 L21.39 11.63 L21.40 11.75 L21.40 11.88Z M9.1 12a2.9 2.9 0 1 0 5.8 0a2.9 2.9 0 1 0 -5.8 0Z" fill={FILL} fillRule="evenodd" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function ParentHubTabIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M12 2.8 4 6v5.6c0 4.8 3.4 8.6 8 9.8 4.6-1.2 8-5 8-9.8V6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 16s-4-2.3-4-5.1c0-1.3 1-2.3 2.2-2.3.8 0 1.5.4 1.8 1 .3-.6 1-1 1.8-1 1.2 0 2.2 1 2.2 2.3 0 2.8-4 5.1-4 5.1Z" fill={FILL} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
    </svg>
  );
}

export function StreakIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <path d="M12 21.5c4 0 7-2.9 7-6.9 0-2.9-1.4-5.1-3.2-6.9-.3 1.6-1.1 2.8-2.3 3.4.3-3.6-1.4-6.6-4.3-8.6.1 3.1-1.5 5-3.1 6.9C4.9 11.1 5 12.7 5 14.6c0 4 3 6.9 7 6.9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 21.5c1.9 0 3.2-1.4 3.2-3.2 0-1.9-1.4-3.2-3.2-5.2-1.8 2-3.2 3.3-3.2 5.2 0 1.8 1.3 3.2 3.2 3.2Z" fill={FILL} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  );
}

export function CoinsIconA({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="12" r="9" fill={FILL} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.5 9c-.6-.8-1.5-1.2-2.6-1.2-1.5 0-2.6.8-2.6 1.9 0 2.7 5.4 1.5 5.4 4.3 0 1.2-1.2 2.1-2.8 2.1-1.2 0-2.2-.5-2.8-1.3M12 6.3v1.5M12 16.1v1.6" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
