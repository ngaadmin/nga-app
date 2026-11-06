"use client";

import { useState } from "react";
import type { CompetitorAnswer, CustomerAnswer, LaunchpadAnswers, OfferAnswer, ServiceOffering } from "@/lib/launchpad/content/answers";
import { competitorOf, customerOf, offerOf } from "@/lib/launchpad/content/answers";
import { chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";
import { SOMETHING_ELSE_ID, catalogFor, chipLabel } from "@/lib/launchpad/content/planning/catalog";
import type { LaunchpadChip, LaunchpadCompetitorScreen, LaunchpadCustomerScreen, LaunchpadFloor, LaunchpadOfferLoopScreen } from "@/lib/launchpad/content/types";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { BTN_PRIMARY } from "@/components/launchpad/venture-test/venture-test-ui";

const NEXT_OFF =
  "inline-flex h-11 min-w-[140px] items-center justify-center rounded-full bg-[#E5E7EB] px-6 font-heading text-[15px] font-bold text-[#9AA3B5]";

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
      <button type="button" aria-pressed={selected} onClick={onClick} className="flex w-full items-center gap-2 border-b border-dashed border-[#E4D3B4] py-2 text-left text-[15px] text-[#19347D]">
        <span className={`flex size-5 flex-none items-center justify-center rounded-[4px] text-[12px] text-white ${selected ? "bg-[#FFA503]" : "border-2 border-[#D1D5DB] bg-white"}`}>{selected ? "✓" : ""}</span>
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
      className={`inline-flex h-9 items-center gap-1 rounded-full border bg-white px-3 text-[14px] font-medium ${selected ? on : "border-[#E5E7EB] text-[#19347D]"}`}
    >
      {selected && <span aria-hidden="true">✓</span>}
      {label}
    </button>
  );
}

