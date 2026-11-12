import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { offerOf, priceOf } from "@/lib/launchpad/content/answers";
import { formatWorkbookMoney } from "@/lib/dashboard/currency/format-money";
import { availabilityPhrase, chipLabel, lowerFirst } from "@/lib/launchpad/content/planning/catalog";
import { OFFER_ANSWER_KEY } from "@/lib/launchpad/content/planning/screens";
import { SET_PRICE_ANSWER_KEY } from "@/lib/launchpad/content/pricing/screens";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import type { ScriptedBlock, ScriptedSheet } from "@/lib/launchpad/content/scripted-sheet";
import type { ScriptedPart } from "@/lib/launchpad/content/scripted-sheet";
import {
  CHANNELS,
  HOOKS,
  MARKETING_MATERIALS_KEY,
  PIECE_FIELDS,
  PROOFS,
  SALES_CHANNELS_KEY,
  TELL_PEOPLE_KEY,
  WHERE_GROUPS,
} from "@/lib/launchpad/content/sales/copy";
import { marketingOf, salesChannelsOf, tellPeopleOf } from "@/lib/launchpad/content/answers";

function joinAnd(parts: readonly string[]): string {
  if (parts.length <= 1) return parts[0] ?? "";
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`;
}

function whereSentences(channelId: string, ids: readonly string[], extra?: string): string[] {
  const group = WHERE_GROUPS.find((row) => row.channelId === channelId);
  const phrases: string[] = ids.flatMap((id) => {
    const option = group?.options.find((row) => row.id === id);
    return option ? [option.sentence] : [];
  });
  if (extra?.trim()) phrases.push(extra.trim());
  return phrases;
}

type Piece = {
  id: string;
  subhead: string;
  underline: string;
  lines: ScriptedPart[][];
};

function emphasize(line: string, tokens: readonly string[]): ScriptedPart[] {
  const sorted = [...tokens].filter((token) => token.length > 0).sort((a, b) => b.length - a.length);
  const parts: ScriptedPart[] = [];
  let rest = line;
  while (rest.length > 0) {
    let at = -1;
    let token = "";
    for (const candidate of sorted) {
      const found = rest.indexOf(candidate);
      if (found >= 0 && (at === -1 || found < at)) {
        at = found;
        token = candidate;
      }
    }
    if (at === -1 || !token) {
      parts.push(rest);
      break;
    }
    if (at > 0) parts.push(rest.slice(0, at));
    parts.push({ value: token });
    rest = rest.slice(at + token.length);
  }
  return parts;
}

function jobPhrase(serviceId: string, packageId?: string): string {
  if (serviceId === "grooming") return "a groom";
  const label = packageId ? chipLabel(packageId) : "";
  if (!label || label === packageId) return "a job";
  return `a ${label.charAt(0).toLowerCase()}${label.slice(1)}`;
}

/** Playback lines for one marketing piece. Lookups come from earlier answers. */
export function marketingLines(
  answers: LaunchpadAnswers | undefined,
  piece: "flyer" | "verbal" | "message" | "online" | "card",
  businessName: string,
): { lines: string[]; tokens: string[] } {
  const marketing = marketingOf(answers, MARKETING_MATERIALS_KEY);
  const offer = offerOf(answers, OFFER_ANSWER_KEY);
  const price = priceOf(answers, SET_PRICE_ANSWER_KEY);
  const currency = readCurrencyPreference();
  const hookText = HOOKS.find((row) => row.id === marketing?.hook)?.label ?? "";
  const proofText = PROOFS.find((row) => row.id === marketing?.proof)?.label ?? "";
  const services = (price?.prices ?? []).map((row) => {
    const offering = offer?.offerings.find((item) => item.serviceId === row.serviceId);
    return {
      id: row.serviceId,
      name: row.serviceId === "dog-walking" ? "Dog walking" : row.serviceId === "grooming" ? "Grooming" : row.serviceId,
      price: formatWorkbookMoney(row.price, currency),
      unit: jobPhrase(row.serviceId, offering?.packages[0]),
    };
  });
  const ordered = [marketing?.mainService, marketing?.secondService].flatMap((id) => {
    const found = services.find((row) => row.id === id);
    return found ? [found] : [];
  });
  const listed = ordered.length ? ordered : services.slice(0, 2);
  const names = joinAnd(listed.map((row) => lowerFirst(row.name)));
  const addons = (offer?.offerings ?? []).flatMap((row) => row.addons.map((id) => chipLabel(id))).filter(Boolean);
  const addonLine = addons.length ? ` Extras I can add: ${joinAnd(addons)}.` : "";
  const rateParts = listed.map((row) => `${row.price} for ${row.unit}`);
  const rate =
    rateParts.length === 0
      ? ""
      : rateParts.length === 1
        ? `I charge ${rateParts[0]}.`
        : `I charge ${rateParts.join(", ")}, and I offer other services too.`;
  const times = offer?.availability?.length ? availabilityPhrase(offer.availability) : "";
  const when = times && times !== "…" ? `I'm available ${times}.` : "";
  const book = (id: string) => {
    const field = PIECE_FIELDS.find((row) => row.id === id);
    const picked = marketing?.pieces[id];
    return field?.options.find((row) => row.id === picked)?.label ?? "";
  };
  const tokens = [businessName, hookText, proofText, names, ...addons, times, ...listed.flatMap((row) => [row.name, row.price, row.unit]), book("flyer-book"), book("flyer-extra"), book("verbal-close"), book("message-close"), book("online-close")].filter(Boolean);
  const pack = (lines: string[]) => ({ lines: lines.filter((line) => line && line !== "."), tokens });
  if (piece === "flyer") {
    return pack([
      hookText,
      `${businessName} can help.`,
      `I offer ${names}.${addonLine}`,
      rate,
      when,
      proofText,
      book("flyer-book") ? `Want to book? ${book("flyer-book")}` : "",
      book("flyer-extra"),
    ]);
  }
  if (piece === "verbal") {
    return pack([
      hookText,
      `Hi, I run ${businessName}. I offer ${names}.`,
      [rate.replace(/\.$/, ""), when.replace(/\.$/, "")].filter(Boolean).join(". ") + (rate || when ? "." : ""),
      proofText,
      book("verbal-close"),
    ]);
  }
  if (piece === "message") {
    return pack([
      `Hi, it's me. I run ${businessName} and I offer ${names}.${addonLine}`,
      [rate.replace(/\.$/, ""), when.replace(/\.$/, "")].filter(Boolean).join(". ") + (rate || when ? "." : ""),
      proofText,
      book("message-close"),
    ]);
  }
  if (piece === "online") {
    return pack([hookText, `I can help. ${rate}`, proofText, book("online-close")]);
  }
  return pack([businessName, hookText, `I offer ${names}.`, rate, proofText]);
}

