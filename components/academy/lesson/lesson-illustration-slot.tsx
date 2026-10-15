"use client";

import { useEffect, useState } from "react";
import {
  lessonIllustrationEmojiClass,
  lessonIllustrationLabelClass,
  lessonIllustrationMediaFrameClass,
  lessonIllustrationSlotClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import type { LessonIllustration } from "@/lib/academy/lessons/types/declarative";
import { cn } from "@/lib/utils/cn";

type LessonIllustrationSlotProps = LessonIllustration & {
  className?: string;
  /** Match screens use a 160px frame with the feet on the bottom edge. */
  frame?: "default" | "match";
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

export function LessonIllustrationSlot({
  emoji,
  label,
  alt,
  src,
  scale,
  className,
  frame = "default",
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

  if (frame === "match") {
    const ariaLabel = alt ?? label ?? "Lesson illustration";
    if (!src || imageStatus !== "loaded") {
      if (src) return <div className="mb-4 h-40 w-full" aria-hidden />;
      return null;
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={ariaLabel}
        className="mx-auto mb-4 block h-40 w-auto max-w-full object-contain object-bottom"
        decoding="async"
        loading="eager"
      />
    );
  }

  if (src && imageStatus === "loaded") {
    const ariaLabel = alt ?? label ?? "Lesson illustration";
    const scaleValue = typeof scale === "number" && scale > 0 ? scale : 1;

    return (
      <div
        className={cn(
          lessonIllustrationMediaFrameClass,
          "overflow-hidden bg-transparent",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={ariaLabel}
          className="h-full w-full bg-transparent object-contain object-top"
          style={scaleValue === 1 ? undefined : { transform: `scale(${scaleValue})` }}
          decoding="async"
          loading="eager"
        />
      </div>
    );
  }

  if (src && imageStatus === "loading") {
    return <LessonIllustrationSlotReserve className={className} />;
  }

  if (src && imageStatus === "failed") {
    return <LessonIllustrationSlotReserve className={className} />;
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
