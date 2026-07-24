import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import {
  lessonCardClass,
  lessonColumnLabelClass,
  lessonColumnLabelInkClass,
  lessonColumnLabelMutedClass,
  lessonColumnLabelSuccessClass,
  lessonErrorBannerClass,
  lessonGameAreaClass,
  lessonGameBoardClass,
  lessonGameHintClass,
  lessonImagePlaceholderClass,
  lessonImagePlaceholderCompactClass,
  lessonInlineErrorClass,
  lessonIconEmojiClass,
  lessonIconLabelClass,
  lessonIconMonogramClass,
  lessonIconOptionStackClass,
  lessonIconTapSelectedClass,
  lessonSortCompactCircleClass,
  lessonSortBucketActiveClass,
  lessonSortBucketCompactClass,
  lessonSortBucketErrorClass,
  lessonSortBucketHeaderClass,
  lessonSortBucketSurfaceClass,
  lessonSortPoolScrollClass,
  lessonSortStatementCardClass,
  lessonSortStatementListClass,
  lessonSortStatementPlacedClass,
  resolveSortBucketIcon,
  lessonSequenceGridClass,
  lessonSequencePoolCompleteClass,
  lessonSequenceSlotActiveClass,
  lessonSequenceSlotClass,
  lessonSequenceSlotErrorClass,
  lessonSequenceSlotFilledClass,
  lessonSequenceSlotLockedClass,
  lessonSequenceStepBadgeClass,
  lessonSequenceStepCardClass,
  lessonSequenceStepIconClass,
  lessonSequenceStepPlacedClass,
  lessonCircleSizeClass,
  lessonInstructionClass,
  lessonIntroClass,
  lessonMatchColumnHeaderGridClass,
  lessonMatchConnectorClass,
  lessonMatchConnectorSpacerClass,
  lessonMatchRowGridClass,
  lessonRevealBucketClass,
  lessonScreenFillClass,
  lessonSpentTotalBarClass,
  lessonSpentTotalBarCompleteClass,
  lessonSpentTotalLabelClass,
  lessonSpentTotalLabelCompleteClass,
  lessonSuccessMessageClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import type { SortBucketTone } from "@/lib/academy/lessons/types/shared-blocks";
import { cn } from "@/lib/utils/cn";

type LessonUiProps = {
  children: ReactNode;
  className?: string;
};

/** White elevated panel used by games and reveal areas. */
export const LessonCard = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function LessonCard({ children, className, ...props }, ref) {
  return (
    <div ref={ref} className={cn(lessonCardClass, className)} {...props}>
      {children}
    </div>
  );
});

type LessonColumnLabelProps = LessonUiProps & {
  tone?: "accent" | "ink" | "success" | "muted";
};

/** Uppercase column header (Events, Possibilities, pool labels). */
export function LessonColumnLabel({
  children,
  className,
  tone = "accent",
}: LessonColumnLabelProps) {
  const toneClass =
    tone === "ink"
      ? lessonColumnLabelInkClass
      : tone === "success"
        ? lessonColumnLabelSuccessClass
        : tone === "muted"
          ? lessonColumnLabelMutedClass
          : lessonColumnLabelClass;

  return <p className={cn(toneClass, className)}>{children}</p>;
}

type LessonScreenCopyProps = {
  title?: string;
  intro?: string;
  prompt?: string;
  emphasizeInstruction?: boolean;
};

/** Resolve intro vs prompt from lesson data fields. */
export function resolveLessonScreenCopy({
  title,
  intro,
  prompt,
  emphasizeInstruction,
}: LessonScreenCopyProps) {
  return {
    title,
    body: intro ?? prompt ?? "",
    emphasizeInstruction: emphasizeInstruction === true,
  };
}

type LessonScreenIntroProps = {
  title?: string;
  intro?: string;
  prompt?: string;
  emphasizeInstruction?: boolean;
  className?: string;
};

/** Standard title + intro copy block for lesson screens. */
export function LessonScreenIntro({
  title,
  intro,
  prompt,
  emphasizeInstruction = false,
  className,
}: LessonScreenIntroProps) {
  const { body, emphasizeInstruction: emphasize } = resolveLessonScreenCopy({
    title,
    intro,
    prompt,
    emphasizeInstruction,
  });
  const introClass = lessonIntroClass(emphasize);

  return (
    <div className={className}>
      {title ? <p className={lessonInstructionClass}>{title}</p> : null}
      {body ? (
        <p className={cn(title && "mt-2", introClass)}>{body}</p>
      ) : null}
    </div>
  );
}

