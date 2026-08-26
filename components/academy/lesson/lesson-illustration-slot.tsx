"use client";

import { useEffect, useState } from "react";
import {
  lessonIllustrationEmojiClass,
  lessonIllustrationImageClass,
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

type ImageLoadStatus = "idle" | "loading" | "loaded" | "failed";

/** Modest centred scene slot — sits below lesson chrome, above prompt copy. */
const DEFAULT_ILLUSTRATION_MAX_HEIGHT_PX = 220;

export function LessonIllustrationSlot({
  emoji,
  label,
  alt,
  src,
  scale,
  className,
}: LessonIllustrationSlotProps) {
  const [imageStatus, setImageStatus] = useState<ImageLoadStatus>("idle");

  useEffect(() => {
    if (!src) {
      setImageStatus("idle");
      return;
    }

    let cancelled = false;
    setImageStatus("loading");

    const probe = new Image();
    probe.onload = () => {
      if (cancelled) return;
      setImageStatus(probe.naturalWidth > 0 ? "loaded" : "failed");
    };
    probe.onerror = () => {
      if (!cancelled) setImageStatus("failed");
    };
    probe.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  if (src && imageStatus === "loaded") {
    const ariaLabel = alt ?? label ?? "Lesson illustration";
    const maxHeightPx =
      typeof scale === "number" && scale > 0
        ? Math.round(DEFAULT_ILLUSTRATION_MAX_HEIGHT_PX * scale)
        : undefined;

    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={src}
        alt={ariaLabel}
        className={cn(lessonIllustrationImageClass, className)}
        style={maxHeightPx ? { maxHeight: maxHeightPx } : undefined}
        decoding="async"
        loading="eager"
      />
    );
  }

  if (src && imageStatus === "loading") {
    return null;
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

  return null;
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
