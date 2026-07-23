"use client";

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

/** Emoji-only bucket icon (no fill level). */
type BucketEmojiIconProps = {
  emoji: string;
  theme: BucketTheme;
  size?: "sm" | "md" | "lg";
};

export function BucketEmojiIcon({ emoji, theme, size = "md" }: BucketEmojiIconProps) {
  const dimensions =
    size === "lg" ? "size-16 text-4xl" : size === "md" ? "size-12 text-2xl" : "size-10 text-xl";

  return (
    <span
      className={cn("flex shrink-0 items-center justify-center rounded-2xl leading-none", dimensions)}
      style={{ backgroundColor: `${theme.accent}18` }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}

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

type PieSegment = {
  id: string;
  value: number;
  color: string;
  label: string;
};

function buildPieSegments(buckets: readonly VaultBucket[]): PieSegment[] {
  return buckets
    .filter((bucket) => bucket.balance > 0)
    .map((bucket) => ({
      id: bucket.id,
      value: bucket.balance,
      color: bucketTheme(bucket).accent,
      label: bucket.name,
    }));
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

function describePieWedge(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
): string {
  if (endAngle - startAngle >= 359.99) {
    return `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 0 ${cx - radius} ${cy} Z`;
  }

  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

type BucketPieChartProps = {
  buckets: readonly VaultBucket[];
  size?: number;
};

export function BucketPieChart({
  buckets,
  size = 56,
}: BucketPieChartProps) {
  const segments = buildPieSegments(buckets);
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const radius = size / 2;
  const pieRadius = radius - 1;

  if (total <= 0) {
    return (
      <div
        className="relative shrink-0 rounded-full border-2 border-white/20 bg-white/10"
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  let currentAngle = -90;

  return (
    <svg width={size} height={size} className="shrink-0" aria-hidden viewBox={`0 0 ${size} ${size}`}>
      {segments.map((segment) => {
        const sliceAngle = (segment.value / total) * 360;
        const endAngle = currentAngle + sliceAngle;
        const path = describePieWedge(radius, radius, pieRadius, currentAngle, endAngle);
        currentAngle = endAngle;

        return <path key={segment.id} d={path} fill={segment.color} />;
      })}
    </svg>
  );
}

type BucketPieLegendProps = {
  buckets: readonly VaultBucket[];
  variant?: "on-dark" | "on-light";
  layout?: "horizontal" | "vertical";
};

export function BucketPieLegend({
  buckets,
  variant = "on-dark",
  layout = "horizontal",
}: BucketPieLegendProps) {
  const labelClass =
    variant === "on-dark" ? "text-white/75" : "text-[#1E3A5F]/75";

  return (
    <ul
      className={cn(
        layout === "vertical"
          ? "flex min-w-0 flex-1 flex-col justify-center gap-0.5"
          : "mt-2 flex flex-wrap gap-x-3 gap-y-1",
      )}
    >
      {buckets
        .filter((bucket) => bucket.balance > 0)
        .map((bucket) => (
          <li key={bucket.id} className={cn("flex min-w-0 items-center gap-1.5 font-sans text-xs", labelClass)}>
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: bucketTheme(bucket).accent }}
              aria-hidden
            />
            <span className="truncate">{bucket.name}</span>
          </li>
        ))}
    </ul>
  );
}

type GoalProgressBarProps = {
  progress: number;
  color?: string;
  trackColor?: string;
  /** Larger bar for savings goal tiles (avoids slider-like appearance). */
  variant?: "default" | "goal";
};

export function GoalProgressBar({
  progress,
  color = "#DCB766",
  trackColor = "#FEF3C7",
  variant = "default",
}: GoalProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));
  const isGoal = variant === "goal";

  return (
    <div
      className={cn(
        "w-full overflow-hidden",
        isGoal ? "h-3.5 rounded-md" : "h-1.5 rounded-full",
      )}
      style={{ backgroundColor: trackColor }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full transition-all duration-500",
          isGoal ? "rounded-md" : "rounded-full",
        )}
        style={{ width: `${clamped}%`, backgroundColor: color }}
      />
    </div>
  );
}
