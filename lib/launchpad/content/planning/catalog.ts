/**
 * Module 2 chip catalogs from the live framework (md5 7da91427), rows 15 and 17.
 * Option ids are stable slugs. "Add another service" is not given a catalog here.
 */

export type ChipOption = { id: string; label: string };

export type ServiceCatalog = {
  serviceId: string;
  packages: readonly ChipOption[];
  extras: readonly ChipOption[];
};

function chips(labels: readonly string[]): ChipOption[] {
  return labels.map((label) => ({ id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), label }));
}

/** Customer-interest time chips. Not the When can you work table. */
export const WHEN_OPTIONS: readonly ChipOption[] = chips(["Weekdays", "Before school", "After school", "Weekend days"]);

/** When can you work: eight independent intersections. Ids are stored exactly like this. */
export const AVAILABILITY_ROWS = [
  { key: "morning", label: "Morning", phrase: "mornings" },
  { key: "midday", label: "Midday", phrase: "midday" },
  { key: "afternoon", label: "Afternoon", phrase: "afternoons" },
  { key: "evening", label: "Evening", phrase: "evenings" },
] as const;

export const AVAILABILITY_COLUMNS = [
  { key: "weekday", label: "Weekdays", phrase: "weekday" },
  { key: "weekend", label: "Weekend days", phrase: "weekend" },
] as const;

export function availabilitySlotId(column: string, row: string): string {
  return `${column}_${row}`;
}

export const AVAILABILITY_SLOTS: readonly ChipOption[] = AVAILABILITY_COLUMNS.flatMap((column) =>
  AVAILABILITY_ROWS.map((row) => ({
    id: availabilitySlotId(column.key, row.key),
    label: `${column.phrase} ${row.phrase}`,
  })),
);

const AVAILABILITY_SLOT_IDS = new Set(AVAILABILITY_SLOTS.map((slot) => slot.id));

export function isAvailabilitySlot(id: string): boolean {
  return AVAILABILITY_SLOT_IDS.has(id);
}

