const LEADING_PICTOGRAPH =
  /^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}\uFE0F?)*)\s*/u;

/** Split a leading emoji, including BMP pictographs such as ⏰, off a label. */
export function peelLeadingEmoji(text: string): { emoji?: string; label: string } {
  const trimmed = text.trim();
  const match = LEADING_PICTOGRAPH.exec(trimmed);
  const emoji = match?.[1];
  if (!match || !emoji) return { label: trimmed };
  const label = trimmed.slice(match[0].length).trim();
  return { emoji, label: label || trimmed };
}

/** One emoji beside the words. A repeated leading emoji stays off the label. */
export function presentLightningCard(card: {
  emoji?: string;
  label: string;
}): { emoji?: string; label: string } {
  const peeled = peelLeadingEmoji(card.label);
  const emoji = card.emoji ?? peeled.emoji;
  let label = card.emoji && peeled.emoji === card.emoji ? peeled.label : card.label;
  if (emoji && label.startsWith(emoji)) {
    label = label.slice(emoji.length).trim();
  }
  return { emoji, label };
}
