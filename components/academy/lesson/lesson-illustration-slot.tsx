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
  /** Match screens use a 160px frame. Poster is the 196px slider hero. Compact is a short portrait for long choice lists. */
  frame?: "default" | "match" | "poster" | "compact";
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

const PICTURE_STYLE = {
  position: "absolute" as const,
  inset: 0,
  width: "100%",
  height: "100%",
  objectFit: "contain" as const,
};

/**
 * Paint the file inside a frame that already has a width and a height.
 * A detached Image() was marking real files as missing, then the slot
 * printed the file name in place of the picture.
 */
function FramedPicture({
  src,
  alt,
  emoji,
  className,
  imgClassName,
  imgStyle,
}: {
  src: string;
  alt: string;
  emoji?: string;
  className?: string;
  imgClassName: string;
  imgStyle?: { transform: string; transformOrigin: string };
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className={cn("relative", className)} role="img" aria-label={alt}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className={cn(imgClassName, failed && "hidden")}
        style={{ ...PICTURE_STYLE, ...imgStyle }}
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
      />
      {failed && emoji ? (
        <span className={lessonIllustrationEmojiClass} aria-hidden>
          {emoji}
        </span>
      ) : null}
    </div>
  );
}

export function LessonIllustrationSlot({
  emoji,
  label,
  alt,
  src,
  scale,
  className,
  frame = "default",
}: LessonIllustrationSlotProps) {
  const ariaLabel = alt ?? label ?? "Lesson illustration";

  if (frame === "match" || frame === "poster") {
    if (!src) return null;
    return (
      <FramedPicture
        src={src}
        alt={ariaLabel}
        emoji={emoji}
        className={
          frame === "poster"
            ? "mx-auto mb-2 h-[196px] w-full max-w-full"
            : "mx-auto mb-4 h-40 w-full max-w-full"
        }
        imgClassName="bg-transparent object-bottom"
      />
    );
  }

  if (src) {
    const scaleValue = typeof scale === "number" && scale > 0 ? scale : 1;
    return (
      <FramedPicture
        src={src}
        alt={ariaLabel}
        emoji={emoji}
        className={cn(
          frame === "compact"
            ? "relative mx-auto mb-1 h-[clamp(5.5rem,_16vh,_7.5rem)] w-[clamp(8rem,_52vw,_12rem)] max-w-full shrink-0 bg-transparent"
            : lessonIllustrationMediaFrameClass,
          "overflow-hidden bg-transparent",
          className,
        )}
        imgClassName="bg-transparent object-top"
        imgStyle={
          scaleValue === 1
            ? undefined
            : { transform: `scale(${scaleValue})`, transformOrigin: "center" }
        }
      />
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
