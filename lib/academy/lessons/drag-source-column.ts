/**
 * Visible words in the source column of a drag-to-target screen.
 * Once the item has moved, the column is blank. The item name ("Gift box")
 * and the success line used to stay behind in that hole.
 * The drag button keeps the name for screen readers while the item is still there.
 */
export function visibleDragSourceLabel(input: {
  remaining: number;
  showZoneLabels: boolean;
  sourceLabel: string;
}): string | null {
  if (input.remaining <= 0 || !input.showZoneLabels) return null;
  const label = input.sourceLabel.trim();
  return label.length > 0 ? label : null;
}
