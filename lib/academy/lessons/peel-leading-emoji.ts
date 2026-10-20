const PICTOGRAPH =
  "\\p{Extended_Pictographic}(?:\\uFE0F|\\u200D\\p{Extended_Pictographic}\\uFE0F?)*";

const LEADING_PICTOGRAPH = new RegExp(`^(${PICTOGRAPH})\\s*`, "u");

const TRAILING_PICTOGRAPH = new RegExp(`\\s*(${PICTOGRAPH})$`, "u");

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

/** Leading and trailing emoji on a button label, such as a hold-to-fill control. */
export function peelEdgeEmojis(text: string): {
  leading?: string;
  trailing?: string;
  label: string;
} {
  const start = peelLeadingEmoji(text);
  const body = start.emoji ? start.label : text.trim();
  const trail = TRAILING_PICTOGRAPH.exec(body);
  const trailing = trail?.[1];
  if (!trail || !trailing) {
    return { ...(start.emoji ? { leading: start.emoji } : {}), label: body };
  }
  const label = body.slice(0, body.length - trail[0].length).trim();
  return {
    ...(start.emoji ? { leading: start.emoji } : {}),
    trailing,
    label,
  };
}