/** One phrase per day column, such as "weekday mornings and afternoons". */
export function availabilityGroups(ids: readonly string[]): string[] {
  const selected = new Set(ids);
  return AVAILABILITY_COLUMNS.map((column) => {
    const parts = AVAILABILITY_ROWS.filter((row) => selected.has(availabilitySlotId(column.key, row.key))).map((row) => row.phrase);
    if (parts.length === 0) return "";
    const list = parts.length === 1 ? parts[0]! : parts.length === 2 ? `${parts[0]} and ${parts[1]}` : `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
    return `${column.phrase} ${list}`;
  }).filter(Boolean);
}

/** "weekday mornings and afternoons, and weekend mornings", or "…" when nothing is selected. */
export function availabilityPhrase(ids: readonly string[]): string {
  const groups = availabilityGroups(ids);
  if (groups.length === 0) return "…";
  if (groups.length === 1) return groups[0]!;
  return `${groups[0]}, and ${groups[1]}`;
}

/**
 * A, then A and B, then A, B, and C. The comma and the joining word come from
 * the caller, which reads them from the payload.
 */
/** First letter only. Use when a chip or typed value is placed after words that already started the sentence. */
export function lowerFirst(value: string): string {
  const text = value.trim();
  if (!text) return "";
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/** Same list as joinPhrase, with each value's first letter lowered because the list sits mid-sentence. */
export function joinMid(items: readonly string[], comma: string, andWord: string): string {
  return joinPhrase(items.map(lowerFirst), comma, andWord);
}

export function joinPhrase(items: readonly string[], comma: string, andWord: string): string {
  const rows = items.map((item) => item.trim()).filter((item) => item.length > 0);
  if (rows.length === 0) return "";
  if (rows.length === 1) return rows[0]!;
  if (rows.length === 2) return `${rows[0]} ${andWord} ${rows[1]}`;
  return `${rows.slice(0, -1).join(comma)}${comma}${andWord} ${rows[rows.length - 1]}`;
}

/** Saved picks, with a typed extra on the end. No extra leaves an availability sentence as availabilityPhrase wrote it. */
export function playedBackTimes(ids: readonly string[], extra: string | undefined, comma: string, andWord: string, mid = false): string {
  const typed = extra?.trim() ?? "";
  if (!typed && ids.length > 0 && ids.every(isAvailabilitySlot)) {
    const phrase = availabilityPhrase(ids);
    if (phrase === "…") return "";
    return mid ? lowerFirst(phrase) : phrase;
  }
  const groups = ids.length > 0 && ids.every(isAvailabilitySlot) ? availabilityGroups(ids) : ids.map(chipLabel);
  const shown = groups.filter((group) => group.length > 0 && group !== "…");
  if (!typed && shown.length === 0) return "";
  const parts = [...shown, ...(typed ? [shown.length > 0 || mid ? lowerFirst(typed) : typed] : [])];
  return mid ? joinMid(parts, comma, andWord) : joinPhrase(parts, comma, andWord);
}

export const SERVICE_CATALOGS: readonly ServiceCatalog[] = [
  {
    serviceId: "dog-walking",
    packages: chips(["15-minute walk", "30-minute walk", "45-minute walk", "60-minute walk"]),
    extras: [
      ...chips(["Photo updates", "Treats"]),
      { id: "solo-walk-one-dog", label: "Walk one dog only" },
      { id: "play-session", label: "Extra play time" },
    ],
  },
  {
    serviceId: "grooming",
    packages: chips(["Bath", "Nail trim", "Brush-out", "Full groom"]),
    extras: chips(["Nail polish", "Tooth brush", "Extra fluff dry", "Bow or bandana"]),
  },
  {
    serviceId: "dog-sitting",
    packages: chips(["Drop-in visit", "Half-day sitting", "Overnight stay"]),
    extras: chips(["Feeding", "Medication reminder", "Playtime photos"]),
  },
  {
    serviceId: "dog-training",
    packages: chips(["Basic manners session", "Puppy session", "Walk-and-train"]),
    extras: chips(["Homework card", "Progress notes", "Extra practice round"]),
  },
];

/** Row 17 N-T. One competitor check, written for dog walkers. */
export const COMPETITOR_ADDONS: readonly ChipOption[] = [
  ...chips([
    "Photo of the dog after every walk",
    "Short note of how the walk went + anything spotted",
  ]),
  { id: "solo-walk-one-dog-only", label: "Walk one dog only" },
  ...chips([
    "Weekend or after-school slots",
    "Meet and greet first for new customers",
    "Same person every visit",
    "Pickup and drop-off available",
  ]),
];

/** Row 17 do-differently ideas (AC17). "Something else" reveals an optional own-words field. */
export const DO_DIFFERENTLY: readonly ChipOption[] = chips([
  "Send photo updates after each job",
  "Offer weekend or after-school times",
  "Walk one dog at a time",
  "Include a short written update",
  "Offer a longer session",
  "Something else",
]);

export const SOMETHING_ELSE_ID = "something-else";

export function catalogFor(serviceId: string): ServiceCatalog | undefined {
  return SERVICE_CATALOGS.find((row) => row.serviceId === serviceId);
}

export function packageServiceId(packageId: string): string | undefined {
  return SERVICE_CATALOGS.find((row) => row.packages.some((item) => item.id === packageId))?.serviceId;
}

export function chipLabel(id: string): string {
  const all = [
    ...WHEN_OPTIONS,
    ...AVAILABILITY_SLOTS,
    ...COMPETITOR_ADDONS,
    ...DO_DIFFERENTLY,
    ...SERVICE_CATALOGS.flatMap((row) => [...row.packages, ...row.extras]),
  ];
  return all.find((item) => item.id === id)?.label ?? id;
}
