import { presentLightningCard } from "@/lib/academy/lessons/peel-leading-emoji";
import { lessonAnswerEmojiClass } from "@/components/academy/lesson/lesson-shared-styles";
import { cn } from "@/lib/utils/cn";

/** Shared glyph for an answer, option, item, or chip emoji. */
export function AnswerEmoji({
  emoji,
  className,
}: {
  emoji?: string;
  className?: string;
}) {
  const glyph = emoji?.trim();
  if (!glyph) return null;
  return (
    <span
      className={cn(lessonAnswerEmojiClass, "inline-block shrink-0", className)}
      aria-hidden
    >
      {glyph}
    </span>
  );
}

/**
 * One emoji beside the words. A leading emoji in the label is pulled out so it
 * does not inherit the text size. The words stay the same.
 */
export function AnswerEmojiLabel({
  emoji,
  label,
  className,
}: {
  emoji?: string;
  label: string;
  className?: string;
}) {
  const shown = presentLightningCard({ emoji, label });
  if (!shown.emoji) return <>{shown.label}</>;
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <AnswerEmoji emoji={shown.emoji} />
      {shown.label ? <span className="min-w-0">{shown.label}</span> : null}
    </span>
  );
}
