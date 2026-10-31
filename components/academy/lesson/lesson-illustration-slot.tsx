"use client";

import { useAcademyMediaSrc } from "@/lib/academy/media/academy-media-context";
import { useEffect, useState } from "react";
import {
  lessonIllustrationEmojiClass,
  lessonIllustrationLabelClass,
  lessonIllustrationMediaFrameClass,
  lessonIllustrationSlotClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import type { LessonIllustration } from "@/lib/academy/lessons/types/declarative";
import { cn } from "@/lib/utils/cn";
import { reportAcademyMediaFailed } from "@/lib/academy/media/media-failure-client";

type LessonIllustrationSlotProps = LessonIllustration & {
  className?: string;
  /** Match screens use a 160px frame. Poster is the 196px slider hero. Compact is a short portrait for long choice lists. Sort is the two-bucket picture, short enough to leave the chips and both buckets on screen. */
  frame?: "default" | "match" | "poster" | "compact" | "sort";
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

/** Neutral frame shown in place of a picture that failed to load. */
function MissingPicturePlaceholder() {
  return (
    <span
      className="absolute inset-2 flex items-center justify-center rounded-2xl border-2 border-dashed border-[#B9C7EA] bg-[#F4F7FF]"
      data-testid="academy-media-placeholder"
      aria-hidden
    >
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#8FA3D6" strokeWidth="1.6">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="M4 17l5-5 4 4 3-3 4 4" />
      </svg>
    </span>
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
  src: localSrc,
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
  const src = useAcademyMediaSrc(localSrc);
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
        loading="eager"
        fetchPriority="high"
        decoding="async"
        draggable={false}
        onError={() => {
          setFailed(true);
          reportAcademyMediaFailed(src, "image");
        }}
      />
      {failed ? (
        emoji ? (
          <span className={lessonIllustrationEmojiClass} aria-hidden>
            {emoji}
          </span>
        ) : (
          <MissingPicturePlaceholder />
        )
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
          frame === "sort"
            ? "relative mx-auto mb-1 h-[5.5rem] w-[8.5rem] max-w-full shrink-0 bg-transparent"
            : frame === "compact"
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