function toggle(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
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
  const catalog = service ? catalogFor(service.id) ?? screen.catalogs.find((row) => row.serviceId === service.id) : undefined;

  const write = (next: OfferAnswer) => {
    setDraft(next);
    persist(screen.answerKey, next);
  };
  const patchOffering = (serviceId: string, patch: (row: ServiceOffering) => ServiceOffering) => {
    const rows = draft.offerings.some((row) => row.serviceId === serviceId) ? draft.offerings : [...draft.offerings, emptyOffering(serviceId)];
    write({ ...draft, offerings: rows.map((row) => (row.serviceId === serviceId ? patch(row) : row)) });
  };
  const ready = onWhen || (!!offering && (offering.packages.length > 0 || !!offering.packagesExtra));

  const anyPackage = draft.offerings.some((row) => row.packages.length > 0 || !!row.packagesExtra);
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white" data-task-screen="offer-loop" data-offer-step="workbook">
      <div className="mx-5 mt-6 flex items-center gap-2">
        <button type="button" aria-label="Back" onClick={() => (step === 0 ? onExit() : setStep(step - 1))} className="flex size-11 items-center justify-center text-[#19347D]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <h1 className="min-w-0 flex-1 font-heading text-[22px] font-bold text-[#19347D]">{onWhen ? screen.copy.whenTitle : service?.label}</h1>
      </div>
      <div className="mx-5 mt-2 min-h-0 flex-1 overflow-y-auto pb-3">
        <p className="text-[14px] leading-snug text-[#6B7280]">
          {onWhen ? screen.copy.whenIntro : screen.copy.serviceIntro.split("{service}").join(service?.label ?? "this service")}
        </p>
        {!onWhen && offering && catalog && (
          <>
            <p className="mt-3 rounded-2xl bg-[#F7FAFD] px-3 py-3 text-[15px] leading-snug text-[#19347D]">
              I offer {offering.packages.map((id) => chipLabel(id)).join(", ") || "…"}.
              {(offering.addons.length > 0 || offering.addonsExtra) && ` Extras I can add: ${[...offering.addons.map(chipLabel), offering.addonsExtra].filter(Boolean).join(", ")}.`}
            </p>
            <div className="mt-4 flex items-baseline justify-between">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9AA3B5]">Packages</h2>
              <span className="text-[12px] text-[#9AA3B5]">Pick at least 1</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {catalog.packages.map((item) => (
                <Chip lined key={item.id} tone="package" label={item.label} selected={offering.packages.includes(item.id)} onClick={() => patchOffering(offering.serviceId, (row) => ({ ...row, packages: toggle(row.packages, item.id) }))} />
              ))}
            </div>
            <button type="button" className="mt-2 font-semibold text-[#0CC1E0]" onClick={() => setExtraOpen(extraOpen === "package" ? null : "package")}>{screen.copy.addPackage}</button>
            {extraOpen === "package" && (
              <input aria-label="Your own package" maxLength={40} value={offering.packagesExtra ?? ""} onChange={(event) => patchOffering(offering.serviceId, (row) => ({ ...row, packagesExtra: event.target.value }))} className="mt-2 h-11 w-full rounded-xl px-3 text-[#19347D] shadow-[inset_0_0_0_1.5px_#0CC1E0] outline-none" placeholder="Type your own package" />
            )}
            <div className="mt-4 flex items-baseline justify-between">
              <h2 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9AA3B5]">Extras</h2>
              <span className="text-[12px] text-[#9AA3B5]">Optional</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {catalog.extras.map((item) => (
                <Chip lined key={item.id} tone="extra" label={item.label} selected={offering.addons.includes(item.id)} onClick={() => patchOffering(offering.serviceId, (row) => ({ ...row, addons: toggle(row.addons, item.id) }))} />
              ))}
            </div>
            <button type="button" className="mt-2 font-semibold text-[#0CC1E0]" onClick={() => setExtraOpen(extraOpen === "addon" ? null : "addon")}>{screen.copy.addExtra}</button>
            {extraOpen === "addon" && (
              <label className="mt-2 block text-[13px] text-[#6B7280]">
                Add another extra (optional)
                <input aria-label="Your own extra" maxLength={40} value={offering.addonsExtra ?? ""} onChange={(event) => patchOffering(offering.serviceId, (row) => ({ ...row, addonsExtra: event.target.value }))} className="mt-1 h-11 w-full rounded-xl px-3 text-[#19347D] shadow-[inset_0_0_0_1.5px_#0CC1E0] outline-none" placeholder="Type your own extra" />
              </label>
            )}
            {step === services.length - 1 && (
              <button type="button" data-add-service="" className="mt-4 inline-flex h-11 items-center rounded-full px-4 font-semibold text-[#0CC1E0] shadow-[inset_0_0_0_1.5px_#0CC1E0]" onClick={() => undefined}>
                {screen.copy.addService}
              </button>
            )}
          </>
        )}
        {onWhen && (
          <>
            <p className="mt-3 text-[15px] leading-snug text-[#19347D]">
              I am available {draft.availability.map(chipLabel).join(", ") || "…"}.
              {draft.availabilityExtra ? ` Also: ${draft.availabilityExtra}.` : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {screen.times.map((item) => (
                <Chip lined key={item.id} tone="package" label={item.label} selected={draft.availability.includes(item.id)} onClick={() => write({ ...draft, availability: toggle(draft.availability, item.id) })} />
              ))}
            </div>
            <button type="button" className="mt-3 font-semibold text-[#0CC1E0]" onClick={() => setExtraOpen(extraOpen === "time" ? null : "time")}>{screen.copy.addTime}</button>
            {extraOpen === "time" && (
              <input aria-label="Another time" maxLength={80} value={draft.availabilityExtra ?? ""} onChange={(event) => write({ ...draft, availabilityExtra: event.target.value })} className="mt-2 h-11 w-full rounded-xl px-3 text-[#19347D] shadow-[inset_0_0_0_1.5px_#0CC1E0] outline-none" placeholder="Monday to Friday 4pm to 7pm" />
            )}
            <p className="mt-4 text-[13px] text-[#9AA3B5]">{screen.copy.whenNote}</p>
          </>
        )}
        {services.length === 0 && <p className="mt-4 text-[14px] text-[#6B7280]">Pick a service in Level 1 first.</p>}
      </div>
      <div className="mx-5 flex justify-center pb-4">
        <button
          type="button"
          disabled={!ready || services.length === 0}
          className={ready && services.length > 0 ? BTN_PRIMARY : NEXT_OFF}
          onClick={() => {
            if (!ready) return;
            if (!onWhen) setStep(step + 1);
            else onFinish(draft);
          }}
        >
          Continue
        </button>
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
  const saved = customerOf(answers, screen.answerKey);
  const chips: LaunchpadChip[] = [];
  for (const row of offer?.offerings ?? []) {
    const catalog = catalogFor(row.serviceId);
    for (const id of [...row.packages, ...row.addons]) {
      const label = chipLabel(id);
      if (!chips.some((item) => item.id === id)) chips.push({ id, label: catalog ? label : label });
    }
  }
  for (const time of screen.times) if (!chips.some((item) => item.id === time.id)) chips.push(time);
  const [draft, setDraft] = useState<CustomerAnswer>(() => saved ?? { kind: "customer", version: 1, numberAsked: 3, yesNo: "yes", interests: [] });
  const [extraOpen, setExtraOpen] = useState(false);
  const write = (next: CustomerAnswer) => {
    setDraft(next);
    persist(screen.answerKey, next);
  };
  const ready = draft.interests.length > 0 || !!draft.interestExtra?.trim();
  const offeringChips = chips.filter((item) => !screen.times.some((time) => time.id === item.id));
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white" data-task-screen="customer-check">
      <div className="mx-5 mt-6 flex items-center gap-2">
        <button type="button" aria-label="Back" onClick={onExit} className="flex size-11 items-center justify-center text-[#19347D]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <h1 className="font-heading text-[22px] font-bold text-[#19347D]">Know who your customers are</h1>
      </div>
      <div className="mx-5 mt-2 min-h-0 flex-1 overflow-y-auto">
        <p className="text-[14px] leading-snug text-[#6B7280]">{screen.copy.intro}</p>
        <p className="mt-3 text-[16px] leading-snug text-[#19347D]">
          I asked{" "}
          <input aria-label="Number of people asked" inputMode="numeric" value={String(draft.numberAsked)} onChange={(event) => { const n = Number(event.target.value.replace(/\D/g, "")); if (n >= 1 && n <= 20) write({ ...draft, numberAsked: n }); }} className="mx-1 inline-block h-8 w-12 rounded-lg text-center font-bold text-[#19347D] shadow-[inset_0_0_0_1.5px_#D9DEE8] outline-none" />
          {" "}people about {screen.productPhrase}. They said{" "}
          <select aria-label="Yes or no" value={draft.yesNo} onChange={(event) => write({ ...draft, yesNo: event.target.value === "no" ? "no" : "yes" })} className="mx-1 h-8 rounded-lg bg-white px-2 font-semibold text-[#19347D] shadow-[inset_0_0_0_1.5px_#D9DEE8]">
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          {" "}to my idea. They were specifically interested in:
        </p>
        <h2 className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9AA3B5]">From what you offer</h2>
        <div className="flex flex-wrap gap-2">
          {offeringChips.map((item) => (
            <Chip key={item.id} tone="package" label={item.label} selected={draft.interests.includes(item.id)} onClick={() => write({ ...draft, interests: toggle(draft.interests, item.id) })} />
          ))}
        </div>
        <h2 className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9AA3B5]">Times</h2>
        <div className="flex flex-wrap gap-2">
          {screen.times.map((item) => (
            <Chip key={item.id} tone="package" label={item.label} selected={draft.interests.includes(item.id)} onClick={() => write({ ...draft, interests: toggle(draft.interests, item.id) })} />
          ))}
        </div>
        <button type="button" className="mt-3 font-semibold text-[#0CC1E0]" onClick={() => setExtraOpen((open) => !open)}>{screen.copy.addInterest}</button>
        {extraOpen && (
          <input aria-label="Your own interest" maxLength={80} value={draft.interestExtra ?? ""} onChange={(event) => write({ ...draft, interestExtra: event.target.value })} className="mt-2 h-11 w-full rounded-xl px-3 shadow-[inset_0_0_0_1.5px_#0CC1E0] outline-none" placeholder="Type your own" />
        )}
      </div>
      <div className="mx-5 flex justify-center pb-4">
        <button type="button" disabled={!ready} className={ready ? BTN_PRIMARY : NEXT_OFF} onClick={() => ready && onFinish(draft)}>Continue</button>
      </div>
    </section>
  );
}

