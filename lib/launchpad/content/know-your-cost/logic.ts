/**
 * Know your cost rules: which starter gear a learner sees, when Continue
 * unlocks, and how the workbook repeats the saved lines.
 *
 * Start-up amounts are whole dollars. Ongoing restock allows cents. $0 is a
 * real amount (the learner already has the thing). The slim totals screen is
 * optional: `showTotals` false skips it.
 */
import type { CostLine, CostsAnswer, LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { costsOf, selectionOf } from "@/lib/launchpad/content/answers";
import type {
  LaunchpadCostItem,
  LaunchpadFloor,
  LaunchpadKnowYourCostScreen,
} from "@/lib/launchpad/content/types";
import type { SupportedCurrencyCode } from "@/lib/dashboard/currency/currencies";
import { formatMoney, formatWholeMoney } from "@/lib/dashboard/currency/format-money";

export type ChosenService = { id: string; label: string };

export type CostEditorStep =
  | { name: "hub" }
  | { name: "startup" }
  | { name: "ongoing" }
  | { name: "service"; serviceId: string }
  | { name: "totals" }
  | { name: "workbook" };

export type CostWorkbookView = {
  marketing: readonly CostLine[];
  starterGear: readonly CostLine[];
  startupTotal: number;
  ongoing: readonly { serviceId: string; label: string; perJob: number }[];
  /** Start-up sum only. Ongoing stays per job. */
  grandTotal: number;
};

const lineFrom = (item: LaunchpadCostItem): CostLine => ({ id: item.id, label: item.label, amount: item.amount });

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

/** Offer options for an answer key, in authored order. */
export function offerOptions(floors: readonly LaunchpadFloor[], answerKey: string): ChosenService[] {
  for (const floor of floors)
    for (const silver of floor.silvers)
      for (const bronze of silver.bronzes)
        for (const task of bronze.tasks)
          for (const screen of task.screens)
            if (screen.type === "choice-capture" && screen.answerKey === answerKey)
              return screen.options.map((o) => ({ id: o.id, label: o.label }));
  return [];
}

/** Services the learner picked, in pick order. Unknown ids are dropped. */
export function chosenServices(
  floors: readonly LaunchpadFloor[],
  answers: LaunchpadAnswers | undefined,
  answerKey: string,
): ChosenService[] {
  const selected = selectionOf(answers, answerKey)?.selected ?? [];
  const options = offerOptions(floors, answerKey);
  return selected.flatMap((id) => {
    const opt = options.find((o) => o.id === id);
    return opt ? [opt] : [];
  });
}

function itemNameKey(label: string): string {
  return label.trim().toLowerCase();
}

/**
 * Starter gear for the chosen services. Rows for services the learner did
 * not pick are left off. The same item on more than one service (same name,
 * or the same id) is listed once; the first row in catalog order wins.
 */
export function starterGearFor(items: readonly LaunchpadCostItem[], serviceIds: readonly string[]): LaunchpadCostItem[] {
  const chosen = new Set(serviceIds);
  const seenIds = new Set<string>();
  const seenNames = new Set<string>();
  const out: LaunchpadCostItem[] = [];
  for (const item of items) {
    if (!item.serviceIds?.some((id) => chosen.has(id))) continue;
    const name = itemNameKey(item.label);
    if (seenIds.has(item.id) || seenNames.has(name)) continue;
    seenIds.add(item.id);
    seenNames.add(name);
    out.push(item);
  }
  return out;
}

export function seedCosts(screen: LaunchpadKnowYourCostScreen, chosen: readonly ChosenService[]): CostsAnswer {
  const ids = chosen.map((s) => s.id);
  return {
    kind: "costs",
    version: 1,
    chosenServiceIds: ids,
    startup: {
      marketing: screen.marketing.map(lineFrom),
      starterGear: starterGearFor(screen.starterGear, ids).map(lineFrom),
      done: false,
    },
    ongoing: chosen.map((service) => ({
      serviceId: service.id,
      label: service.label,
      lines: (screen.ongoing.find((row) => row.serviceId === service.id)?.items ?? []).map(lineFrom),
      done: false,
    })),
  };
}

function mergeStarter(saved: readonly CostLine[], seeded: readonly CostLine[]): CostLine[] {
  const applicable = new Set(seeded.map((line) => line.id));
  const kept = saved.filter((line) => line.custom || applicable.has(line.id));
  const seen = new Set(kept.map((line) => line.id));
  return [...kept, ...seeded.filter((line) => !seen.has(line.id))];
}

/** Saved lines win. A change of chosen services refreshes starter gear and adds new restock sheets. */
export function ensureCosts(
  saved: CostsAnswer | undefined,
  screen: LaunchpadKnowYourCostScreen,
  chosen: readonly ChosenService[],
): CostsAnswer {
  const seeded = seedCosts(screen, chosen);
  if (!saved) return seeded;
  if (sameIds(saved.chosenServiceIds, seeded.chosenServiceIds)) {
    return {
      ...saved,
      ongoing: saved.ongoing.map((service) => ({
        ...service,
        label: chosen.find((c) => c.id === service.serviceId)?.label ?? service.label,
      })),
    };
  }
  return {
    kind: "costs",
    version: 1,
    chosenServiceIds: seeded.chosenServiceIds,
    startup: saved.startup.done
      ? saved.startup
      : { ...saved.startup, starterGear: mergeStarter(saved.startup.starterGear, seeded.startup.starterGear) },
    ongoing: seeded.ongoing.map((service) => {
      const prev = saved.ongoing.find((row) => row.serviceId === service.serviceId);
      return prev ? { ...prev, label: service.label } : service;
    }),
    ...(saved.ongoingAcknowledged ? { ongoingAcknowledged: true } : {}),
  };
}

/** Continue stays off until start-up is done and every chosen service has a cost. */
export function costsReady(answer: CostsAnswer): boolean {
  if (!answer.startup.done) return false;
  if (answer.ongoing.length === 0) return answer.ongoingAcknowledged === true;
  return answer.ongoing.every((service) => service.done);
}

/** Where the hub Continue goes. `false` skips the slim totals screen. */
export function stepAfterHub(showTotals: boolean): "totals" | "workbook" {
  return showTotals ? "totals" : "workbook";
}

export function sumMoney(amounts: readonly number[], cents: boolean): number {
  const raw = amounts.reduce((sum, amount) => sum + amount, 0);
  return cents ? Math.round(raw * 100) / 100 : Math.round(raw);
}

export function startupTotal(answer: CostsAnswer): number {
  return sumMoney(
    [...answer.startup.marketing, ...answer.startup.starterGear].filter((line) => line.label.trim()).map((line) => line.amount),
    false,
  );
}

export function serviceTotal(lines: readonly CostLine[]): number {
  return sumMoney(
    lines.filter((line) => line.label.trim()).map((line) => line.amount),
    true,
  );
}

/** Whole dollars only. Empty and decimals are rejected. `0` is allowed. */
export function parseStartupInput(raw: string): number | null {
  const text = raw.trim();
  if (!/^\d{1,6}$/.test(text)) return null;
  return Number(text);
}

/** Dollars with up to two decimal places. `0` and `0.05` are allowed. */
export function parseOngoingInput(raw: string): number | null {
  const text = raw.trim();
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(text)) return null;
  const amount = Number(text);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100) / 100;
}

