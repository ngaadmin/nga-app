"use client";

import type { FoundationJarRole } from "@/lib/dashboard/destination-jars";
import type { VaultBucket } from "@/lib/dashboard/vault-buckets";
import { isSavingsBucket } from "@/lib/dashboard/vault-buckets";
import { cn } from "@/lib/utils/cn";

export type BucketTheme = {
  accent: string;
  fill: string;
  track: string;
  ring: string;
  label: string;
};

export function bucketTheme(bucket: VaultBucket): BucketTheme {
  if (isSavingsBucket(bucket) || bucket.foundationRole === "save") {
    return {
      accent: "#22C55E",
      fill: "from-[#22C55E]/80 to-[#16A34A]",
      track: "bg-[#22C55E]/20",
      ring: "#22C55E",
      label: "text-[#15803D]",
    };
  }
  if (bucket.foundationRole === "spend") {
    return {
      accent: "#FFA503",
      fill: "from-[#FFA503]/90 to-[#F59E0B]",
      track: "bg-[#FFA503]/25",
      ring: "#FFA503",
      label: "text-[#C88202]",
    };
  }
  if (bucket.foundationRole === "give") {
    return {
      accent: "#8B5CF6",
      fill: "from-[#A78BFA]/90 to-[#8B5CF6]",
      track: "bg-[#8B5CF6]/20",
      ring: "#8B5CF6",
      label: "text-[#6D28D9]",
    };
  }
  return {
    accent: "#0CC1E0",
    fill: "from-[#0CC1E0]/90 to-[#0891B2]",
    track: "bg-[#0CC1E0]/20",
    ring: "#0CC1E0",
    label: "text-[#0E7490]",
  };
}

type ProgressRingProps = {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
};

export function ProgressRing({
  progress,
  size = 52,
  stroke = 4,
  color = "#0CC1E0",
  trackColor = "#BDE9FB",
  children,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, progress));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      {children ? (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      ) : null}
    </div>
  );
}

type JarFillVisualProps = {
  fillPercent: number;
  theme: BucketTheme;
  emoji: string;
  size?: "sm" | "md";
};

export function JarFillVisual({ fillPercent, theme, emoji, size = "md" }: JarFillVisualProps) {
  const clamped = Math.min(100, Math.max(0, fillPercent));
  const dims = size === "sm" ? "h-14 w-10" : "h-16 w-11";

  return (
    <div className={cn("relative flex flex-col items-center", dims)} aria-hidden>
      <div
        className={cn(
          "relative w-full flex-1 overflow-hidden rounded-b-xl rounded-t-lg border-2 bg-white/60",
        )}
        style={{ borderColor: `${theme.accent}55` }}
      >
        <div
          className={cn("absolute inset-x-0 bottom-0 bg-gradient-to-t transition-all duration-500", theme.fill)}
          style={{ height: `${clamped}%` }}
        />
        <div
          className="absolute inset-x-1 top-0 h-2 rounded-b-md border-x-2 border-b-2 bg-white/80"
          style={{ borderColor: `${theme.accent}44` }}
        />
      </div>
      <span className={cn("mt-0.5 leading-none", size === "sm" ? "text-sm" : "text-base")}>{emoji}</span>
    </div>
  );
}

type VaultCollapsibleProps = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

export function VaultCollapsible({
  id,
  title,
  subtitle,
  icon,
  isOpen,
  onToggle,
  children,
}: VaultCollapsibleProps) {
  return (
    <section aria-labelledby={`${id}-heading`} className="w-full border-t border-[#BDE9FB]/40 pt-4">
      <button
        type="button"
        id={`${id}-heading`}
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        className="flex w-full items-center gap-3 py-1 text-left"
      >
        {icon ? (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#BDE9FB]/20 text-lg">
            {icon}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-extrabold text-[#031F82]">{title}</p>
          {subtitle ? (
            <p className="mt-0.5 font-sans text-[11px] text-[#1E3A5F]/75">{subtitle}</p>
          ) : null}
        </div>
        <ChevronIcon isOpen={isOpen} />
      </button>
      <div
        id={`${id}-panel`}
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
        aria-hidden={!isOpen}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </section>
  );
}

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={cn("size-4 shrink-0 text-[#0CC1E0] transition-transform", isOpen && "rotate-180")}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function jarFillPercent(balance: number, maxBalance: number): number {
  if (balance <= 0 || maxBalance <= 0) return 0;
  return Math.min(100, (balance / maxBalance) * 100);
}

export function roleLabel(role: FoundationJarRole | "custom"): string {
  switch (role) {
    case "save":
      return "Save";
    case "spend":
      return "Spend";
    case "give":
      return "Give";
    default:
      return "Bucket";
  }
}
