import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { costsOf, deliverJobOf, priceOf, wrapJobOf, type GetReadyAnswer, type RecordJobAnswer, type WrapUpJobAnswer } from "@/lib/launchpad/content/answers";
import type { LaunchpadDeliveryScreen, LaunchpadFloor } from "@/lib/launchpad/content/types";
import { chosenServices, serviceTotal } from "@/lib/launchpad/content/know-your-cost/logic";
import { formatWorkbookMoney } from "@/lib/dashboard/currency/format-money";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import type { SupportedCurrencyCode } from "@/lib/dashboard/currency/currencies";

export function joinWords(words: readonly string[], joinWord: string): string {
  const items = words.map((word) => word.trim()).filter(Boolean);
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} ${joinWord} ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, ${joinWord} ${items[items.length - 1]}`;
}

export function parsePaid(raw: string, max: number): number | null {
  const text = raw.trim();
  if (!/^\d{1,4}(\.\d{1,2})?$/.test(text)) return null;
  const amount = Math.round(Number(text) * 100) / 100;
  if (!Number.isFinite(amount) || amount < 0 || amount > max) return null;
  return amount;
}

export function moneyText(amount: number, currency: SupportedCurrencyCode = readCurrencyPreference()): string {
  if (amount < 0) return `-${formatWorkbookMoney(Math.abs(amount), currency)}`;
  return formatWorkbookMoney(amount, currency);
}

export function keptAmount(paid: number, jobCost: number): number {
  return Math.round((paid - jobCost) * 100) / 100;
}

type Option = { id: string; label?: string; sentence?: string };

function phrase(options: readonly Option[] | undefined, id: string | undefined): string {
  if (!id || !options) return "";
  const row = options.find((item) => item.id === id);
  return row?.sentence || row?.label || "";
}

function phrases(options: readonly Option[] | undefined, ids: readonly string[]): string[] {
  return ids.map((id) => phrase(options, id)).filter(Boolean);
}

function readyScreen(floors: readonly LaunchpadFloor[], key: string) {
  for (const floor of floors)
    for (const silver of floor.silvers)
      for (const bronze of silver.bronzes)
        for (const task of bronze.tasks)
          for (const screen of task.screens)
            if (screen.type === "getting-ready" && screen.answerKey === key) return screen;
  return undefined;
}

export type DeliveryLookups = {
  remind: string;
  proof: string;
  payment: string;
  feedback: string;
  gear: readonly string[];
  services: readonly { id: string; label: string }[];
  priceFor: (serviceId: string) => number | null;
  costFor: (serviceId: string) => number | null;
};

export function deliveryLookups(
  screen: LaunchpadDeliveryScreen,
  floors: readonly LaunchpadFloor[],
  answers: LaunchpadAnswers | undefined,
): DeliveryLookups {
  const deliver = readyScreen(floors, screen.deliverFrom);
  const wrap = readyScreen(floors, screen.wrapFrom);
  const deliverAnswer = deliverJobOf(answers, screen.deliverFrom);
  const wrapAnswer = wrapJobOf(answers, screen.wrapFrom);
  const costs = costsOf(answers, screen.costsFrom);
  const price = priceOf(answers, screen.priceFrom);
  const services = chosenServices(floors, answers, screen.servicesFrom);
  return {
    remind: phrase(deliver?.beforeOptions, deliverAnswer?.beforeHow),
    proof: phrase(deliver?.afterOptions, deliverAnswer?.afterHow),
    payment: joinWords(phrases(wrap?.payment?.options, wrapAnswer?.paymentHow ?? []), screen.joinWord),
    feedback: joinWords(phrases(wrap?.feedback?.options, wrapAnswer?.feedbackHow ?? []), screen.joinWord),
    gear: (costs?.startup.starterGear ?? []).map((line) => line.label.trim()).filter(Boolean),
    services,
    priceFor: (serviceId) => price?.prices.find((row) => row.serviceId === serviceId)?.price ?? null,
    costFor: (serviceId) => {
      const row = costs?.ongoing.find((item) => item.serviceId === serviceId);
      return row ? serviceTotal(row.lines) : null;
    },
  };
}

export function deliverySample(screen: LaunchpadDeliveryScreen): GetReadyAnswer | WrapUpJobAnswer | RecordJobAnswer | null {
  if (screen.step === "ready" && screen.ready) {
    const copy = screen.ready;
    const about = copy.aboutOptions[0]?.id;
    const travel = copy.travelOptions[0]?.id;
    const leave = copy.leaveOptions[1]?.id ?? copy.leaveOptions[0]?.id;
    const pack = copy.packOptions[0]?.id;
    if (!about || !travel || !leave || !pack) return null;
    return { kind: "get-ready", version: 1, remindAbout: about, travelHow: travel, leaveEarly: leave, packWhen: pack };
  }
  if (screen.step === "wrap" && screen.wrap) {
    const copy = screen.wrap;
    const paymentWhen = copy.askPayOptions[1]?.id ?? copy.askPayOptions[0]?.id;
    const feedbackQuestion = copy.askOptions[0]?.id;
    const trackerWhen = copy.whenOptions[1]?.id ?? copy.whenOptions[0]?.id;
    if (!paymentWhen || !feedbackQuestion || !trackerWhen) return null;
    return { kind: "wrap-up-job", version: 1, paymentWhen, feedbackQuestion, trackerWhen };
  }
  if (screen.step === "record") {
    return { kind: "record-job", version: 1, jobs: [{ serviceId: "dog-walking", paid: 15 }] };
  }
  return null;
}