const PIECE_META = [
  { id: "flyer" as const, channelId: "flyers", subhead: "What my flyer will say", underline: "flyer", needs: "flyer-book" },
  { id: "verbal" as const, channelId: "verbal", subhead: "What I will say in person", underline: "in person", needs: "verbal-close" },
  { id: "message" as const, channelId: "message", subhead: "What I will send as a message", underline: "message", needs: "message-close" },
  { id: "online" as const, channelId: "online", subhead: "What my online post will say", underline: "online post", needs: "online-close" },
  { id: "card" as const, channelId: "cards", subhead: "What my business card will say", underline: "business card", needs: "" },
];

function activePieces(answers: LaunchpadAnswers | undefined): ("flyer" | "verbal" | "message" | "online" | "card")[] {
  const sales = salesChannelsOf(answers, SALES_CHANNELS_KEY);
  const marketing = marketingOf(answers, MARKETING_MATERIALS_KEY);
  const selected = new Set(sales?.selected ?? []);
  const where = sales?.where ?? {};
  const friends = where.friends ?? [];
  const out: ("flyer" | "verbal" | "message" | "online" | "card")[] = [];
  if (selected.has("flyers") && marketing?.pieces["flyer-book"]) out.push("flyer");
  if (selected.has("friends") && friends.includes("see") && marketing?.pieces["verbal-close"]) out.push("verbal");
  if (selected.has("friends") && friends.includes("message") && marketing?.pieces["message-close"]) out.push("message");
  if (selected.has("online") && marketing?.pieces["online-close"]) out.push("online");
  if (selected.has("cards")) out.push("card");
  if (selected.has("noticeboard") && !selected.has("flyers") && marketing?.pieces["flyer-book"]) out.push("flyer");
  return out;
}

/** Pack sections. A section that does not fit moves whole to the next page. Online post and the business card share a page. */
function pack(pieces: Piece[]): Piece[][] {
  const budget = 7;
  const pages: Piece[][] = [];
  let lines = 0;
  for (const piece of pieces) {
    const cost = piece.lines.length;
    const page = pages[pages.length - 1];
    if (!page || (lines > 0 && lines + cost > budget)) {
      pages.push([piece]);
      lines = cost;
    } else {
      page.push(piece);
      lines += cost;
    }
  }
  const online = pages.findIndex((page) => page.some((piece) => piece.id === "online"));
  const card = pages.findIndex((page) => page.some((piece) => piece.id === "card"));
  if (online !== -1 && card !== -1 && online !== card) {
    const onlinePiece = pages[online]!.find((piece) => piece.id === "online")!;
    pages[online] = pages[online]!.filter((piece) => piece.id !== "online");
    pages[card] = [onlinePiece, ...pages[card]!];
    return pages.filter((page) => page.length > 0);
  }
  return pages;
}

