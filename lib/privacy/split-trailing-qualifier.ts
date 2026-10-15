/**
 * Split a first-column label that ends with a parenthetical.
 * The qualifier keeps its brackets so the closing mark never wraps alone.
 */
export function splitTrailingQualifier(text: string): {
  label: string;
  qualifier: string | null;
} {
  const trimmed = text.trim();
  const match = trimmed.match(/^(.*\S)\s+(\([^)]*\))$/);
  if (!match?.[1] || !match[2]) {
    return { label: trimmed, qualifier: null };
  }
  return { label: match[1], qualifier: match[2] };
}
