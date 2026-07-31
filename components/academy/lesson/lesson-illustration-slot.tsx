"use client";

import { useEffect, useState } from "react";
import {
  lessonIllustrationEmojiClass,
  lessonIllustrationImageClass,
  lessonIllustrationImageSlotClass,
  lessonIllustrationLabelClass,
  lessonIllustrationSlotClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import type { LessonIllustration } from "@/lib/academy/lessons/types/declarative";
import { cn } from "@/lib/utils/cn";

type LessonIllustrationSlotProps = LessonIllustration & {
  className?: string;
};

function LessonIllustrationFallback({
  emoji,
  label,
  alt,
  className,
}: LessonIllustration & { className?: string }) {
  const ariaLabel = alt ?? label ?? "Lesson illustration";

  return (
    <div
      className={cn(lessonIllustrationSlotClass, className)}
      role="img"
      aria-label={ariaLabel}
    >
      {emoji ? (
        <span className={lessonIllustrationEmojiClass} aria-hidden>
          {emoji}
        </span>
      ) : null}
      {label ? (
        <p className={lessonIllustrationLabelClass}>{label}</p>
      ) : null}
    </div>
  );
}

/** Modest centred scene slot — sits below lesson chrome, above prompt copy. */
export function LessonIllustrationSlot({
  emoji,
  label,
  alt,
  src,
  className,
}: LessonIllustrationSlotProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (src && !imageFailed) {
    const ariaLabel = alt ?? label ?? "Lesson illustration";

    return (
      <div className={cn(lessonIllustrationImageSlotClass, className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={ariaLabel}
          className={lessonIllustrationImageClass}
          decoding="async"
          loading="eager"
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  if (emoji || label) {
    return (
      <LessonIllustrationFallback
        emoji={emoji}
        label={label}
        alt={alt}
        className={className}
      />
    );
  }

  return <LessonIllustrationSlotReserve className={className} />;
}

/** Reserved illustration frame for lighter screen types without scene content yet. */
export function LessonIllustrationSlotReserve({ className }: { className?: string }) {
  return (
    <div
      className={cn(lessonIllustrationSlotClass, className)}
      aria-hidden
    />
  );
}
