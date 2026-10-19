"use client";

import type { ButtonHTMLAttributes, CSSProperties, HTMLAttributes, ReactNode } from "react";
import { forwardRef, useEffect } from "react";
import { usePublishLessonHint } from "@/components/academy/lesson/lesson-hint";
import {
  lessonTileSelection,
  lessonTileShowsTick,
} from "@/lib/academy/lessons/lesson-tile-feedback";
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
  lessonItemOrbClass,
  lessonIconOptionStackClass,
  lessonSortBucketActiveClass,
  lessonSortBucketErrorClass,
  lessonSortBucketHeaderClass,
  lessonSortBucketSurfaceClass,
  lessonSortBucketRowClass,
  lessonSortBucketWellClass,
  lessonSortPoolStaticClass,
  lessonSortStatementCardClass,
  lessonSortStatementEmojiClass,
  lessonSortStatementListClass,
  lessonSortStatementPlacedClass,
  lessonPricedItemRowClass,
  lessonPricedItemTextClass,
  lessonPricedItemPriceClass,
  resolveSortBucketIcon,
  lessonSequenceDestinationSectionClass,
  lessonSequencePoolSectionClass,
  lessonSequenceShellClass,
  lessonSequenceNumberClass,
  lessonSequenceNumberedRowClass,
  lessonSequenceSlotActiveClass,
  lessonSequenceSlotClass,
  lessonSequenceSlotErrorClass,
  lessonSequenceSlotFilledClass,
  lessonSequenceSlotLockedClass,
  lessonSequenceStepCardClass,
  lessonSequenceStepPlacedClass,
  lessonCircleSizeClass,
  lessonCtaClass,
  lessonInstructionClass,
  lessonIntroClass,
  lessonMatchColumnHeaderGridClass,
  lessonMatchConnectorSpacerClass,
  lessonRevealBucketClass,
  lessonScreenFillClass,
  lessonSpentTotalBarClass,
  lessonSpentTotalBarCompleteClass,
  lessonSpentTotalAmountClass,
  lessonSpentTotalCaptionClass,
  lessonSuccessMessageClass,
  lessonSortItemEmojiClass,
  lessonWrongSelectionChipClass,
  type LessonChoiceVariant,
} from "@/components/academy/lesson/lesson-shared-styles";
import type { SortBucketTone } from "@/lib/academy/lessons/types/shared-blocks";
import { cn } from "@/lib/utils/cn";

type LessonUiProps = {
  children?: ReactNode;
  className?: string;
};

/** First non-empty payload string. Missing/blank → undefined (no invented copy). */
export function lessonFeedbackCopy(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) return trimmed;
  }
  return undefined;
}

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
  cta?: string;
  emphasizeInstruction?: boolean;
};

/** Resolve intro vs prompt from lesson data fields. */
export function resolveLessonScreenCopy({
  title,
  intro,
  prompt,
  cta,
  emphasizeInstruction,
}: LessonScreenCopyProps) {
  return {
    title,
    body: intro ?? prompt ?? "",
    cta,
    emphasizeInstruction: emphasizeInstruction === true,
  };
}

type LessonScreenIntroProps = {
  title?: string;
  intro?: string;
  prompt?: string;
  cta?: string;
  emphasizeInstruction?: boolean;
  className?: string;
};

/** Standard title + intro copy block for lesson screens. */
export function LessonScreenIntro({
  title,
  intro,
  prompt,
  cta,
  emphasizeInstruction = false,
  className,
}: LessonScreenIntroProps) {
  const { body, emphasizeInstruction: emphasize } = resolveLessonScreenCopy({
    title,
    intro,
    prompt,
    cta,
    emphasizeInstruction,
  });
  const introClass = lessonIntroClass(emphasize);

  return (
    <div className={className}>
      {title ? <p className={lessonInstructionClass}>{title}</p> : null}
      {body ? (
        <p className={cn(title && "mt-2", introClass, "mb-5")}>{body}</p>
      ) : null}
      {cta ? (
        <p className={cn((title || body) && "mt-2", lessonCtaClass)}>{cta}</p>
      ) : null}
    </div>
  );
}

