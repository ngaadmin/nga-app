import type {
  AdvancePolicy,
  ScreenAuthoringMeta,
  ScreenConfig,
} from "@/lib/academy/lessons/types";

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeAuthoring(
  base?: ScreenAuthoringMeta,
  patch?: ScreenAuthoringMeta,
): ScreenAuthoringMeta | undefined {
  if (!base && !patch) return undefined;
  return { ...base, ...patch };
}

function mergeAdvance(
  base?: AdvancePolicy,
  patch?: AdvancePolicy,
): AdvancePolicy | undefined {
  if (!patch) return base;
  if (!base) return patch;
  if (patch.mode === "validate-on-next" && base.mode === "validate-on-next") {
    return {
      mode: "validate-on-next",
      rules: patch.rules.length ? patch.rules : base.rules,
    };
  }
  return patch;
}

/** Partial screen patch keyed by screen `id`. Set `_replace: true` to swap the entire screen. */
export type ScreenOverridePatch = Partial<ScreenConfig> & { _replace?: boolean };

/** Partial screen config keyed by screen `id` (e.g. `"hook-word-drop"`). */
export type ScreenOverrideMap = Partial<Record<string, ScreenOverridePatch>>;

/**
 * Deep-merge a partial screen patch into a base screen.
 * Arrays (items, buckets, options, rounds) replace entirely — never concatenated.
 * Nested objects (optionA, optionB, authoring) merge field-by-field.
 * When `_replace: true`, the patch replaces the whole screen (use for completion pane swaps).
 */
export function mergeScreenConfig<T extends ScreenConfig>(
  base: T,
  override: ScreenOverridePatch,
): T {
  if (override._replace) {
    const replacement = { ...override };
    delete (replacement as ScreenOverridePatch)._replace;
    return replacement as T;
  }

  const result: PlainObject = { ...base };

  for (const key of Object.keys(override) as (keyof T)[]) {
    if (key === "_replace") {
      continue;
    }

    const value = override[key as keyof ScreenOverridePatch];
    if (value === undefined) {
      continue;
    }

    const baseValue = base[key];

    if (key === "authoring") {
      result.authoring = mergeAuthoring(
        baseValue as ScreenAuthoringMeta | undefined,
        value as ScreenAuthoringMeta,
      );
      continue;
    }

    if (key === "advance") {
      result.advance = mergeAdvance(
        baseValue as AdvancePolicy | undefined,
        value as AdvancePolicy,
      );
      continue;
    }

    if (isPlainObject(value) && isPlainObject(baseValue)) {
      result[key as string] = mergeScreenConfig(
        baseValue as unknown as ScreenConfig,
        value as ScreenOverridePatch,
      );
    } else {
      result[key as string] = value;
    }
  }

  return result as T;
}

/**
 * Apply cohort-specific overrides onto a shared base screen array.
 * Screens without an override entry pass through unchanged.
 */
export function applyCohortScreenOverrides(
  baseScreens: readonly ScreenConfig[],
  overrides?: ScreenOverrideMap,
): ScreenConfig[] {
  if (!overrides || Object.keys(overrides).length === 0) {
    return [...baseScreens];
  }

  return baseScreens.map((screen) => {
    const patch = overrides[screen.id];
    if (!patch) {
      return screen;
    }
    return mergeScreenConfig(screen, patch);
  });
}

/**
 * Merge cohort-specific text tokens into screen copy fields.
 * Replaces `{character}`, `{support}`, `{Character}`, `{Support}` in string fields.
 */
export function applyCharacterTokensToScreen(
  screen: ScreenConfig,
  tokens: { lead?: string; support?: string },
): ScreenConfig {
  const replace = (text: string) =>
    text
      .replace(/\{character\}/gi, tokens.lead ?? "the character")
      .replace(/\{support\}/gi, tokens.support ?? "their friend")
      .replace(/\{Character\}/g, tokens.lead ?? "The character")
      .replace(/\{Support\}/g, tokens.support ?? "Their friend");

  const patchStrings = (obj: PlainObject): PlainObject => {
    const out: PlainObject = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === "string") out[k] = replace(v);
      else if (isPlainObject(v)) out[k] = patchStrings(v);
      else out[k] = v;
    }
    return out;
  };

  return patchStrings(screen as PlainObject) as ScreenConfig;
}