function blocksFor(piece: Piece): ScriptedBlock[] {
  return [
    { kind: "sub", text: piece.subhead, underline: piece.underline },
    ...piece.lines.map((line): ScriptedBlock => ({ kind: "paragraph", parts: line })),
  ];
}

/** Level 4 workbook pages. Only selected and completed channels get a page. */
export function salesWorkbookSheets(answers: LaunchpadAnswers | undefined, businessName: string): ScriptedSheet[] {
  const sales = salesChannelsOf(answers, SALES_CHANNELS_KEY);
  const sheets: ScriptedSheet[] = [];
  if (sales && sales.selected.length > 0) {
    const lines = sales.selected.flatMap((id) => {
      const channel = CHANNELS.find((row) => row.id === id);
      const phrases = whereSentences(id, sales.where[id] ?? [], sales.whereExtra?.[id]);
      if (!channel || phrases.length === 0) return [];
      return [`${channel.label}: ${joinAnd(phrases)}.`];
    });
    if (lines.length) {
      sheets.push({
        id: "sales-where",
        blocks: [
          { kind: "section", text: "Where I'll use my channels" },
          ...lines.map((line): ScriptedBlock => ({ kind: "paragraph", parts: splitWhere(line) })),
        ],
        largeScribble: "pawtrail",
      });
    }
  }
  const pieces = activePieces(answers).flatMap((id) => {
    const meta = PIECE_META.find((row) => row.id === id);
    if (!meta) return [];
    const subhead = id === "flyer" && sales?.selected.includes("noticeboard") && !sales.selected.includes("flyers")
      ? "What my noticeboard will say"
      : meta.subhead;
    const underline = subhead === "What my noticeboard will say" ? "noticeboard" : meta.underline;
    const built = marketingLines(answers, id, businessName);
    return [{ id, subhead, underline, lines: built.lines.map((line) => emphasize(line, built.tokens)) }];
  });
  pack(pieces).forEach((page, index) => {
    const blocks: ScriptedBlock[] = [{ kind: "section", text: "My marketing materials" }];
    for (const piece of page) blocks.push(...blocksFor(piece));
    sheets.push({ id: `sales-market-${index + 1}`, blocks, compact: page.some((piece) => piece.id === "online" || piece.id === "card") });
  });
  const tell = tellPeopleOf(answers, TELL_PEOPLE_KEY);
  if (tell && sales) {
    const rows = tellLines(sales.selected, sales.where.friends ?? [], tell.counts);
    if (rows.length) {
      sheets.push({
        id: "sales-tell",
        blocks: [
          { kind: "section", text: "How I'll tell people about it" },
          ...rows.map((row): ScriptedBlock => ({ kind: "paragraph", parts: row })),
        ],
        largeScribble: "growth",
      });
    }
  }
  return sheets;
}

function splitWhere(line: string): ScriptedPart[] {
  const colon = line.indexOf(": ");
  if (colon === -1) return [line];
  const label = line.slice(0, colon + 2);
  const rest = line.slice(colon + 2).replace(/\.$/, "");
  const parts: (string | { value: string | null })[] = [label];
  const bits = rest.split(/ and /);
  bits.forEach((bit, index) => {
    if (index > 0) parts.push(" and ");
    parts.push({ value: bit });
  });
  parts.push(".");
  return parts;
}

export function tellLines(
  selected: readonly string[],
  friendsWhere: readonly string[],
  counts: Readonly<Record<string, number>>,
): (string | { value: string | null })[][] {
  const on = new Set(selected);
  const rows: { id: string; parts: (string | { value: string | null })[] }[] = [];
  const num = (id: string) => ({ value: counts[id] ? String(counts[id]) : null });
  if (on.has("flyers")) rows.push({ id: "flyers", parts: ["I will print and distribute ", num("flyers"), " flyers."] });
  if (on.has("friends") && friendsWhere.includes("see")) rows.push({ id: "see", parts: ["I will tell ", num("see"), " people in person."] });
  if (on.has("friends") && friendsWhere.includes("message")) rows.push({ id: "message", parts: ["I will send the message to ", num("message"), " people."] });
  if (on.has("online")) {
    rows.push({ id: "days", parts: ["I will share the post ", num("days"), " days in advance."] });
    rows.push({ id: "ask", parts: ["I will ask ", num("ask"), " friends to share it."] });
  }
  if (on.has("cards")) {
    rows.push({
      id: "cards",
      parts: ["I will print ", num("cards"), " business cards and ask ", num("stores"), " stores if I can leave them there for their customers."],
    });
  }
  if (on.has("noticeboard")) rows.push({ id: "board", parts: ["I will put up ", num("board"), " posters on a noticeboard."] });
  return rows.map((row) => row.parts);
}