type LessonScreenLayoutProps = LessonScreenIntroProps & {
  children: ReactNode;
  /** Kept for call sites. Correct feedback is the tick and ping, not a banner. */
  success?: boolean;
  /** @deprecated Ignored. Correct feedback is the tick and ping. */
  successMessage?: string | null;
  /** Hint copy. Empty string still publishes a hint slot; the text is the payload. */
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
  cta,
  children,
  success = false,
  successMessage,
  errorMessage,
  errorVariant = "banner",
  fill = false,
  gameClassName,
  className,
}: LessonScreenLayoutProps) {
  const showError = errorMessage != null;
  const errorCopy = lessonFeedbackCopy(errorMessage);
  usePublishLessonHint(showError ? errorCopy : null);
  void success;
  void successMessage;
  void errorVariant;

  if (fill) {
    return (
      <div className={cn(lessonScreenFillClass, className)}>
        <LessonScreenIntro
          title={title}
          intro={intro}
          prompt={prompt}
          cta={cta}
          emphasizeInstruction={emphasizeInstruction}
        />
        <div className={cn(lessonGameAreaClass, gameClassName)}>{children}</div>
      </div>
    );
  }

  return (
    <div className={className}>
      <LessonScreenIntro
        title={title}
        intro={intro}
        prompt={prompt}
        cta={cta}
        emphasizeInstruction={emphasizeInstruction}
      />
      {children}
    </div>
  );
}

export function LessonGameBoard({ children, className }: LessonUiProps) {
  return <div className={cn(lessonGameBoardClass, className)}>{children}</div>;
}

export function LessonSuccessBanner({
  className,
  centered = false,
}: LessonUiProps & { centered?: boolean }) {
  return (
    <div
      className={cn(lessonSuccessMessageClass, centered && "text-center", className)}
      role="status"
    >
      <span
        className="grid size-7 shrink-0 place-items-center rounded-full bg-[#FFB822] font-extrabold text-[#031F82]"
        aria-hidden
      >
        ✓
      </span>
    </div>
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
    <div
      className={cn(
        variant === "banner" ? lessonErrorBannerClass : lessonInlineErrorClass,
        className,
      )}
      role="alert"
    >
      <span
        className="grid size-7 shrink-0 place-items-center rounded-full bg-[#FFB822] font-extrabold text-[#031F82]"
        aria-hidden
      >
        !
      </span>
      {typeof children === "string" && children.trim() ? (
        <p className="min-w-0 flex-1">{children.trim()}</p>
      ) : children && typeof children !== "string" ? (
        <p className="min-w-0 flex-1">{children}</p>
      ) : null}
    </div>
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

export {
  LessonIllustrationSlot,
  LessonIllustrationSlotReserve,
} from "@/components/academy/lesson/lesson-illustration-slot";

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
      <p className="mt-1 max-w-full font-heading text-sm font-bold leading-snug text-[#031F82]">
        {label}
      </p>
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
  /** @deprecated Prefer caption + amount */
  label?: string;
  caption?: string;
  amount?: string;
  complete?: boolean;
  className?: string;
};

export function LessonSpentTotalBar({
  label,
  caption = "Total Amount Spent",
  amount,
  complete = false,
  className,
}: LessonSpentTotalBarProps) {
  if (label && !amount) {
    const match = label.match(/^(.*?):\s*(\$.+)$/);
    if (match) {
      caption = match[1]!.trim();
      amount = match[2]!.trim();
    } else {
      amount = label;
    }
  }

  return (
    <div
      className={cn(
        complete ? lessonSpentTotalBarCompleteClass : lessonSpentTotalBarClass,
        className,
      )}
    >
      <p className={lessonSpentTotalCaptionClass}>{caption}</p>
      <p className={lessonSpentTotalAmountClass} aria-live="polite">
        {amount ?? "$0"}
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
  label,
  className,
}: LessonSortPoolProps) {
  return (
    <div className={cn("relative shrink-0", className)}>
      {label ? <LessonColumnLabel tone="muted">{label}</LessonColumnLabel> : null}
      <div className={cn(lessonSortPoolStaticClass, label && "mt-1")}>
        <div className={lessonSortStatementListClass}>{children}</div>
      </div>
    </div>
  );
}

function SortItemEmoji({ emoji }: { emoji?: string }) {
  const glyph = emoji?.trim();
  if (!glyph) return null;
  return (
    <span className={lessonItemOrbClass} aria-hidden>
      <span className="text-2xl leading-none">{glyph}</span>
    </span>
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
        isDragging && "invisible",
        className,
      )}
      style={{ touchAction: "none", ...props.style }}
      {...props}
    >
      <SortItemEmoji emoji={emoji} />
      <span className="min-w-0 leading-snug">
        {label}
        {price !== undefined ? ` · $${price}` : ""}
      </span>
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
      <SortItemEmoji emoji={emoji} />
      <span className="min-w-0">
        {label}
        {price !== undefined ? ` · $${price}` : ""}
      </span>
    </div>
  );
}

