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
  lessonSortBucketActiveClass,
  lessonSortBucketCompactClass,
  lessonSortBucketErrorClass,
  lessonSortBucketHeaderClass,
  lessonSortBucketSurfaceClass,
  lessonSortPoolStaticClass,
  lessonSortStatementCardClass,
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
  lessonSortBucketNeutralSurfaceClass,
  lessonSuccessMessageClass,
  lessonSortItemEmojiClass,
  lessonWrongSelectionChipClass,
  type LessonChoiceVariant,
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
  /** Keeps success banner space in fill layouts to avoid slider layout jumps. */
  reserveSuccessSlot?: boolean;
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
  reserveSuccessSlot = false,
  gameClassName,
  className,
}: LessonScreenLayoutProps) {
  const showSuccessSlot = Boolean(successMessage) || reserveSuccessSlot;

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
        {showSuccessSlot ? (
          <div className="min-h-[4.75rem] shrink-0">
            {successMessage ? (
              <LessonSuccessBanner>{successMessage}</LessonSuccessBanner>
            ) : null}
          </div>
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
  label = "Items to sort",
  emptyLabel = "All sorted!",
  isEmpty = false,
  className,
}: LessonSortPoolProps) {
  if (isEmpty) {
    return (
      <p className={cn("shrink-0 py-1 text-center", lessonColumnLabelSuccessClass)}>
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className={cn("shrink-0", className)}>
      <LessonColumnLabel tone="muted">{label}</LessonColumnLabel>
      <div className={cn(lessonSortPoolStaticClass, "mt-1")}>
        <div className={lessonSortStatementListClass}>{children}</div>
      </div>
    </div>
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
  const usePricedRow = Boolean(emoji && price !== undefined);

  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(
        lessonSortStatementCardClass,
        usePricedRow && "justify-start text-left",
        isDragging && "opacity-40",
        className,
      )}
      style={{ touchAction: "none", ...props.style }}
      {...props}
    >
      {usePricedRow ? (
        <LessonPricedSortItemContent label={label} emoji={emoji} price={price} />
      ) : (
        <>
          {emoji ? (
            <span className={lessonSortItemEmojiClass} aria-hidden>
              {emoji}
            </span>
          ) : null}
          <span className="min-w-0 flex-1 text-center leading-snug">{label}</span>
          {price !== undefined ? (
            <span className={lessonPricedItemPriceClass}>${price}</span>
          ) : null}
        </>
      )}
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
  const usePricedRow = Boolean(emoji && price !== undefined);

  return (
    <div className={cn(lessonSortStatementPlacedClass, className)}>
      {usePricedRow ? (
        <LessonPricedSortItemContent label={label} emoji={emoji} price={price} />
      ) : (
        <span className="flex items-center justify-center gap-1.5 text-center">
          {emoji ? (
            <span className={lessonSortItemEmojiClass} aria-hidden>
              {emoji}
            </span>
          ) : null}
          <span className="min-w-0">{label}</span>
          {price !== undefined ? (
            <span className={lessonPricedItemPriceClass}>${price}</span>
          ) : null}
        </span>
      )}
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

/** Two-column bucket drop zone row — pinned below the scrollable pool. */
export function LessonSortBucketRow({
  children,
  className,
}: LessonUiProps) {
  return (
    <div className={cn("grid min-h-0 shrink-0 grid-cols-2 gap-2.5", className)}>
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
  /** Statement-sort: larger centred neutral header, no tone colours on title/icon. */
  prominentNeutralHeader?: boolean;
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
      prominentNeutralHeader = false,
      fillHeight = false,
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
          "flex flex-col rounded-2xl border-2 border-dashed transition-colors",
          prominentNeutralHeader ? "p-2 sm:p-2.5" : "p-2.5 sm:p-3",
          fillHeight
            ? "min-h-0 flex-1"
            : lessonSortBucketCompactClass,
          prominentNeutralHeader
            ? lessonSortBucketNeutralSurfaceClass
            : lessonSortBucketSurfaceClass(bucketId, tone),
          active && lessonSortBucketActiveClass,
          error && lessonSortBucketErrorClass,
          className,
        )}
        {...props}
      >
        <div
          className={cn(
            prominentNeutralHeader
              ? cn(
                  "flex flex-col items-center justify-center gap-0.5 text-center",
                  lessonColumnLabelInkClass,
                )
              : cn(
                  "flex items-center justify-center gap-1.5 text-center",
                  lessonColumnLabelClass,
                  lessonSortBucketHeaderClass(bucketId, tone),
                ),
          )}
        >
          {headerIcon ? (
            <span className={lessonSortItemEmojiClass} aria-hidden>
              {headerIcon}
            </span>
          ) : null}
          <span className={cn("leading-tight", prominentNeutralHeader && "w-full")}>
            {label}
          </span>
        </div>
        <div
          className={cn(
            "mt-1.5 flex flex-col gap-1",
            fillHeight && "min-h-0 flex-1",
            prominentNeutralHeader ? "overflow-visible" : "min-h-0 flex-1 gap-1.5 overflow-y-auto",
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
    selectionVariant = "neutral",
    ...buttonProps
  },
  ref,
) {
  const isCompact = size === "compact";
  const showEmoji = display !== "label" && Boolean(emoji);
  const showLabelBelow =
    !hideLabel && display !== "emoji-only" && display !== "label";
  const isWrongSelection = selectionVariant === "wrong";
  const isCorrectSelection = selectionVariant === "correct";
  const showSuccessBadge = isCorrectSelection;
  const showWrongBadge = isWrongSelection;

  const circleContent = showEmoji ? (
    <span className={lessonIconEmojiClass} aria-hidden>
      {emoji}
    </span>
  ) : display === "label" ? (
    <span className={cn(lessonIconLabelClass, "px-2")}>
      {label}
    </span>
  ) : (
    <span className={lessonIconMonogramClass} aria-hidden>
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
        lessonCircleSizeClass,
        isWrongSelection && lessonWrongSelectionChipClass,
        isCorrectSelection &&
          "border-[#16A34A] bg-[#F0FDF4] shadow-sm",
        selected && !isWrongSelection && !isCorrectSelection && lessonIconTapSelectedClass,
        disabled && "pointer-events-none opacity-60",
        chipClassName,
      )}
      {...buttonProps}
    >
      {circleContent}
      {showSuccessBadge ? (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#16A34A] text-[10px] font-extrabold text-white shadow-sm"
          aria-hidden
        >
          ✓
        </span>
      ) : null}
      {showWrongBadge ? (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#E11D48] text-[10px] font-extrabold text-white shadow-sm"
          aria-hidden
        >
          ✕
        </span>
      ) : null}
    </button>
  ) : (
    <div
      className={cn(
        "relative pointer-events-none flex shrink-0 items-center justify-center rounded-full border-2 border-[#BDE9FB] bg-[#F7FBFF] shadow-sm",
        lessonCircleSizeClass,
        isWrongSelection && lessonWrongSelectionChipClass,
        isCorrectSelection &&
          "border-[#16A34A] bg-[#F0FDF4] shadow-sm",
        selected && !isWrongSelection && !isCorrectSelection && lessonIconTapSelectedClass,
        chipClassName,
      )}
      aria-hidden={showLabelBelow}
    >
      {circleContent}
      {showSuccessBadge ? (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#16A34A] text-[10px] font-extrabold text-white shadow-sm"
          aria-hidden
        >
          ✓
        </span>
      ) : null}
      {showWrongBadge ? (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-[#E11D48] text-[10px] font-extrabold text-white shadow-sm"
          aria-hidden
        >
          ✕
        </span>
      ) : null}
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
            isCompact && "leading-tight",
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
  className,
}: {
  label: string;
  emoji?: string;
  display?: LessonIconDisplayMode;
  selected?: boolean;
  selectionVariant?: LessonChoiceVariant;
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
      selected={selected}
      selectionVariant={selectionVariant}
      className={className}
    />
  );
}