export function CompetitorFlow({
  screen,
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
  const packages: LaunchpadChip[] = [];
  for (const row of offer?.offerings ?? []) {
    const catalog = catalogFor(row.serviceId);
    for (const id of row.packages) {
      const found = catalog?.packages.find((item) => item.id === id);
      if (found && !packages.some((item) => item.id === id)) packages.push(found);
    }
  }
  const saved = competitorOf(answers, screen.answerKey);
  const [step, setStep] = useState<1 | 2>(1);
  const [ideasOpen, setIdeasOpen] = useState(false);
  const [jobExtraOpen, setJobExtraOpen] = useState(false);
  const [draft, setDraft] = useState<CompetitorAnswer>(
    () =>
      saved ?? {
        kind: "competitor",
        version: 1,
        walkersChecked: 3,
        priceLow: 12,
        priceHigh: 20,
        addons: [],
        doDifferently: "walk-one-dog-at-a-time",
        ...(packages[0] ? { jobComparedId: packages[0].id } : {}),
      },
  );
  const write = (next: CompetitorAnswer) => {
    setDraft(next);
    persist(screen.answerKey, next);
  };
  const pricesReady = draft.priceHigh >= draft.priceLow && (!!draft.jobComparedId || !!draft.jobComparedExtra?.trim());
  const ideaReady = draft.doDifferently !== SOMETHING_ELSE_ID || !!draft.doDifferentlyExtra?.trim();
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white" data-task-screen="competitor-check" data-competitor-step={step}>
      <div className="mx-5 mt-6 flex items-center gap-2">
        <button type="button" aria-label="Back" onClick={() => (step === 2 ? setStep(1) : onExit())} className="flex size-11 items-center justify-center text-[#19347D]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <h1 className="min-w-0 flex-1 font-heading text-[22px] font-bold text-[#19347D]">What others charge</h1>
        <span className="text-[13px] font-semibold text-[#0A8FA8]">{step} of 2</span>
      </div>
      <div className="mx-5 mt-2 min-h-0 flex-1 overflow-y-auto">
        {step === 1 ? (
          <>
            <p className="text-[14px] leading-snug text-[#6B7280]">{screen.copy.pricesIntro}</p>
            <p className="mt-3 text-[16px] leading-snug text-[#19347D]">
              I checked{" "}
              <input aria-label="Walkers checked" inputMode="numeric" value={String(draft.walkersChecked)} onChange={(event) => { const n = Number(event.target.value.replace(/\D/g, "")); if (n >= 1 && n <= 10) write({ ...draft, walkersChecked: n }); }} className="mx-1 inline-block h-8 w-12 rounded-lg text-center font-bold shadow-[inset_0_0_0_1.5px_#D9DEE8] outline-none" />
              {" "}other dog walkers. For a{" "}
              <select aria-label="Job compared" value={draft.jobComparedId ?? ""} onChange={(event) => write({ ...draft, jobComparedId: event.target.value || undefined })} className="mx-1 h-9 rounded-lg bg-white px-2 font-semibold shadow-[inset_0_0_0_1.5px_#0CC1E0]">
                <option value="">Choose a job</option>
                {packages.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
              {" "}they charge from $
              <input aria-label="Lowest price" inputMode="numeric" value={String(draft.priceLow)} onChange={(event) => { const n = Number(event.target.value.replace(/\D/g, "")); if (n >= 1 && n <= 9999) write({ ...draft, priceLow: n }); }} className="mx-1 inline-block h-8 w-14 rounded-lg text-center font-bold shadow-[inset_0_0_0_1.5px_#D9DEE8] outline-none" />
              to $
              <input aria-label="Highest price" inputMode="numeric" value={String(draft.priceHigh)} onChange={(event) => { const n = Number(event.target.value.replace(/\D/g, "")); if (n >= 1 && n <= 9999) write({ ...draft, priceHigh: n }); }} className="mx-1 inline-block h-8 w-14 rounded-lg text-center font-bold shadow-[inset_0_0_0_1.5px_#D9DEE8] outline-none" />
              .
            </p>
            <button type="button" className="mt-3 font-semibold text-[#0CC1E0]" onClick={() => setJobExtraOpen((open) => !open)}>{screen.copy.addJob}</button>
            {jobExtraOpen && (
              <input aria-label="Another job" maxLength={40} value={draft.jobComparedExtra ?? ""} onChange={(event) => write({ ...draft, jobComparedExtra: event.target.value })} className="mt-2 h-11 w-full rounded-xl px-3 shadow-[inset_0_0_0_1.5px_#0CC1E0] outline-none" placeholder="Type the job you compared" />
            )}
          </>
        ) : (
          <>
            <p className="text-[14px] leading-snug text-[#6B7280]">{screen.copy.extrasIntro}</p>
            <h2 className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9AA3B5]">They often include</h2>
            <div className="flex flex-wrap gap-2">
              {screen.addons.map((item) => (
                <Chip key={item.id} tone="package" label={item.label} selected={draft.addons.includes(item.id)} onClick={() => write({ ...draft, addons: toggle(draft.addons, item.id) })} />
              ))}
            </div>
            <h2 className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9AA3B5]">{screen.copy.ideaTitle}</h2>
            <button type="button" className="flex h-11 w-full items-center justify-between rounded-xl bg-white px-3 text-left font-semibold text-[#19347D] shadow-[inset_0_0_0_1.5px_#D9DEE8]" onClick={() => setIdeasOpen(true)}>
              {chipLabel(draft.doDifferently)}
              <span aria-hidden="true">▾</span>
            </button>
            {ideasOpen && (
              <div className="mt-2 rounded-2xl bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.12)]" role="dialog" aria-label={screen.copy.ideaTitle}>
                <p className="font-heading text-lg font-bold text-[#19347D]">{screen.copy.ideaTitle}</p>
                <p className="text-[13px] text-[#6B7280]">{screen.copy.ideaHint}</p>
                <div className="mt-2 flex flex-col">
                  {screen.ideas.map((idea) => (
                    <label key={idea.id} className="flex h-11 items-center gap-2 border-b border-[#F3F4F6] text-[15px] text-[#19347D]">
                      <input type="radio" name="do-differently" checked={draft.doDifferently === idea.id} onChange={() => write({ ...draft, doDifferently: idea.id })} />
                      {idea.label}
                    </label>
                  ))}
                </div>
                <p className="mt-2 text-[13px] text-[#6B7280]">{screen.copy.elseHint}</p>
                {draft.doDifferently === SOMETHING_ELSE_ID && (
                  <input aria-label="Your own idea" maxLength={80} value={draft.doDifferentlyExtra ?? ""} onChange={(event) => write({ ...draft, doDifferentlyExtra: event.target.value })} className="mt-2 h-11 w-full rounded-xl px-3 shadow-[inset_0_0_0_1.5px_#0CC1E0] outline-none" />
                )}
                <button type="button" className={`${BTN_PRIMARY} mt-3`} onClick={() => setIdeasOpen(false)}>Done</button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="mx-5 flex justify-center pb-4">
        {step === 1 ? (
          <button type="button" disabled={!pricesReady} className={pricesReady ? BTN_PRIMARY : NEXT_OFF} onClick={() => setStep(2)}>Continue</button>
        ) : (
          <button type="button" disabled={!ideaReady} className={ideaReady ? BTN_PRIMARY : NEXT_OFF} onClick={() => ideaReady && onFinish(draft)}>Continue</button>
        )}
      </div>
    </section>
  );
}
