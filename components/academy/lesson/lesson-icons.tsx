import type { SVGProps } from "react";
import { cn } from "@/lib/utils/cn";

type LessonIconProps = SVGProps<SVGSVGElement>;

const iconBase = "size-6 shrink-0";

function LessonSvg({ className, children, ...props }: LessonIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn(iconBase, className)}
      {...props}
    >
      {children}
    </svg>
  );
}

/** Reusable True glyph for the true/false template orb. */
export function LessonTrueIcon(props: LessonIconProps) {
  return (
    <LessonSvg {...props}>
      <path
        d="M5 12.5 10 17.5 19 6.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </LessonSvg>
  );
}

/** Reusable False glyph for the true/false template orb. */
export function LessonFalseIcon(props: LessonIconProps) {
  return (
    <LessonSvg {...props}>
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </LessonSvg>
  );
}
