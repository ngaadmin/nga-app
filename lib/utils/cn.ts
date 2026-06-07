type ClassValue = string | false | null | undefined;

/** Merge conditional class names without extra dependencies. */
export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(" ");
}