export function labeledLines(lines: readonly CostLine[]): CostLine[] {
  return lines.filter((line) => line.label.trim());
}

/** Workbook My costs: the same sections and totals the learner saved. */
export function workbookView(answer: CostsAnswer): CostWorkbookView {
  const marketing = labeledLines(answer.startup.marketing);
  const starterGear = labeledLines(answer.startup.starterGear);
  const total = sumMoney([...marketing, ...starterGear].map((line) => line.amount), false);
  return {
    marketing,
    starterGear,
    startupTotal: total,
    ongoing: answer.ongoing
      .filter((service) => service.done)
      .map((service) => ({
        serviceId: service.serviceId,
        label: service.label,
        perJob: serviceTotal(service.lines),
      })),
    grandTotal: total,
  };
}

export function formatStartupMoney(amount: number, currency: SupportedCurrencyCode): string {
  return formatWholeMoney(amount, currency);
}

export function formatOngoingMoney(amount: number, currency: SupportedCurrencyCode): string {
  return formatMoney(amount, currency);
}

export function ongoingInputText(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

export function findKnowYourCost(floors: readonly LaunchpadFloor[]): {
  floor: LaunchpadFloor;
  silver: LaunchpadFloor["silvers"][number];
  bronze: LaunchpadFloor["silvers"][number]["bronzes"][number];
  task: LaunchpadFloor["silvers"][number]["bronzes"][number]["tasks"][number];
  taskIndex: number;
  silverNumber: number;
  screen: LaunchpadKnowYourCostScreen;
} | null {
  for (const floor of floors) {
    for (let silverIndex = 0; silverIndex < floor.silvers.length; silverIndex++) {
      const silver = floor.silvers[silverIndex]!;
      for (const bronze of silver.bronzes) {
        const taskIndex = bronze.tasks.findIndex((task) => task.screens.some((screen) => screen.type === "know-your-cost"));
        if (taskIndex === -1) continue;
        const task = bronze.tasks[taskIndex]!;
        const screen = task.screens.find((item) => item.type === "know-your-cost");
        if (!screen || screen.type !== "know-your-cost") continue;
        return { floor, silver, bronze, task, taskIndex, silverNumber: silverIndex + 1, screen };
      }
    }
  }
  return null;
}

/** Sample answer for a shortcut that completed Pricing without the learner filling costs. */
export function sampleCostsAnswer(
  screen: LaunchpadKnowYourCostScreen,
  floors: readonly LaunchpadFloor[],
  answers: LaunchpadAnswers | undefined,
): CostsAnswer {
  const chosen = chosenServices(floors, answers, screen.servicesFrom);
  const services = chosen.length
    ? chosen
    : screen.ongoing.slice(0, 1).map((row) => ({ id: row.serviceId, label: row.serviceId }));
  const seeded = seedCosts(screen, services);
  return {
    ...seeded,
    startup: { ...seeded.startup, done: true },
    ongoing: seeded.ongoing.map((service) => ({ ...service, done: true })),
    ...(seeded.ongoing.length === 0 ? { ongoingAcknowledged: true } : {}),
  };
}

export function savedCosts(
  answers: LaunchpadAnswers | undefined,
  screen: LaunchpadKnowYourCostScreen,
  floors: readonly LaunchpadFloor[],
): CostsAnswer {
  return ensureCosts(costsOf(answers, screen.answerKey), screen, chosenServices(floors, answers, screen.servicesFrom));
}