type LessonScreenLayoutProps = LessonScreenIntroProps & {
  children: ReactNode;
  successMessage?: string | null;
  errorMessage?: string | null;
  errorVariant?: "banner" | "inline";
  fill?: boolean;
  gameClassName?: string;
  className?: string;
};

/**
 * Shared screen shell: intro copy, game/interaction area, optional success banner.
 */
export function LessonScreenLayout({
  title,
  intro,
  prompt,
  emphasizeInstruction,
  children,
  successMessage,
  errorMessage,
  errorVariant = "banner",
  fill = false,
  gameClassName,
  className,
}: LessonScreenLayoutProps) {
  if (fill) {
    return (
      <div className={cn(lessonScreenFillClass, className)}>
        <LessonScreenIntro
          title={title}
          intro={intro}
          prompt={prompt}
          emphasizeInstruction={emphasizeInstruction}
        />
        <div className={cn(lessonGameAreaClass, gameClassName)}>{children}</div>
        {errorMessage ? (
          <LessonErrorBanner variant={errorVariant}>{errorMessage}</LessonErrorBanner>
        ) : null}
        {successMessage ? (
          <LessonSuccessBanner>{successMessage}</LessonSuccessBanner>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className}>
      <LessonScreenIntro
        title={title}
        intro={intro}
        prompt={prompt}
        emphasizeInstruction={emphasizeInstruction}
      />
      {children}
      {errorMessage ? (
        <LessonErrorBanner variant={errorVariant}>{errorMessage}</LessonErrorBanner>
      ) : null}
      {successMessage ? (
        <LessonSuccessBanner>{successMessage}</LessonSuccessBanner>
      ) : null}
    </div>
  );
}

export function LessonGameBoard({ children, className }: LessonUiProps) {
  return <div className={cn(lessonGameBoardClass, className)}>{children}</div>;
}

export function LessonSuccessBanner({
  children,
  className,
  centered = false,
}: LessonUiProps & { centered?: boolean }) {
  return (
    <p className={cn(lessonSuccessMessageClass, centered && "text-center", className)}>
      {children}
    </p>
  );
}

type LessonErrorBannerProps = LessonUiProps & {
  variant?: "banner" | "inline";
};

export function LessonErrorBanner({
  children,
  className,
  variant = "banner",
}: LessonErrorBannerProps) {
  return (
    <p
      className={cn(
        variant === "banner" ? lessonErrorBannerClass : lessonInlineErrorClass,
        className,
      )}
      role={variant === "banner" ? "alert" : undefined}
    >
      {children}
    </p>
  );
}

export function LessonGameHint({ children, className }: LessonUiProps) {
  return <p className={cn(lessonGameHintClass, className)}>{children}</p>;
}

type LessonMatchColumnHeadersProps = {
  left: string;
  right: string;
  className?: string;
};

export function LessonMatchColumnHeaders({
  left,
  right,
  className,
}: LessonMatchColumnHeadersProps) {
  return (
    <div className={cn(lessonMatchColumnHeaderGridClass, className)}>
      <LessonColumnLabel>{left}</LessonColumnLabel>
      <span className={lessonMatchConnectorSpacerClass} aria-hidden />
      <LessonColumnLabel>{right}</LessonColumnLabel>
    </div>
  );
}

type LessonMatchConnectorProps = {
  matched?: boolean;
  pulsing?: boolean;
  className?: string;
};

export function LessonMatchConnector({
  matched = false,
  pulsing = false,
  className,
}: LessonMatchConnectorProps) {
  return (
    <div
      className={cn(lessonMatchConnectorClass(matched, pulsing), className)}
      aria-hidden
    />
  );
}

export const LessonMatchRow = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function LessonMatchRow({ children, className, ...props }, ref) {
  return (
    <div ref={ref} className={cn(lessonMatchRowGridClass, className)} {...props}>
      {children}
    </div>
  );
});

type LessonImagePlaceholderProps = {
  label: string;
  alt?: string;
  size?: "hero" | "compact";
  className?: string;
};

export function LessonImagePlaceholder({
  label,
  alt,
  size = "hero",
  className,
}: LessonImagePlaceholderProps) {
  return (
    <div
      className={cn(
        size === "compact"
          ? lessonImagePlaceholderCompactClass
          : cn(lessonImagePlaceholderClass, "aspect-[5/3]"),
        className,
      )}
      role="img"
      aria-label={alt ?? label}
    >
      <LessonColumnLabel>Image placeholder</LessonColumnLabel>
      <p className="mt-1 font-heading text-sm font-bold text-[#031F82]">{label}</p>
    </div>
  );
}

type LessonRevealBucketProps = LessonUiProps & {
  label?: string;
  revealed?: boolean;
};

export function LessonRevealBucket({
  children,
  label,
  revealed = false,
  className,
}: LessonRevealBucketProps) {
  return (
    <div className={cn(lessonRevealBucketClass, className)}>
      {label ? (
        <LessonColumnLabel tone={revealed ? "success" : "accent"}>
          {label}
        </LessonColumnLabel>
      ) : null}
      {children}
    </div>
  );
}

type LessonSpentTotalBarProps = {
  label: string;
  complete?: boolean;
  className?: string;
};

export function LessonSpentTotalBar({
  label,
  complete = false,
  className,
}: LessonSpentTotalBarProps) {
  return (
    <div
      className={cn(
        complete ? lessonSpentTotalBarCompleteClass : lessonSpentTotalBarClass,
        className,
      )}
    >
      <p
        className={
          complete
            ? lessonSpentTotalLabelCompleteClass
            : lessonSpentTotalLabelClass
        }
        aria-live="polite"
      >
        {label}
      </p>
    </div>
  );
}

type LessonSortPoolProps = LessonUiProps & {
  label?: string;
  emptyLabel?: string;
  isEmpty?: boolean;
};

/** Compact drag pool tray for bucket-sort screens. */
export function LessonSortPool({
  children,
  label = "Items to sort",
  emptyLabel = "All sorted!",
  isEmpty = false,
  className,
}: LessonSortPoolProps) {
  return (
    <LessonCard className={cn("shrink p-2.5", className)}>
      <LessonColumnLabel tone="muted" className="text-xs sm:text-sm">
        {label}
      </LessonColumnLabel>
      {isEmpty ? (
        <p className="mt-1.5 text-center font-heading text-sm font-bold text-[#22C55E]">
          {emptyLabel}
        </p>
      ) : (
        <div className={cn(lessonSortPoolScrollClass, "mt-1.5")}>
          <div className={lessonSortStatementListClass}>{children}</div>
        </div>
      )}
    </LessonCard>
  );
}

type LessonSortStatementCardProps = {
  label: string;
  emoji?: string;
  price?: number;
  isDragging?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

/** Draggable statement pill for bucket-sort pools (text once, optional inline emoji). */
export const LessonSortStatementCard = forwardRef<
  HTMLButtonElement,
  LessonSortStatementCardProps
>(function LessonSortStatementCard(
  { label, emoji, price, isDragging = false, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(
        lessonSortStatementCardClass,
        isDragging && "opacity-40",
        className,
      )}
      style={{ touchAction: "none", ...props.style }}
      {...props}
    >
      {emoji ? (
        <span className="shrink-0 text-base leading-none sm:text-lg" aria-hidden>
          {emoji}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
      {price !== undefined ? (
        <span className="shrink-0 font-heading font-extrabold text-[#0CC1E0]">
          ${price}
        </span>
      ) : null}
    </button>
  );
});

type LessonSortStatementPlacedProps = {
  label: string;
  emoji?: string;
  price?: number;
  className?: string;
};

/** Read-only statement card inside a drop bucket. */
export function LessonSortStatementPlaced({
  label,
  emoji,
  price,
  className,
}: LessonSortStatementPlacedProps) {
  return (
    <div className={cn(lessonSortStatementPlacedClass, className)}>
      <span className="flex items-start gap-1.5">
        {emoji ? (
          <span className="shrink-0 leading-none" aria-hidden>
            {emoji}
          </span>
        ) : null}
        <span className="min-w-0 flex-1">{label}</span>
        {price !== undefined ? (
          <span className="shrink-0 font-extrabold text-[#0CC1E0]">${price}</span>
        ) : null}
      </span>
    </div>
  );
}

/** Two-column bucket drop zone row — pinned below the scrollable pool. */
export function LessonSortBucketRow({
  children,
  className,
}: LessonUiProps) {
  return (
    <div className={cn("grid shrink-0 grid-cols-2 gap-2", className)}>
      {children}
    </div>
  );
}

type LessonSortBucketProps = HTMLAttributes<HTMLDivElement> & {
  bucketId: string;
  label: string;
  tone?: SortBucketTone;
  icon?: string;
  active?: boolean;
  error?: boolean;
};

/** Tinted drop bucket with optional header icon for statement-sort layouts. */
export const LessonSortBucket = forwardRef<HTMLDivElement, LessonSortBucketProps>(
  function LessonSortBucket(
    {
      bucketId,
      label,
      tone,
      icon,
      active = false,
      error = false,
      children,
      className,
      ...props
    },
    ref,
  ) {
    const headerIcon = resolveSortBucketIcon(bucketId, tone, icon);

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col rounded-2xl border-2 border-dashed p-2 transition-colors",
          lessonSortBucketCompactClass,
          lessonSortBucketSurfaceClass(bucketId, tone),
          active && lessonSortBucketActiveClass,
          error && lessonSortBucketErrorClass,
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "flex items-center gap-1.5 font-heading text-[10px] font-bold uppercase tracking-wide sm:text-xs",
            lessonSortBucketHeaderClass(bucketId, tone),
          )}
        >
          {headerIcon ? (
            <span className="text-base leading-none" aria-hidden>
              {headerIcon}
            </span>
          ) : null}
          <span className="min-w-0 flex-1 leading-tight">{label}</span>
        </div>
        <div className="mt-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {children}
        </div>
      </div>
    );
  },
);

