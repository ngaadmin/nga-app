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

/** "weekday mornings and afternoons, and weekend mornings", or "…" when nothing is selected. */
export function availabilityPhrase(ids: readonly string[]): string {
  const selected = new Set(ids);
  const groups = AVAILABILITY_COLUMNS.map((column) => {
    const parts = AVAILABILITY_ROWS.filter((row) => selected.has(availabilitySlotId(column.key, row.key))).map((row) => row.phrase);
    if (parts.length === 0) return "";
    const list = parts.length === 1 ? parts[0]! : parts.length === 2 ? `${parts[0]} and ${parts[1]}` : `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
    return `${column.phrase} ${list}`;
  }).filter(Boolean);
  if (groups.length === 0) return "…";
  if (groups.length === 1) return groups[0]!;
  return `${groups[0]}, and ${groups[1]}`;
}

export const SERVICE_CATALOGS: readonly ServiceCatalog[] = [
  {
    serviceId: "dog-walking",
    packages: chips(["15-minute walk", "30-minute walk", "45-minute walk", "60-minute walk"]),
    extras: chips(["Photo updates", "Treats", "Solo walk (one dog)", "Play session"]),
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
  {
    serviceId: "manage-bookings-for-others",
    packages: chips(["Take bookings", "Send owner reminders", "Collect payments"]),
    extras: chips(["Weekly summary", "Extra reminder texts"]),
  },
];

/** Row 17 N-T. One competitor check, written for dog walkers. */
export const COMPETITOR_ADDONS: readonly ChipOption[] = chips([
  "Photo updates",
  "Treats",
  "Solo walk (one dog)",
  "Weekend walks",
  "Walk notes or report",
  "Pickup and drop-off",
  "Meet and greet first",
]);

/** Row 17 do-differently ideas (AC17). "Something else" reveals an optional own-words field. */
export const DO_DIFFERENTLY: readonly ChipOption[] = chips([
  "Send photo updates after each job",
  "Offer weekend slots",
  "Offer before-school or after-school times",
  "Include treats",
  "Walk one dog at a time",
  "Include a written update",
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
