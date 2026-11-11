"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { useState } from "react";
import { FREDOKA_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";
import type { CompetitorAnswer, CustomerAnswer, LaunchpadAnswers, OfferAnswer, ServiceOffering } from "@/lib/launchpad/content/answers";
import { competitorOf, customerOf, offerOf } from "@/lib/launchpad/content/answers";
import { chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";
import {
  AVAILABILITY_COLUMNS,
  AVAILABILITY_ROWS,
  availabilityPhrase,
  availabilitySlotId,
  catalogFor,
  chipLabel,
  isAvailabilitySlot,
  SOMETHING_ELSE_ID,
} from "@/lib/launchpad/content/planning/catalog";
import type { LaunchpadChip, LaunchpadCompetitorScreen, LaunchpadCustomerScreen, LaunchpadFloor, LaunchpadOfferLoopScreen } from "@/lib/launchpad/content/types";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { AvailabilityTable, Chip as OfferChip } from "@/components/launchpad/venture/screens/lesson-controls";
import { FieldControl } from "@/components/launchpad/venture/screens/field-control";
import { LESSON_BODY, LESSON_HINT, LessonContinue, LessonSurface, LessonTopBar, ScreenGuidance, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";
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
  const catalog = service ? catalogFor(service.id) ?? screen.catalogs.find((row) => row.serviceId === service.id) : undefined;

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
      <div className="mx-5 mt-2 min-h-0 flex-1 overflow-y-auto pb-3">
        <p className={LESSON_HINT}>
          {onWhen ? screen.copy.whenIntro : screen.copy.serviceIntro.split("{service}").join(service?.label ?? s.offer.thisService)}
        </p>
        {!onWhen && offering && catalog && (
          <>
            <p className="mt-3 rounded-2xl bg-[#F7FAFD] px-3 py-3 text-[18px] leading-snug text-[#19347D]">
              {s.offer.iOffer} {offering.packages.map((id) => chipLabel(id)).join(", ") || "…"}.
              {(offering.addons.length > 0 || offering.addonsExtra) && ` ${s.offer.extrasLead} ${[...offering.addons.map(chipLabel), offering.addonsExtra].filter(Boolean).join(", ")}.`}
            </p>
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 [&_p]:mt-0">
              <ScreenPrompt tone="section" flush>{screen.copy.packagesHeading}</ScreenPrompt>
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
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 [&_p]:mt-0">
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
  const [draft, setDraft] = useState<CustomerAnswer>(() => saved ?? { kind: "customer", version: 1, numberAsked: 3, yesNo: "yes", interests: [] });
  const write = (next: CustomerAnswer) => {
    setDraft(next);
    persist(screen.answerKey, next);
  };
  const times = draft.times ?? [];
  const interestsReady = draft.interests.length > 0;
  const timesReady = times.length > 0 || !!draft.timesExtra?.trim();
  const sentence = screen.sentence.split(/(\{number\}|\{product\}|\{yesNo\})/g);
  return (
    <LessonSurface
      title={screen.title}
      onBack={() => (step === 1 ? setStep(0) : onExit())}
      footer={
        <LessonContinue
          disabled={step === 0 ? !interestsReady : !timesReady}
          onClick={() => {
            if (step === 0) {
              if (interestsReady) setStep(1);
              return;
            }
            if (timesReady) onFinish({ ...draft, times: times.filter(isAvailabilitySlot) });
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
                      value={draft.numberAsked}
                      onChange={(value) => {
                        const n = typeof value === "number" ? value : Number(value);
                        if (n >= 1 && n <= 20) write({ ...draft, numberAsked: n });
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
  const s = useSurfaceCopy();
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
      <LessonTopBar
        title={s.competitor.title}
        onBack={() => (step === 2 ? setStep(1) : onExit())}
        trailing={<span className="text-[18px] font-semibold text-[#0A8FA8]">{step} of 2</span>}
      />
      <div className="mx-5 mt-2 min-h-0 flex-1 overflow-y-auto">
        {step === 1 ? (
          <>
            <p className={LESSON_HINT}>{screen.copy.pricesIntro}</p>
            <p className={`mt-3 ${LESSON_BODY}`}>
              {s.competitor.iChecked}{" "}
              <input aria-label={s.competitor.walkersChecked} inputMode="numeric" value={String(draft.walkersChecked)} onChange={(event) => { const n = Number(event.target.value.replace(/\D/g, "")); if (n >= 1 && n <= 10) write({ ...draft, walkersChecked: n }); }} className="mx-1 inline-block h-8 w-12 rounded-lg text-center font-bold shadow-[inset_0_0_0_1.5px_#D9DEE8] outline-none" />
              {" "}{s.competitor.otherWalkersFor}{" "}
              <select aria-label={s.competitor.jobCompared} value={draft.jobComparedId ?? ""} onChange={(event) => write({ ...draft, jobComparedId: event.target.value || undefined })} className="mx-1 h-9 rounded-lg bg-white px-2 font-semibold shadow-[inset_0_0_0_1.5px_#0CC1E0]">
                <option value="">{s.competitor.chooseJob}</option>
                {packages.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
              {" "}{s.competitor.theyCharge}
              <input aria-label={s.competitor.lowest} inputMode="numeric" value={String(draft.priceLow)} onChange={(event) => { const n = Number(event.target.value.replace(/\D/g, "")); if (n >= 1 && n <= 9999) write({ ...draft, priceLow: n }); }} className="mx-1 inline-block h-8 w-14 rounded-lg text-center font-bold shadow-[inset_0_0_0_1.5px_#D9DEE8] outline-none" />
              to $
              <input aria-label={s.competitor.highest} inputMode="numeric" value={String(draft.priceHigh)} onChange={(event) => { const n = Number(event.target.value.replace(/\D/g, "")); if (n >= 1 && n <= 9999) write({ ...draft, priceHigh: n }); }} className="mx-1 inline-block h-8 w-14 rounded-lg text-center font-bold shadow-[inset_0_0_0_1.5px_#D9DEE8] outline-none" />
              .
            </p>
            <button type="button" className="mt-3 font-semibold text-[#0CC1E0]" onClick={() => setJobExtraOpen((open) => !open)}>{screen.copy.addJob}</button>
            {jobExtraOpen && (
              <input aria-label={s.competitor.anotherJob} maxLength={40} value={draft.jobComparedExtra ?? ""} onChange={(event) => write({ ...draft, jobComparedExtra: event.target.value })} className="mt-2 h-11 w-full rounded-xl px-3 shadow-[inset_0_0_0_1.5px_#0CC1E0] outline-none" placeholder={s.competitor.typeJob} />
            )}
          </>
        ) : (
          <>
            <p className={LESSON_HINT}>{screen.copy.extrasIntro}</p>
            <h2 className={`mb-2 mt-4 ${FREDOKA_CLASS} text-[18px] font-semibold leading-[26px] text-[#0CC1E0]`}>{s.competitor.oftenInclude}</h2>
            <div className="flex flex-wrap gap-2">
              {screen.addons.map((item) => (
                <Chip key={item.id} tone="package" label={item.label} selected={draft.addons.includes(item.id)} onClick={() => write({ ...draft, addons: toggle(draft.addons, item.id) })} />
              ))}
            </div>
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
                    <label key={idea.id} className="flex h-11 items-center gap-2 border-b border-[#F3F4F6] text-[18px] text-[#19347D]">
                      <input type="radio" name="do-differently" checked={draft.doDifferently === idea.id} onChange={() => write({ ...draft, doDifferently: idea.id })} />
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
        {step === 1 ? (
          <LessonContinue disabled={!pricesReady} onClick={() => pricesReady && setStep(2)} />
        ) : (
          <LessonContinue disabled={!ideaReady} onClick={() => ideaReady && onFinish(draft)} />
        )}
      </div>
    </section>
  );
}
