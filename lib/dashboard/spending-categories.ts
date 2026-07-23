export type DefaultSpendingCategoryId =
  | "food-snacks"
  | "fun-entertainment"
  | "personal-items"
  | "gifts"
  | "other";

export type CustomSpendingCategoryId = `spend-cat-${string}`;

export type SpendingCategoryId = DefaultSpendingCategoryId | CustomSpendingCategoryId;

export type SpendingCategory = {
  id: SpendingCategoryId;
  label: string;
  isDefault: boolean;
};

export type SpendingCategoryOverrides = Partial<Record<DefaultSpendingCategoryId, string>>;

export type CustomSpendingCategory = {
  id: CustomSpendingCategoryId;
  label: string;
};

export const DEFAULT_SPENDING_CATEGORY_IDS: DefaultSpendingCategoryId[] = [
  "food-snacks",
  "fun-entertainment",
  "personal-items",
  "gifts",
  "other",
];

export function createCustomSpendingCategoryId(): CustomSpendingCategoryId {
  return `spend-cat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultCustomSpendingCategory(label: string): CustomSpendingCategory {
  return {
    id: createCustomSpendingCategoryId(),
    label: label.trim(),
  };
}

export type SpendingCategoryLabelMap = Record<DefaultSpendingCategoryId, string>;

export function resolveSpendingCategories(
  defaultLabels: SpendingCategoryLabelMap,
  overrides: SpendingCategoryOverrides | undefined,
  customCategories: CustomSpendingCategory[] | undefined,
): SpendingCategory[] {
  const defaults: SpendingCategory[] = DEFAULT_SPENDING_CATEGORY_IDS.map((id) => ({
    id,
    label: overrides?.[id]?.trim() || defaultLabels[id],
    isDefault: true,
  }));

  const custom: SpendingCategory[] = (customCategories ?? [])
    .filter((entry) => entry.label.trim().length > 0)
    .map((entry) => ({
      id: entry.id,
      label: entry.label.trim(),
      isDefault: false,
    }));

  return [...defaults, ...custom];
}