type LessonPricedSortItemContentProps = {
  label: string;
  emoji?: string;
  price?: number;
  formatPrice?: (price: number) => string;
};

/** Icon-left row with name and price stacked — shared by spent-total and priced sort cards. */
export function LessonPricedSortItemContent({
  label,
  emoji,
  price,
  formatPrice = (amount) => `$${amount}`,
}: LessonPricedSortItemContentProps) {
  return (
    <span className={lessonPricedItemRowClass}>
      {emoji ? (
        <span className={lessonSortItemEmojiClass} aria-hidden>
          {emoji}
        </span>
      ) : null}
      <span className={lessonPricedItemTextClass}>
        <span className="min-w-0 leading-snug">{label}</span>
        {price !== undefined ? (
          <span className={lessonPricedItemPriceClass}>{formatPrice(price)}</span>
        ) : null}
      </span>
    </span>
  );
}

/** Two-column destination buckets — pinned below the compact pool. */
export function LessonSortBucketRow({
  children,
  className,
}: LessonUiProps) {
  return (
    <div className={cn(lessonSortBucketRowClass, className)}>
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
  /** Grow to fill remaining vertical space in statement-sort layouts. */
  fillHeight?: boolean;
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
      fillHeight = false,
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
          "flex h-full min-h-0 min-w-0 flex-col gap-1.5",
          fillHeight && "flex-1",
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            "shrink-0 font-heading text-base font-bold text-[#031F82]",
          )}
        >
          <span className="min-w-0 text-balance leading-tight">{label}</span>
        </div>
        <div
          className={cn(
            "flex min-h-28 flex-1 flex-col items-stretch gap-2 rounded-2xl border-2 border-dashed border-[#BDE9FB] bg-[#F8FCFF] p-2 transition-colors",
            active && "border-[#0CC1E0] bg-[#E8F6FC]",
          )}
        >
          {children}
        </div>
      </div>
    );
  },
);

type LessonSequenceSortBoardProps = {
  pool?: ReactNode;
  destination: ReactNode;
  poolComplete?: boolean;
  poolClassName?: string;
  className?: string;
};

/** Vertical steps-row board — shuffled pool on top, numbered slots below. */
export function LessonSequenceSortBoard({
  pool,
  destination,
  poolComplete = false,
  poolClassName,
  className,
}: LessonSequenceSortBoardProps) {
  const showPool = !poolComplete && pool;

  return (
    <div className={cn(lessonSequenceShellClass, className)}>
      {showPool ? (
        <div className={cn(lessonSequencePoolSectionClass, poolClassName)}>
          {pool}
        </div>
      ) : null}
      <div className={lessonSequenceDestinationSectionClass}>{destination}</div>
      {poolComplete ? (
        <p className={cn("shrink-0 text-center", lessonColumnLabelSuccessClass)}>
          All sorted!
        </p>
      ) : null}
    </div>
  );
}

type LessonSequenceStepCardProps = {
  label: string;
  isDragging?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children">;

/** Draggable step pill for sequence-sort pools — text only. */
export const LessonSequenceStepCard = forwardRef<
  HTMLButtonElement,
  LessonSequenceStepCardProps
>(function LessonSequenceStepCard(
  { label, isDragging = false, className, type = "button", ...props },
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
      <span className="w-full text-left leading-snug">{label}</span>
    </button>
  );
});

type LessonSequenceStepPlacedProps = {
  label: string;
  className?: string;
};

/** Read-only step pill shown inside a filled slot — text only. */
export function LessonSequenceStepPlaced({
  label,
  className,
}: LessonSequenceStepPlacedProps) {
  return (
    <div className={cn(lessonSequenceStepPlacedClass, className)}>
      <span className="w-full text-left leading-snug">{label}</span>
    </div>
  );
}

type LessonSequenceNumberedRowProps = LessonUiProps & {
  stepNumber: number;
};

/** Step index outside the card/slot — matches rank-order layout. */
export function LessonSequenceNumberedRow({
  stepNumber,
  children,
  className,
}: LessonSequenceNumberedRowProps) {
  return (
    <div className={cn(lessonSequenceNumberedRowClass, className)}>
      <span className={lessonSequenceNumberClass} aria-hidden>
        {stepNumber}
      </span>
      {children}
    </div>
  );
}