type LessonSequenceSortBoardProps = LessonUiProps & {
  rowCount: number;
  poolComplete?: boolean;
};

/** Two-column grid: shuffled steps on the left, ordered slots on the right. */
export function LessonSequenceSortBoard({
  children,
  rowCount,
  poolComplete = false,
  className,
}: LessonSequenceSortBoardProps) {
  return (
    <LessonCard className={cn("flex min-h-0 flex-1 flex-col p-3 sm:p-4", className)}>
      <div
        className={lessonSequenceGridClass}
        style={{
          gridTemplateRows: `repeat(${rowCount}, minmax(2.625rem, 1fr))`,
        }}
      >
        {poolComplete ? (
          <div
            className={lessonSequencePoolCompleteClass}
            style={{ gridRow: `1 / span ${rowCount}` }}
          >
            <p className="text-center font-heading text-xs font-bold text-[#22C55E]">
              All sorted!
            </p>
          </div>
        ) : null}
        {children}
      </div>
    </LessonCard>
  );
}

type LessonSequenceStepCardProps = {
  label: string;
  emoji?: string;
  isDragging?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

/** Draggable step pill for sequence-sort pools. */
export const LessonSequenceStepCard = forwardRef<
  HTMLButtonElement,
  LessonSequenceStepCardProps
>(function LessonSequenceStepCard(
  { label, emoji, isDragging = false, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(
        lessonSequenceStepCardClass,
        isDragging && "opacity-40",
        className,
      )}
      style={{ touchAction: "none", ...props.style }}
      {...props}
    >
      {emoji ? (
        <span className={lessonSequenceStepIconClass} aria-hidden>
          {emoji}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
    </button>
  );
});

type LessonSequenceStepPlacedProps = {
  label: string;
  emoji?: string;
  className?: string;
};

/** Read-only step pill shown inside a filled slot. */
export function LessonSequenceStepPlaced({
  label,
  emoji,
  className,
}: LessonSequenceStepPlacedProps) {
  return (
    <div className={cn(lessonSequenceStepPlacedClass, className)}>
      {emoji ? (
        <span className={lessonSequenceStepIconClass} aria-hidden>
          {emoji}
        </span>
      ) : null}
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
    </div>
  );
}

type LessonSequenceSlotProps = HTMLAttributes<HTMLDivElement> & {
  stepIndex: number;
  stepLabel: string;
  active?: boolean;
  error?: boolean;
  locked?: boolean;
  isEmpty?: boolean;
};

/** Ordered drop slot — rounded pill matching pool cards. */
export const LessonSequenceSlot = forwardRef<HTMLDivElement, LessonSequenceSlotProps>(
  function LessonSequenceSlot(
    {
      stepIndex,
      stepLabel,
      active = false,
      error = false,
      locked = false,
      isEmpty = true,
      children,
      className,
      ...props
    },
    ref,
  ) {
    return (
      <div
        ref={ref}
        className={cn(
          lessonSequenceSlotClass,
          active && lessonSequenceSlotActiveClass,
          error && lessonSequenceSlotErrorClass,
          locked && lessonSequenceSlotLockedClass,
          !isEmpty && lessonSequenceSlotFilledClass,
          className,
        )}
        {...props}
      >
        <span className={lessonSequenceStepBadgeClass} aria-label={stepLabel}>
          {stepIndex + 1}
        </span>
        {isEmpty ? (
          <p className="w-full text-center font-sans text-[10px] text-[#1E3A5F]/45 sm:text-xs">
            Drop here
          </p>
        ) : (
          children
        )}
      </div>
    );
  },
);

type LessonIconDisplayMode = "emoji-label" | "emoji-only" | "label";

type LessonIconOptionProps = {
  label: string;
  emoji?: string;
  selected?: boolean;
  disabled?: boolean;
  hideLabel?: boolean;
  display?: LessonIconDisplayMode;
  className?: string;
  stackStyle?: CSSProperties;
  chipClassName?: string;
  labelClassName?: string;
  interactive?: boolean;
  size?: "default" | "compact";
} & Omit<HTMLAttributes<HTMLButtonElement>, "children">;

/**
 * Standard circular lesson option — emoji (or monogram) in circle, label below once.
 * Use for drag-sort pools, tap-reveal grids, and spotlight rounds.
 */
export const LessonIconOption = forwardRef<
  HTMLButtonElement,
  LessonIconOptionProps
>(function LessonIconOption(
  {
    label,
    emoji,
    selected = false,
    disabled = false,
    hideLabel = false,
    display = "emoji-label",
    className,
    stackStyle,
    chipClassName,
    labelClassName,
    interactive = true,
    size = "default",
    ...buttonProps
  },
  ref,
) {
  const isCompact = size === "compact";
  const showEmoji = display !== "label" && Boolean(emoji);
  const showLabelBelow =
    !hideLabel && display !== "emoji-only" && display !== "label";

  const circleContent = showEmoji ? (
    <span
      className={cn(
        isCompact ? "text-3xl leading-none sm:text-[2.125rem]" : lessonIconEmojiClass,
      )}
      aria-hidden
    >
      {emoji}
    </span>
  ) : display === "label" ? (
    <span className="px-3 font-heading text-sm font-semibold leading-snug text-[#031F82] sm:text-base">
      {label}
    </span>
  ) : (
    <span
      className={cn(
        isCompact
          ? "font-heading text-xl font-extrabold uppercase text-[#031F82] sm:text-2xl"
          : lessonIconMonogramClass,
      )}
      aria-hidden
    >
      {label.trim().charAt(0) || "?"}
    </span>
  );

  const chip = interactive ? (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-full border-2 border-[#BDE9FB] bg-[#F7FBFF] shadow-sm transition-all hover:bg-[#EEF6FC] active:scale-[0.98]",
        isCompact ? lessonSortCompactCircleClass : lessonCircleSizeClass,
        selected && lessonIconTapSelectedClass,
        disabled && "pointer-events-none opacity-60",
        chipClassName,
      )}
      {...buttonProps}
    >
      {circleContent}
      {selected ? (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#066B7C] text-[10px] font-extrabold text-white shadow-sm"
          aria-hidden
        >
          ✓
        </span>
      ) : null}
    </button>
  ) : (
    <div
      className={cn(
        "pointer-events-none flex shrink-0 items-center justify-center rounded-full border-2 border-[#BDE9FB] bg-[#F7FBFF] shadow-sm",
        isCompact ? lessonSortCompactCircleClass : lessonCircleSizeClass,
        chipClassName,
      )}
      aria-hidden={showLabelBelow}
    >
      {circleContent}
    </div>
  );

  return (
    <div
      className={cn(
        lessonIconOptionStackClass,
        isCompact && "max-w-[5.75rem] gap-1.5",
        className,
      )}
      style={stackStyle}
    >
      {chip}
      {showLabelBelow ? (
        <span
          className={cn(
            lessonIconLabelClass,
            isCompact && "text-sm leading-tight sm:text-base",
            labelClassName,
          )}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
});

/** Read-only icon tile for reveal buckets (emoji + optional label below). */
export function LessonIconReveal({
  label,
  emoji,
  display = "emoji-label",
  className,
}: {
  label: string;
  emoji?: string;
  display?: LessonIconDisplayMode;
  className?: string;
}) {
  if (display === "label") {
    return (
      <span className={cn(lessonIconLabelClass, className)}>{label}</span>
    );
  }

  return (
    <LessonIconOption
      label={label}
      emoji={emoji}
      display={display}
      interactive={false}
      className={className}
    />
  );
}
