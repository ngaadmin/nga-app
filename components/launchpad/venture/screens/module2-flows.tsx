"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { useState } from "react";
import { FREDOKA_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";
import type { CompetitorAnswer, CompetitorServicePrice, CustomerAnswer, LaunchpadAnswers, OfferAnswer, ServiceOffering } from "@/lib/launchpad/content/answers";
import { competitorOf, customerOf, offerOf } from "@/lib/launchpad/content/answers";
import { chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";
import { joinList } from "@/lib/launchpad/content/level-up/model";
import {
  AVAILABILITY_COLUMNS,
  AVAILABILITY_ROWS,
  availabilityPhrase,
  availabilitySlotId,
  catalogFor,
  chipLabel,
  isAvailabilitySlot,
  ADDON_IDEA_BLOCKS,
  SOMETHING_ELSE_ID,
} from "@/lib/launchpad/content/planning/catalog";
import type { LaunchpadChip, LaunchpadCompetitorScreen, LaunchpadCustomerScreen, LaunchpadFloor, LaunchpadOfferLoopScreen } from "@/lib/launchpad/content/types";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { AvailabilityTable, Chip as OfferChip } from "@/components/launchpad/venture/screens/lesson-controls";
import { FieldControl } from "@/components/launchpad/venture/screens/field-control";
import { AnchorDoodle, LESSON_BODY, LESSON_HINT, LessonContinue, LessonSurface, LessonTopBar, ScreenGuidance, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";
import { BTN_PRIMARY } from "@/components/launchpad/venture-test/venture-test-ui";

function Chip({
  selected,
  tone,
  label,
  onClick,
  lined = false,
}: {
  selected: boolean;
  tone: "package" | "extra";
  label: string;
  onClick: () => void;
  lined?: boolean;
}) {
  if (lined) {
    return (
      <button type="button" aria-pressed={selected} onClick={onClick} className="flex w-full items-center gap-2 border-b border-dashed border-[#E4D3B4] py-2 text-left text-[18px] text-[#19347D]">
        <span className={`flex size-5 flex-none items-center justify-center rounded-[4px] text-[18px] text-white ${selected ? "bg-[#FFA503]" : "border-2 border-[#D1D5DB] bg-white"}`}>{selected ? "✓" : ""}</span>
        {label}
      </button>
    );
  }
  const on =
    tone === "extra"
      ? "border-[#F5B942] text-[#19347D]"
      : "border-[#0CC1E0] text-[#19347D]";
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1 rounded-full border bg-white px-3 text-[18px] font-medium ${selected ? on : "border-[#E5E7EB] text-[#19347D]"}`}
    >
      {selected && <span aria-hidden="true">✓</span>}
      {label}
    </button>
  );
}

function toggle(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

function toggleSlot(list: readonly string[], id: string): string[] {
  const next = toggle(list.filter(isAvailabilitySlot), id);
  return AVAILABILITY_COLUMNS.flatMap((column) => AVAILABILITY_ROWS.map((row) => availabilitySlotId(column.key, row.key))).filter((slot) => next.includes(slot));
}

function emptyOffering(serviceId: string): ServiceOffering {
  return { serviceId, packages: [], addons: [] };
}

export function OfferLoopFlow({
  screen,
  floors: floorsProp,
  answers: answersProp,
  setAnswer: setAnswerProp,
  onExit = () => {},
  onFinish = () => {},
}: {
  screen: LaunchpadOfferLoopScreen;
  floors?: readonly LaunchpadFloor[];
  answers?: LaunchpadAnswers;
  setAnswer?: (key: string, answer: OfferAnswer) => void;
  onExit?: () => void;
  onFinish?: (answer: OfferAnswer) => void;
}) {
  const ctx = useLaunchpadAnswers();
  const floors = floorsProp ?? ctx?.floors ?? [];
  const answers = answersProp ?? ctx?.answers ?? {};
  const persist = setAnswerProp ?? ((key, answer) => ctx?.setAnswer(key, answer));
  const services = chosenServices(floors, answers, screen.servicesFrom);
  const s = useSurfaceCopy();
  const saved = offerOf(answers, screen.answerKey);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OfferAnswer>(
    () =>
      saved ?? {
        kind: "offer",
        version: 1,
        offerings: services.map((service) => emptyOffering(service.id)),
        availability: [],
      },
  );
  const [extraOpen, setExtraOpen] = useState<"package" | "addon" | "time" | null>(null);
  const whenStep = services.length;
  const onWhen = step >= whenStep;
  const service = services[Math.min(step, Math.max(0, services.length - 1))];
  const offering = draft.offerings.find((row) => row.serviceId === service?.id) ?? (service ? emptyOffering(service.id) : undefined);
  const catalog = service ? screen.catalogs.find((row) => row.serviceId === service.id) ?? catalogFor(service.id) : undefined;

  const write = (next: OfferAnswer) => {
    setDraft(next);
    persist(screen.answerKey, next);
  };
  const patchOffering = (serviceId: string, patch: (row: ServiceOffering) => ServiceOffering) => {
    const rows = draft.offerings.some((row) => row.serviceId === serviceId) ? draft.offerings : [...draft.offerings, emptyOffering(serviceId)];
    write({ ...draft, offerings: rows.map((row) => (row.serviceId === serviceId ? patch(row) : row)) });
  };
  const ready = onWhen ? (draft.availability.some(isAvailabilitySlot) || !!draft.availabilityExtra?.trim()) : (!!offering && (offering.packages.length > 0 || !!offering.packagesExtra));
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white" data-task-screen="offer-loop" data-offer-step="workbook">
      <LessonTopBar title={onWhen ? screen.copy.whenTitle : (service?.label ?? "")} onBack={() => (step === 0 ? onExit() : setStep(step - 1))} />
      <div className="mx-5 mt-2 min-h-0 flex-1 overflow-y-auto pb-6" data-offer-scroll="">
        <p className={LESSON_HINT}>
          {onWhen ? screen.copy.whenIntro : screen.copy.serviceIntro.split("{service}").join(service?.label ?? s.offer.thisService)}
        </p>
        {!onWhen && offering && catalog && (
          <>
            <p className="mt-2 rounded-2xl bg-[#F7FAFD] px-3 py-2 text-[18px] leading-snug text-[#19347D]">
              {s.offer.iOffer} {offering.packages.map((id) => chipLabel(id)).join(", ") || "…"}.
              {(offering.addons.length > 0 || offering.addonsExtra) && ` ${s.offer.extrasLead} ${[...offering.addons.map(chipLabel), offering.addonsExtra].filter(Boolean).join(", ")}.`}
            </p>
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 [&_p]:mt-0">
              <ScreenPrompt tone="section" flush>{screen.copy.packagesHeading.split("{service}").join(service?.label ?? s.offer.thisService)}</ScreenPrompt>
              <p className={LESSON_HINT}>{screen.copy.packagesHint}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {catalog.packages.map((item) => (
                <Chip lined key={item.id} tone="package" label={item.label} selected={offering.packages.includes(item.id)} onClick={() => patchOffering(offering.serviceId, (row) => ({ ...row, packages: toggle(row.packages, item.id) }))} />
              ))}
            </div>
            <button type="button" className="mt-2 font-semibold text-[#0CC1E0]" onClick={() => setExtraOpen(extraOpen === "package" ? null : "package")}>{screen.copy.addPackage}</button>
            {extraOpen === "package" && (
              <input aria-label={s.offer.ownPackage} maxLength={40} value={offering.packagesExtra ?? ""} onChange={(event) => patchOffering(offering.serviceId, (row) => ({ ...row, packagesExtra: event.target.value }))} className="mt-2 h-11 w-full rounded-xl px-3 text-[#19347D] shadow-[inset_0_0_0_1.5px_#0CC1E0] outline-none" placeholder={s.offer.typePackage} />
            )}
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 [&_p]:mt-0">
              <ScreenPrompt tone="section" flush>{screen.copy.extrasHeading}</ScreenPrompt>
              <p className={LESSON_HINT}>{screen.copy.extrasHint}</p>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {catalog.extras.map((item) => (
                <Chip lined key={item.id} tone="extra" label={item.label} selected={offering.addons.includes(item.id)} onClick={() => patchOffering(offering.serviceId, (row) => ({ ...row, addons: toggle(row.addons, item.id) }))} />
              ))}
            </div>
            <button type="button" className="mt-2 font-semibold text-[#0CC1E0]" onClick={() => setExtraOpen(extraOpen === "addon" ? null : "addon")}>{screen.copy.addExtra}</button>
            {extraOpen === "addon" && (
              <label className="mt-2 block text-[16px] text-[#6B7280]">
                {s.offer.addExtra}
                <input aria-label={s.offer.ownExtra} maxLength={40} value={offering.addonsExtra ?? ""} onChange={(event) => patchOffering(offering.serviceId, (row) => ({ ...row, addonsExtra: event.target.value }))} className="mt-1 h-11 w-full rounded-xl px-3 text-[#19347D] shadow-[inset_0_0_0_1.5px_#0CC1E0] outline-none" placeholder={s.offer.typeExtra} />
              </label>
            )}
          </>
        )}
        {onWhen && (
          <>
            <p className={`mt-3 ${LESSON_BODY}`} data-availability-summary="">
              {screen.copy.whenSummary.replace("{when}", availabilityPhrase(draft.availability))}
              {draft.availabilityExtra ? ` Also: ${draft.availabilityExtra}.` : ""}
            </p>
            <AvailabilityTable
              selected={draft.availability}
              onToggle={(id) => write({ ...draft, availability: toggleSlot(draft.availability, id) })}
              addLabel={screen.copy.addTime}
              extra={draft.availabilityExtra ?? ""}
              onExtra={(value) => write({ ...draft, availabilityExtra: value })}
              helper={screen.copy.whenNote}
            />
          </>
        )}
        {services.length === 0 && <p className={`mt-4 ${LESSON_HINT}`}>{s.offer.pickService}</p>}
      </div>
      <div className="px-5 pb-[18px]">
        <LessonContinue
          disabled={!ready || services.length === 0}
          onClick={() => {
            if (!ready) return;
            if (!onWhen) setStep(step + 1);
            else onFinish({ ...draft, availability: draft.availability.filter(isAvailabilitySlot) });
          }}
        />
      </div>
    </section>
  );
}

export function CustomerCheckFlow({
  screen,
  answers: answersProp,
  setAnswer: setAnswerProp,
  onExit = () => {},
  onFinish = () => {},
}: {
  screen: LaunchpadCustomerScreen;
  floors?: readonly LaunchpadFloor[];
  answers?: LaunchpadAnswers;
  setAnswer?: (key: string, answer: CustomerAnswer) => void;
  onExit?: () => void;
  onFinish?: (answer: CustomerAnswer) => void;
}) {
  const ctx = useLaunchpadAnswers();
  const answers = answersProp ?? ctx?.answers ?? {};
  const persist = setAnswerProp ?? ((key, answer) => ctx?.setAnswer(key, answer));
  const offer = offerOf(answers, screen.offerFrom);
  const s = useSurfaceCopy();
  const saved = customerOf(answers, screen.answerKey);
  const chips: LaunchpadChip[] = [];
  for (const row of offer?.offerings ?? []) {
    for (const id of [...row.packages, ...row.addons]) {
      if (!chips.some((item) => item.id === id) && !screen.times.some((time) => time.id === id)) chips.push({ id, label: chipLabel(id) });
    }
  }
  const [step, setStep] = useState<0 | 1>(0);
  const [draft, setDraft] = useState<CustomerAnswer>(() => saved ?? { kind: "customer", version: 1, yesNo: "yes", interests: [] });
  const write = (next: CustomerAnswer) => {
    setDraft(next);
    persist(screen.answerKey, next);
  };
  const times = draft.times ?? [];
  const asked = draft.numberAsked;
  const countReady = typeof asked === "number" && asked >= 1 && asked <= 20;
  const interestsReady = draft.interests.length > 0;
  const timesReady = times.length > 0 || !!draft.timesExtra?.trim();
  const sentence = screen.sentence.split(/(\{number\}|\{product\}|\{yesNo\})/g);
  return (
    <LessonSurface
      title={screen.title}
      onBack={() => (step === 1 ? setStep(0) : onExit())}
      footer={
        <LessonContinue
          disabled={step === 0 ? !(interestsReady && countReady) : !timesReady || !countReady}
          onClick={() => {
            if (step === 0) {
              if (interestsReady && countReady) setStep(1);
              return;
            }
            if (timesReady && countReady && draft.numberAsked !== undefined) onFinish({ ...draft, numberAsked: draft.numberAsked, times: times.filter(isAvailabilitySlot) });
          }}
        />
      }
    >
      <div data-task-screen="customer-check" data-customer-step={step === 0 ? "interests" : "times"}>
        {step === 0 ? (
          <>
            <ScreenGuidance flush>{screen.copy.intro}</ScreenGuidance>
            <p className={`mt-3 ${LESSON_BODY}`}>
              {sentence.map((part, index) => {
                if (part === "{number}") {
                  return (
                    <FieldControl
                      key={index}
                      appearance="inline"
                      idPrefix={screen.id}
                      field={{ name: "numberAsked", label: s.offer.numberAsked, input: "integer", min: 1, max: 20 }}
                      value={draft.numberAsked ?? ""}
                      onChange={(value) => {
                        if (value === "") {
                          const next = { ...draft };
                          delete next.numberAsked;
                          write(next);
                          return;
                        }
                        const n = typeof value === "number" ? value : Number(value);
                        if (Number.isInteger(n) && n >= 1 && n <= 20) write({ ...draft, numberAsked: n });
                      }}
                    />
                  );
                }
                if (part === "{product}") return <span key={index}>{screen.productPhrase}</span>;
                if (part === "{yesNo}") {
                  return (
                    <FieldControl
                      key={index}
                      appearance="inline"
                      idPrefix={screen.id}
                      field={{
                        name: "yesNo",
                        label: s.offer.yesOrNo,
                        input: "choice",
                        options: [
                          { id: "yes", label: screen.yesLabel },
                          { id: "no", label: screen.noLabel },
                        ],
                      }}
                      value={draft.yesNo}
                      onChange={(value) => write({ ...draft, yesNo: value === "no" ? "no" : "yes" })}
                    />
                  );
                }
                return <span key={index}>{part}</span>;
              })}
            </p>
            <ScreenPrompt tone="section" flush>{screen.sectionHeading}</ScreenPrompt>
            <div className="mt-2 flex flex-wrap gap-2">
              {chips.map((item) => (
                <OfferChip key={item.id} label={item.label} selected={draft.interests.includes(item.id)} onClick={() => write({ ...draft, interests: toggle(draft.interests, item.id) })} />
              ))}
            </div>
          </>
        ) : (
          <>
            <ScreenPrompt tone="question" flush>{screen.timesTitle}</ScreenPrompt>
            <ScreenGuidance flush>{screen.timesHint}</ScreenGuidance>
            <AvailabilityTable
              selected={times}
              onToggle={(id) => write({ ...draft, times: toggle(times.filter(isAvailabilitySlot), id) })}
              addLabel={screen.addTime}
              extra={draft.timesExtra ?? ""}
              onExtra={(value) => write({ ...draft, timesExtra: value })}
              extraLabel="Another time"
            />
          </>
        )}
      </div>
    </LessonSurface>
  );
}

function StackedMulti({
  label,
  options,
  selected,
  emptyLabel,
  joinWord,
  onChange,
}: {
  label: string;
  options: readonly { id: string; label: string }[];
  selected: readonly string[];
  emptyLabel: string;
  joinWord: string;
  onChange: (next: string[]) => void;
}) {
  const chosen = options.filter((option) => selected.includes(option.id));
  const joined = joinList(chosen.map((option) => option.label), joinWord);
  const filled = joined.length > 0;
  return (
    <div className="relative">
      <div className={`flex w-full min-h-8 items-start justify-between gap-2 border-b-[1.5px] py-1 text-left ${filled ? "border-[#0CC1E0]" : "border-[#8A94A8]"}`}>
        <span className={`min-w-0 flex-1 text-left font-sans text-[18px] font-semibold leading-[26px] ${filled ? "text-[#0CC1E0]" : "text-[#8A94A8]"}`}>{joined || emptyLabel}</span>
        <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true" className="ml-1 mt-2 inline-block shrink-0">
          <path d="M1 1l4 4 4-4" fill="none" stroke={filled ? "#0CC1E0" : "#8A94A8"} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <select
        aria-label={label}
        value=""
        onChange={(event) => {
          const id = event.target.value;
          if (!id) return;
          onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
        }}
        className="absolute inset-0 z-overlay h-full w-full cursor-pointer opacity-0"
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

export function CompetitorFlow({
  screen,
  floors = [],
  answers: answersProp,
  setAnswer: setAnswerProp,
  onExit = () => {},
  onFinish = () => {},
}: {
  screen: LaunchpadCompetitorScreen;
  floors?: readonly LaunchpadFloor[];
  answers?: LaunchpadAnswers;
  setAnswer?: (key: string, answer: CompetitorAnswer) => void;
  onExit?: () => void;
  onFinish?: (answer: CompetitorAnswer) => void;
}) {
  const ctx = useLaunchpadAnswers();
  const answers = answersProp ?? ctx?.answers ?? {};
  const persist = setAnswerProp ?? ((key, answer) => ctx?.setAnswer(key, answer));
  const offer = offerOf(answers, screen.offerFrom);
  const named = chosenServices(floors, answers, screen.servicesFrom);
  const services: { serviceId: string; label: string; packages: LaunchpadChip[] }[] = [];
  for (const row of offer?.offerings ?? []) {
    const catalog = catalogFor(row.serviceId);
    const packages = [...(catalog?.packages ?? [])];
    if (!packages.length) continue;
    services.push({ serviceId: row.serviceId, label: named.find((item) => item.id === row.serviceId)?.label ?? "", packages });
  }
  const s = useSurfaceCopy();
  const saved = competitorOf(answers, screen.answerKey);
  const [page, setPage] = useState(0);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [draft, setDraft] = useState<CompetitorAnswer>(() => {
    const seeded: CompetitorServicePrice[] = services.map((service) => ({
      serviceId: service.serviceId,
      offers: (offer?.offerings.find((row) => row.serviceId === service.serviceId)?.packages ?? []).filter((id) =>
        service.packages.some((item) => item.id === id),
      ),
      averages: {},
    }));
    const base: CompetitorAnswer = saved ?? {
      kind: "competitor",
      version: 1,
      priceLow: 12,
      priceHigh: 20,
      addons: [],
      doDifferently: "walk-one-dog-at-a-time",
      ...(seeded[0]?.offers[0] ? { jobComparedId: seeded[0].offers[0] } : {}),
    };
    return { ...base, servicePrices: base.servicePrices?.length ? base.servicePrices : seeded };
  });
  const rows = draft.servicePrices ?? [];
  const service = services[page];
  const row = rows.find((item) => item.serviceId === service?.serviceId);
  const extras = page >= services.length;
  const total = services.length + 1;
  const priceReady = (item: CompetitorServicePrice | undefined) =>
    !!item && item.offers.length > 0 && item.offers.every((id) => (item.averages[id] ?? 0) >= 1);
  const packed = (): CompetitorAnswer => {
    const servicePrices = rows.map((item) => ({
      serviceId: item.serviceId,
      offers: item.offers,
      averages: Object.fromEntries(item.offers.flatMap((id) => ((item.averages[id] ?? 0) >= 1 ? [[id, item.averages[id]!]] : []))),
    }));
    const amounts = servicePrices.flatMap((item) => item.offers.map((id) => item.averages[id] ?? 0)).filter((amount) => amount >= 1);
    const low = amounts.length ? Math.min(...amounts) : draft.priceLow;
    const high = amounts.length ? Math.max(...amounts) : draft.priceHigh;
    return {
      ...draft,
      priceLow: low,
      priceHigh: Math.max(high, low),
      ...(servicePrices[0]?.offers[0] ? { jobComparedId: servicePrices[0].offers[0] } : {}),
      ...(servicePrices.length ? { servicePrices } : {}),
    };
  };
  const write = (next: CompetitorAnswer) => {
    setDraft(next);
    persist(screen.answerKey, next);
  };
  const setRow = (next: CompetitorServicePrice) => {
    const servicePrices = rows.some((item) => item.serviceId === next.serviceId)
      ? rows.map((item) => (item.serviceId === next.serviceId ? next : item))
      : [...rows, next];
    write({ ...draft, servicePrices });
  };
  const blockedIdeas = new Set(ADDON_IDEA_BLOCKS.filter((pair) => draft.addons.includes(pair.addonId)).map((pair) => pair.ideaId));
  const ideaReady = !blockedIdeas.has(draft.doDifferently) && (draft.doDifferently !== SOMETHING_ELSE_ID || !!draft.doDifferentlyExtra?.trim());
  const walkersReady = typeof draft.walkersChecked === "number" && draft.walkersChecked >= 1 && draft.walkersChecked <= 10;
  const ready = extras ? ideaReady && walkersReady : priceReady(row) && (page === 0 ? walkersReady : true);
  return (
    <section className="relative flex min-h-0 flex-1 flex-col bg-white" data-task-screen="competitor-check" data-competitor-step={extras ? "extras" : service?.serviceId}>
      {extras ? <AnchorDoodle name="paw" size={128} /> : null}
      <LessonTopBar
        title={s.competitor.title}
        onBack={() => (page === 0 ? onExit() : setPage(page - 1))}
        trailing={<span className="text-[18px] font-semibold text-[#0A8FA8]">{page + 1} of {total}</span>}
      />
      <div className="mx-5 mt-5 min-h-0 flex-1 overflow-y-auto">
        {!extras && service && row ? (
          <>
            {page === 0 ? <p className={LESSON_HINT}>{screen.copy.pricesIntro}</p> : null}
            {page === 0 ? (
              <p className={`mt-3 ${LESSON_BODY}`}>
                {s.competitor.iChecked}{" "}
                <input aria-label={s.competitor.walkersChecked} inputMode="numeric" value={draft.walkersChecked === undefined ? "" : String(draft.walkersChecked)} onChange={(event) => { const digits = event.target.value.replace(/\D/g, "").slice(0, 2); if (!digits) { const next = { ...draft }; delete next.walkersChecked; write(next); return; } const n = Number(digits); if (n >= 1 && n <= 10) write({ ...draft, walkersChecked: n }); }} className="mx-1 inline-block h-8 w-12 rounded-lg text-center font-bold shadow-[inset_0_0_0_1.5px_#D9DEE8] outline-none" />
                {" "}{s.competitor.checkedWalkers}
              </p>
            ) : null}
            {service.label ? <h2 className={`mb-2 mt-4 ${FREDOKA_CLASS} text-[21px] font-semibold leading-[30px] text-[#0CC1E0]`}>{service.label}</h2> : null}
            <p className={`mt-3 ${LESSON_BODY}`}>{s.competitor.offerLead}</p>
            <StackedMulti
              label={s.competitor.offerLead}
              options={service.packages}
              selected={row.offers}
              emptyLabel={s.competitor.choose}
              joinWord={s.competitor.andWord}
              onChange={(offers) => setRow({ ...row, offers })}
            />
            {service.packages.filter((item) => row.offers.includes(item.id)).map((item) => (
              <label key={item.id} className="mt-4 flex items-center justify-between gap-3">
                <span className={LESSON_BODY}>{item.label}</span>
                <span className="flex h-11 w-[120px] shrink-0 items-center gap-0.5 rounded-[10px] bg-white px-2 shadow-[inset_0_0_0_1.5px_#D9DEE8]">
                  <span className="font-sans text-[16px] leading-[23px] text-[#4A5568]" aria-hidden="true">$</span>
                  <input
                    inputMode="numeric"
                    aria-label={`${s.competitor.averagePrice} ${item.label}`}
                    value={row.averages[item.id] ? String(row.averages[item.id]) : ""}
                    onChange={(event) => {
                      const digits = event.target.value.replace(/\D/g, "").slice(0, 4);
                      const amount = Number(digits);
                      const averages = { ...row.averages };
                      if (amount >= 1 && amount <= 9999) averages[item.id] = amount;
                      else delete averages[item.id];
                      setRow({ ...row, averages });
                    }}
                    className="w-full bg-transparent text-right font-sans text-[20px] font-bold leading-[26px] tabular-nums text-[#19347D] outline-none"
                  />
                </span>
              </label>
            ))}
          </>
        ) : (
          <>
            <p className={LESSON_HINT}>{screen.copy.extrasIntro}</p>
            <h2 className={`mb-2 mt-5 ${FREDOKA_CLASS} text-[18px] font-semibold leading-[26px] text-[#0CC1E0]`}>{s.competitor.oftenInclude}</h2>
            <StackedMulti
              label={s.competitor.oftenInclude}
              options={screen.addons}
              selected={draft.addons}
              emptyLabel={s.competitor.choose}
              joinWord={s.competitor.andWord}
              onChange={(addons) => write({ ...draft, addons })}
            />
            <h2 className={`mb-2 mt-4 ${FREDOKA_CLASS} text-[18px] font-semibold leading-[26px] text-[#0CC1E0]`}>{screen.copy.ideaTitle}</h2>
            <button type="button" className="flex h-11 w-full items-center justify-between rounded-xl bg-white px-3 text-left font-semibold text-[#19347D] shadow-[inset_0_0_0_1.5px_#D9DEE8]" onClick={() => setIdeasOpen(true)}>
              {chipLabel(draft.doDifferently)}
              <span aria-hidden="true">▾</span>
            </button>
            {ideasOpen && (
              <div className="mt-2 rounded-2xl bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.12)]" role="dialog" aria-label={screen.copy.ideaTitle}>
                <p className="font-heading text-lg font-bold text-[#19347D]">{screen.copy.ideaTitle}</p>
                <p className="text-[16px] text-[#6B7280]">{screen.copy.ideaHint}</p>
                <div className="mt-2 flex flex-col">
                  {screen.ideas.map((idea) => (
                    <label key={idea.id} className={`flex h-11 items-center gap-2 border-b border-[#F3F4F6] text-[18px] text-[#19347D] ${blockedIdeas.has(idea.id) ? "opacity-40" : ""}`}>
                      <input type="radio" name="do-differently" checked={draft.doDifferently === idea.id} disabled={blockedIdeas.has(idea.id)} onChange={() => write({ ...draft, doDifferently: idea.id })} />
                      {idea.label}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[16px] text-[#6B7280]">{screen.copy.elseHint}</p>
                {draft.doDifferently === SOMETHING_ELSE_ID && (
                  <input aria-label={s.competitor.ownIdea} maxLength={80} value={draft.doDifferentlyExtra ?? ""} onChange={(event) => write({ ...draft, doDifferentlyExtra: event.target.value })} className="mt-2 h-11 w-full rounded-xl px-3 shadow-[inset_0_0_0_1.5px_#0CC1E0] outline-none" />
                )}
                <button type="button" className={`${BTN_PRIMARY} mt-3`} onClick={() => setIdeasOpen(false)}>Done</button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="px-5 pb-[18px]">
        <LessonContinue
          disabled={!ready}
          onClick={() => {
            if (!ready) return;
            if (!extras) setPage(page + 1);
            else onFinish(packed());
          }}
        />
      </div>
    </section>
  );
}