type LessonSequenceSlotProps = HTMLAttributes<HTMLDivElement> & {
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
        aria-label={stepLabel}
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
        {isEmpty ? (
          <p className={cn("w-full text-center opacity-60", lessonGameHintClass)}>
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
  /** Replaces the emoji (or monogram) inside the circle. Label below is unchanged. */
  glyph?: ReactNode;
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
  /** Drives global correct/wrong chip styling. Wrong = red border, no tick. */
  selectionVariant?: LessonChoiceVariant;
} & Omit<HTMLAttributes<HTMLButtonElement>, "children">;

/** 28px gold tick. Correct feedback is this badge, never a green or red box. */
export function LessonAnswerTick({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "lesson-tick-pop grid size-7 shrink-0 place-items-center rounded-full bg-[#FFB822] text-[15px] font-extrabold leading-none text-[#031F82]",
        className,
      )}
      aria-hidden
    >
      ✓
    </span>
  );
}

function LessonTileTick() {
  return (
    <LessonAnswerTick className="absolute -right-1 -top-1 shadow-[0_2px_6px_rgba(3,31,130,0.25)]" />
  );
}

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
    glyph,
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
    selectionVariant = "neutral",
    ...buttonProps
  },
  ref,
) {
  const isCompact = size === "compact";
  const safeEmoji = emoji && !/^[A-Za-z]$/.test(emoji.trim()) ? emoji : undefined;
  const showEmoji = display !== "label" && Boolean(safeEmoji);
  const showLabelBelow =
    !hideLabel && display !== "emoji-only" && display !== "label";
  const isWrongSelection = selectionVariant === "wrong";
  const isCorrectSelection = selectionVariant === "correct";
  const tileSelection = lessonTileSelection({
    selected: (selected && !isWrongSelection) || isCorrectSelection,
    variant: isCorrectSelection ? "correct" : "neutral",
  });
  const showTick = lessonTileShowsTick(tileSelection);

  const circleContent = glyph ? (
    <span className="flex items-center justify-center" aria-hidden>
      {glyph}
    </span>
  ) : showEmoji ? (
    <span
      className={cn(
        isCompact ? lessonIconEmojiClass : "text-[32px] leading-none",
      )}
      aria-hidden
    >
      {safeEmoji}
    </span>
  ) : display === "label" ? (
    <span className={cn(lessonIconLabelClass, "px-2")}>
      {label}
    </span>
  ) : (
    <span className="sr-only">{label}</span>
  );

  const chip = interactive ? (
    <button
      ref={ref}
      type="button"
      {...buttonProps}
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      data-selection={tileSelection === "idle" ? undefined : tileSelection}
      className={cn(
        "lesson-choice-tile relative flex shrink-0 items-center justify-center rounded-full bg-[#EAF0FF] active:scale-[0.98]",
        size === "default" && "size-[88px]",
        isCompact && lessonCircleSizeClass,
        isWrongSelection && "lesson-tile-shake",
        disabled && "pointer-events-none opacity-60",
        chipClassName,
      )}
    >
      {circleContent}
      {showTick ? <LessonTileTick /> : null}
    </button>
  ) : (
    <div
      data-selection={tileSelection === "idle" ? undefined : tileSelection}
      className={cn(
        "lesson-choice-tile relative pointer-events-none flex shrink-0 items-center justify-center rounded-full bg-[#EAF0FF]",
        size === "default" && "size-[88px]",
        isCompact && lessonCircleSizeClass,
        isWrongSelection && "lesson-tile-shake",
        chipClassName,
      )}
      aria-hidden={showLabelBelow}
    >
      {circleContent}
      {showTick ? <LessonTileTick /> : null}
    </div>
  );

  return (
    <div
      className={cn(
        lessonIconOptionStackClass,
        isCompact && "w-full min-w-0 max-w-full gap-1.5",
        className,
      )}
      style={stackStyle}
    >
      {chip}
      {showLabelBelow ? (
        <span
          className={cn(
            isCompact
              ? "text-center font-sans text-[13px] font-semibold leading-tight text-[#031F82]"
              : lessonIconLabelClass,
            "whitespace-normal break-normal",
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
  selected = false,
  selectionVariant = "neutral",
  size = "default",
  className,
  labelClassName,
}: {
  label: string;
  emoji?: string;
  display?: LessonIconDisplayMode;
  selected?: boolean;
  selectionVariant?: LessonChoiceVariant;
  size?: "default" | "compact";
  className?: string;
  labelClassName?: string;
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
      selected={selected}
      selectionVariant={selectionVariant}
      size={size}
      className={className}
      labelClassName={labelClassName}
    />
  );
}
