"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import type { CostLine, CostsAnswer, LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import type { LaunchpadFloor, LaunchpadKnowYourCostScreen } from "@/lib/launchpad/content/types";
import {
  costsReady,
  formatOngoingMoney,
  formatStartupMoney,
  ongoingInputText,
  parseOngoingInput,
  parseStartupInput,
  savedCosts,
  serviceTotal,
  startupTotal,
  stepAfterHub,
  type CostEditorStep,
} from "@/lib/launchpad/content/know-your-cost/logic";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { currencySymbol } from "@/lib/dashboard/currency/format-money";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { CostWorkbookBody } from "@/components/launchpad/venture/screens/cost-workbook";
import { BinderCard } from "@/components/launchpad/venture/handbook/paper-art";
import { LogoMark, logoMarkLabel } from "@/components/launchpad/venture/identity/business-logo";
import { FREDOKA_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";
import { BTN_CYAN_COMPACT, TickBadge } from "@/components/launchpad/venture-test/venture-test-ui";
import { IDENTITY_ANSWER_KEY } from "@/lib/launchpad/content/seed/identity-silver";
import { identityAnswerOf } from "@/lib/launchpad/content/answers";

const CONTINUE_ON =
  "mx-auto flex h-11 w-[140px] items-center justify-center rounded-full bg-[#19347D] font-heading text-[16px] font-semibold leading-none text-white";
const CONTINUE_OFF = `${CONTINUE_ON} pointer-events-none opacity-[0.35]`;
const ADD =
  "inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#0CC1E0] px-3.5 font-heading text-[18px] font-bold text-white";
const GHOST =
  "inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-white px-3 font-heading text-[18px] font-bold text-[#0CC1E0] shadow-[inset_0_0_0_1.5px_#0CC1E0]";

function newId(): string {
  return `c${Math.random().toString(36).slice(2, 10)}`;
}

function Crumb({
  floorName,
  silverTitle,
  current,
  onBuilding,
  onCorridor,
}: {
  floorName: string;
  silverTitle: string;
  current: string;
  onBuilding: () => void;
  onCorridor: () => void;
}) {
  return (
    <nav aria-label="Breadcrumb" className="mx-5 mt-2 truncate text-[16px] font-medium text-[#9AA3B5]">
      <button type="button" onClick={onBuilding} className="text-[#9AA3B5]">
        ‹ Building
      </button>
      {" · "}
      <button type="button" onClick={onCorridor} className="text-[#9AA3B5]">
        {floorName}
      </button>
      {` · ${silverTitle} · ${current}`}
    </nav>
  );
}

function BackTitle({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mx-5 mt-6 flex items-center gap-1">
      <button type="button" onClick={onBack} aria-label="Back" className="flex size-11 items-center justify-center text-[#19347D]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <h1 className={`${FREDOKA_CLASS} text-[24px] font-semibold leading-[34px] text-[#19347D]`}>{title}</h1>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-sans text-[16px] font-semibold leading-[23px] text-[#4A5568]">{children}</p>;
}

/**
 * On a short screen the list scrolls and the button stays at the bottom.
 * On a tall screen the button sits under the content, so desktop width does
 * not leave a blank band above it.
 */
const SCROLL = "min-h-0 overflow-y-auto [@media(max-height:879px)]:flex-1";

function Footer({ children }: { children: ReactNode }) {
  return <div className="mx-5 flex flex-none justify-center pb-4 pt-3 [@media(max-height:879px)]:mt-auto">{children}</div>;
}

function MoneyField({
  label,
  amount,
  cents,
  symbol,
  onCommit,
}: {
  label: string;
  amount: number;
  cents: boolean;
  symbol: string;
  onCommit: (amount: number) => void;
}) {
  const shown = cents ? ongoingInputText(amount) : String(amount);
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? shown;
  return (
    <label className={`flex h-8 min-w-[86px] items-center justify-end gap-0.5 rounded-[10px] bg-white px-2 shadow-[inset_0_0_0_1.5px_#D9DEE8] ${amount === 0 && draft === null ? "text-[#9AA3B5]" : ""}`}>
      <span className="font-sans text-[16px] leading-[23px] text-[#4A5568]" aria-hidden="true">
        {symbol}
      </span>
      <input
        inputMode={cents ? "decimal" : "numeric"}
        aria-label={`Amount for ${label}`}
        value={value}
        onChange={(event) => {
          const next = cents ? event.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1") : event.target.value.replace(/\D/g, "");
          const limited = cents ? next.replace(/^(\d{0,6})(\.\d{0,2})?.*$/, "$1$2") : next.slice(0, 6);
          setDraft(limited);
          const parsed = cents ? parseOngoingInput(limited) : parseStartupInput(limited);
          if (parsed !== null) onCommit(parsed);
        }}
        onBlur={() => {
          const raw = draft;
          if (raw !== null) {
            const parsed = raw.trim() === "" ? 0 : cents ? parseOngoingInput(raw) : parseStartupInput(raw);
            onCommit(parsed ?? amount);
          }
          setDraft(null);
        }}
        className={`w-14 bg-transparent text-right font-sans text-[18px] font-bold leading-[26px] tabular-nums outline-none ${amount === 0 && draft === null ? "text-[#9AA3B5]" : "text-[#19347D]"}`}
      />
    </label>
  );
}

function RemoveButton({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button type="button" aria-label={`Remove ${label || "item"}`} onClick={onRemove} className="flex size-8 flex-none items-center justify-center rounded-lg text-[#9AA3B5]">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}

/**
 * Know your cost. The hub, both cost sheets, the optional totals check, and
 * the workbook page. Answers save as the learner edits.
 */
export function KnowYourCostFlow({
  screen,
  floors: floorsProp,
  answers: answersProp,
  setAnswer: setAnswerProp,
  levelName,
  silverTitle,
  businessName,
  initialStep,
  onBuilding = () => {},
  onCorridor = () => {},
  onExit = () => {},
  onFinish = () => {},
}: {
  screen: LaunchpadKnowYourCostScreen;
  floors?: readonly LaunchpadFloor[];
  answers?: LaunchpadAnswers;
  setAnswer?: (answerKey: string, answer: CostsAnswer) => void;
  levelName?: string;
  silverTitle?: string;
  businessName?: string;
  initialStep?: CostEditorStep;
  onBuilding?: () => void;
  onCorridor?: () => void;
  onExit?: (answer: CostsAnswer) => void;
  onFinish?: (answer: CostsAnswer) => void;
}) {
  const ctx = useLaunchpadAnswers();
  const floors = floorsProp ?? ctx?.floors ?? [];
  const answers = answersProp ?? ctx?.answers ?? {};
  const persist = setAnswerProp ?? ((key, answer) => ctx?.setAnswer(key, answer));
  const currency = readCurrencyPreference();
  const symbol = currencySymbol(currency);
  const answer = useMemo(() => savedCosts(answers, screen, floors), [answers, screen, floors]);
  const ref = useRef(answer);
  ref.current = answer;
  const [step, setStep] = useState<CostEditorStep>(initialStep ?? { name: "hub" });
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const update = (next: CostsAnswer) => {
    ref.current = next;
    persist(screen.answerKey, next);
  };
  const patchLine = (list: "marketing" | "starterGear", id: string, amount: number) => {
    const startup = ref.current.startup;
    update({
      ...ref.current,
      startup: { ...startup, [list]: startup[list].map((line) => (line.id === id ? { ...line, amount } : line)) },
    });
  };
  const patchService = (serviceId: string, lines: readonly CostLine[]) => {
    update({
      ...ref.current,
      ongoing: ref.current.ongoing.map((service) => (service.serviceId === serviceId ? { ...service, lines } : service)),
    });
  };

  const ready = costsReady(ref.current);
  const floorName = levelName ?? "Planning";
  const plaque = silverTitle ?? "Pricing";
  const identity = identityAnswerOf(answers, IDENTITY_ANSWER_KEY);
  const businessLabel = identity?.name?.trim() || businessName?.trim() || "";

  const crumb = (
    <Crumb floorName={floorName} silverTitle={plaque} current={screen.heading ?? "Know your cost"} onBuilding={onBuilding} onCorridor={onCorridor} />
  );

  const lineRows = (lines: readonly CostLine[], cents: boolean, onAmount: (id: string, amount: number) => void, onRemove: (id: string) => void, onRename?: (id: string, label: string) => void) =>
    lines.map((line) => (
      <div key={line.id} className="flex items-center gap-2 border-b border-[#F3F4F6] py-1.5 last:border-b-0">
        {line.custom && onRename ? (
          <input
            aria-label="Item name"
            value={drafts[line.id] ?? line.label}
            placeholder="Item name"
            maxLength={80}
            onChange={(event) => {
              const label = event.target.value;
              setDrafts((prev) => ({ ...prev, [line.id]: label }));
              onRename(line.id, label);
            }}
            className="min-w-0 flex-1 bg-transparent font-medium text-[16px] text-[#19347D] outline-none placeholder:text-[#9AA3B5]"
          />
        ) : (
          <span className="min-w-0 flex-1 font-medium text-[18px] leading-snug text-[#19347D]">{line.label}</span>
        )}
        <MoneyField label={line.label || "New item"} amount={line.amount} cents={cents} symbol={symbol} onCommit={(amount) => onAmount(line.id, amount)} />
        <RemoveButton label={line.label} onRemove={() => onRemove(line.id)} />
      </div>
    ));

  const addButton = (onAdd: () => void) => (
    <button type="button" onClick={onAdd} className={`${GHOST} mt-2`}>
      <span aria-hidden="true">+</span> Add another item
    </button>
  );

  let body: ReactNode;
  if (step.name === "startup") {
    const startup = ref.current.startup;
    const dropBlank = (lines: readonly CostLine[]) => lines.filter((line) => line.label.trim() || !line.custom);
    body = (
      <>
        <BackTitle title="Start-up costs" onBack={() => setStep({ name: "hub" })} />
        <div className={`mx-5 mt-1 ${SCROLL} pb-2`}>
          <Eyebrow>{plaque}</Eyebrow>
          <p className="mt-1 text-[16px] leading-snug text-[#6B7280]">{screen.copy.startupIntro}</p>
          <h2 className="mb-0.5 mt-3 font-sans text-[16px] font-semibold leading-[23px] text-[#4A5568]">{screen.copy.marketingLabel}</h2>
          {lineRows(startup.marketing, false, (id, amount) => patchLine("marketing", id, amount), (id) =>
            update({ ...ref.current, startup: { ...ref.current.startup, marketing: ref.current.startup.marketing.filter((line) => line.id !== id) } }),
          )}
          <h2 className="mb-0.5 mt-3 font-sans text-[16px] font-semibold leading-[23px] text-[#4A5568]">{screen.copy.starterLabel}</h2>
          <p className="mb-1 font-sans text-[16px] leading-[23px] text-[#4A5568]">{screen.copy.starterNote}</p>
          {lineRows(
            startup.starterGear,
            false,
            (id, amount) => patchLine("starterGear", id, amount),
            (id) => update({ ...ref.current, startup: { ...ref.current.startup, starterGear: ref.current.startup.starterGear.filter((line) => line.id !== id) } }),
            (id, label) =>
              update({
                ...ref.current,
                startup: {
                  ...ref.current.startup,
                  starterGear: ref.current.startup.starterGear.map((line) => (line.id === id ? { ...line, label } : line)),
                },
              }),
          )}
          {addButton(() =>
            update({
              ...ref.current,
              startup: {
                ...ref.current.startup,
                starterGear: [...ref.current.startup.starterGear, { id: newId(), label: "", amount: 0, custom: true }],
              },
            }),
          )}
        </div>
        <div className="mx-5 mt-2 flex items-center justify-between rounded-xl bg-[#F7FAFC] px-3 py-2.5">
          <span className="text-[16px] text-[#6B7280]">Start-up total</span>
          <span className="font-heading text-xl font-bold tabular-nums text-[#19347D]" data-startup-total="">
            {formatStartupMoney(startupTotal(ref.current), currency)}
          </span>
        </div>
        <Footer>
          <button
            type="button"
            className={BTN_CYAN_COMPACT}
            onClick={() => {
              update({
                ...ref.current,
                startup: {
                  ...ref.current.startup,
                  marketing: dropBlank(ref.current.startup.marketing),
                  starterGear: dropBlank(ref.current.startup.starterGear),
                  done: true,
                },
              });
              setStep({ name: "hub" });
            }}
          >
            Done
          </button>
        </Footer>
      </>
    );
  } else if (step.name === "service") {
    const service = ref.current.ongoing.find((row) => row.serviceId === step.serviceId);
    if (!service) {
      body = (
        <>
          <BackTitle title="Ongoing costs" onBack={() => setStep({ name: "ongoing" })} />
        </>
      );
    } else {
      const intro = screen.copy.serviceIntro.split("{service}").join(service.label);
      body = (
        <>
          <BackTitle title={service.label} onBack={() => setStep({ name: "ongoing" })} />
          <div className={`mx-5 mt-1 ${SCROLL} pb-2`}>
            <p className="text-[16px] leading-snug text-[#6B7280]">{intro}</p>
            <div className="mt-2">
              {lineRows(
                service.lines,
                true,
                (id, amount) => {
                  const lines = ref.current.ongoing.find((row) => row.serviceId === service.serviceId)?.lines ?? [];
                  patchService(service.serviceId, lines.map((line) => (line.id === id ? { ...line, amount } : line)));
                },
                (id) => {
                  const lines = ref.current.ongoing.find((row) => row.serviceId === service.serviceId)?.lines ?? [];
                  patchService(service.serviceId, lines.filter((line) => line.id !== id));
                },
                (id, label) => {
                  const lines = ref.current.ongoing.find((row) => row.serviceId === service.serviceId)?.lines ?? [];
                  patchService(service.serviceId, lines.map((line) => (line.id === id ? { ...line, label } : line)));
                },
              )}
            </div>
            {addButton(() =>
              patchService(service.serviceId, [
                ...(ref.current.ongoing.find((row) => row.serviceId === service.serviceId)?.lines ?? []),
                { id: newId(), label: "", amount: 0, custom: true },
              ]),
            )}
          </div>
          <div className="mx-5 mt-2 flex items-center justify-between rounded-xl bg-[#F7FAFC] px-3 py-2.5">
            <span className="text-[16px] text-[#6B7280]">This job costs</span>
            <span className="font-heading text-xl font-bold tabular-nums text-[#19347D]" data-job-total="">
              {formatOngoingMoney(serviceTotal(ref.current.ongoing.find((row) => row.serviceId === service.serviceId)?.lines ?? []), currency)}
            </span>
          </div>
          <Footer>
            <button
              type="button"
              className={BTN_CYAN_COMPACT}
              onClick={() => {
                const current = ref.current.ongoing.find((row) => row.serviceId === service.serviceId);
                patchService(
                  service.serviceId,
                  (current?.lines ?? []).filter((line) => line.label.trim() || !line.custom),
                );
                update({
                  ...ref.current,
                  ongoing: ref.current.ongoing.map((row) =>
                    row.serviceId === service.serviceId
                      ? { ...row, lines: row.lines.filter((line) => line.label.trim() || !line.custom), done: true }
                      : row,
                  ),
                });
                setStep({ name: "ongoing" });
              }}
            >
              Done
            </button>
          </Footer>
        </>
      );
    }
  } else if (step.name === "ongoing") {
    const services = ref.current.ongoing;
    const allDone = services.length === 0 || services.every((row) => row.done);
    body = (
      <>
        <BackTitle title="Ongoing costs" onBack={() => setStep({ name: "hub" })} />
        <div className={`mx-5 mt-1 ${SCROLL}`}>
          <Eyebrow>{plaque}</Eyebrow>
          <p className="mt-1 text-[16px] leading-snug text-[#6B7280]">{screen.copy.ongoingIntro}</p>
          <div className="mt-4 flex flex-col gap-2">
            {services.length === 0 && <p className="text-[16px] text-[#6B7280]">You have not chosen a service yet. You can still mark this done.</p>}
            {services.map((service) => (
              <article
                key={service.serviceId}
                className={`flex flex-row items-center gap-2 rounded-[14px] px-3 py-2.5 ${service.done ? "bg-[#FFFCF5] shadow-[inset_0_0_0_1.5px_#FFE6B8]" : "bg-white shadow-[inset_0_0_0_1.5px_#E5E7EB]"}`}
                data-service-card={service.serviceId}
                data-service-tile-layout="row"
              >
                <h2 className="shrink-0 font-sans text-[18px] font-bold leading-[26px] text-[#19347D]">{service.label}</h2>
                <p className="shrink-0 whitespace-nowrap text-right font-sans text-[16px] leading-[23px] text-[#4A5568]">
                  {service.done ? (
                    <b className="font-bold text-[#19347D]">{formatOngoingMoney(serviceTotal(service.lines), currency)}</b>
                  ) : (
                    "Not calculated yet"
                  )}
                </p>
                {service.done ? (
                  <button type="button" className="shrink-0 font-semibold text-[#0CC1E0]" onClick={() => setStep({ name: "service", serviceId: service.serviceId })}>
                    Edit
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex h-8 shrink-0 items-center rounded-[10px] bg-[#0CC1E0] px-2.5 font-heading text-[18px] font-bold text-white"
                    onClick={() => setStep({ name: "service", serviceId: service.serviceId })}
                  >
                    Calculate the cost
                  </button>
                )}
                {service.done && <TickBadge size={22} />}
              </article>
            ))}
          </div>
          {!allDone && <p className="mt-4 text-[16px] leading-snug text-[#9AA3B5]">Done stays off until every service has a cost.</p>}
        </div>
        <Footer>
          <button
            type="button"
            disabled={!allDone}
            className={allDone ? BTN_CYAN_COMPACT : CONTINUE_OFF}
            onClick={() => {
              if (services.length === 0) update({ ...ref.current, ongoingAcknowledged: true });
              setStep({ name: "hub" });
            }}
          >
            Done
          </button>
        </Footer>
      </>
    );
  } else if (step.name === "totals") {
    const view = ref.current;
    body = (
      <>
        {crumb}
        <div className={`mx-5 mt-6 ${SCROLL}`}>
          <Eyebrow>{plaque}</Eyebrow>
          <h1 className={`mt-0.5 ${FREDOKA_CLASS} text-[24px] font-semibold leading-[34px] text-[#19347D]`}>Your costs</h1>
          <p className="mt-1 text-[16px] leading-snug text-[#6B7280]">{screen.copy.totalsIntro}</p>
          <div className="mt-5 flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <span className="font-sans text-[18px] font-medium leading-[26px] text-[#19347D]">Start-up total</span>
              <span className="font-heading text-lg font-bold tabular-nums text-[#19347D]">{formatStartupMoney(startupTotal(view), currency)}</span>
            </div>
            <div>
              <p className="font-sans text-[16px] font-medium leading-[23px] text-[#4A5568]">Ongoing · per job</p>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {view.ongoing.map((service) => (
                  <div key={service.serviceId} className="flex justify-between font-sans text-[18px] font-medium leading-[26px] text-[#19347D]">
                    <span>{service.label}</span>
                    <span className="text-[#6B7280]">{formatOngoingMoney(serviceTotal(service.lines), currency)}</span>
                  </div>
                ))}
              </div>
            </div>
            <svg className="block" width="100%" height="10" viewBox="0 0 254 10" preserveAspectRatio="none" aria-hidden="true">
              <path d="M2 6C30 2.5 52 8.5 84 5.2S140 2.8 170 6.4S226 8 252 4.6" fill="none" stroke="#D9D1C3" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <div className="flex flex-col gap-1 rounded-[14px] bg-[#F0FBFE] px-4 py-3.5">
              <span className="font-sans text-[16px] font-semibold leading-[23px] text-[#0CC1E0]">Grand total to start</span>
              <span className="font-heading text-[28px] font-extrabold leading-none tabular-nums text-[#19347D]" data-grand-total="">
                {formatStartupMoney(startupTotal(view), currency)}
              </span>
              <span className="text-[16px] leading-snug text-[#6B7280]">{screen.copy.grandNote}</span>
            </div>
          </div>
        </div>
        <Footer>
          <button type="button" className={CONTINUE_ON} onClick={() => setStep({ name: "workbook" })}>
            Continue
          </button>
        </Footer>
      </>
    );
  } else if (step.name === "workbook") {
    body = (
      <>
        <header className="flex h-14 flex-none items-center gap-2 px-3">
          <button type="button" aria-label="Close" onClick={() => onFinish(ref.current)} className="flex size-11 items-center justify-center text-[#19347D]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div className="min-w-0">
            <h1 className="font-heading text-base font-semibold text-[#19347D]">My handbook</h1>
            {businessLabel && <p className="truncate text-[16px] text-[#9AA3B5]">{businessLabel}</p>}
          </div>
        </header>
        <div className={`mb-2 ${SCROLL}`}>
          <BinderCard data-cost-sheet="">
            <div className="mb-3 flex items-center gap-2.5" data-mini-identity="">
              {identity?.shape && identity.color && identity.icon ? (
                <LogoMark shape={identity.shape} color={identity.color} icon={identity.icon} size={32} label={logoMarkLabel(identity)} />
              ) : (
                <span aria-hidden="true" className="size-8 flex-none rounded-full bg-[#19347D]" data-logo-fallback="" />
              )}
              {businessLabel && <span className="truncate font-heading text-[17px] font-bold text-[#19347D]">{businessLabel}</span>}
            </div>
            <CostWorkbookBody
              answer={ref.current}
              currency={currency}
              marketingLabel={screen.copy.marketingLabel}
              starterLabel={screen.copy.starterLabel}
              hint={screen.copy.workbookHint}
              editable
              onEditStartup={() => setStep({ name: "startup" })}
              onEditService={(serviceId) => setStep({ name: "service", serviceId })}
            />
            <p className="mt-4 text-right font-sans text-[16px] leading-[23px] text-[#4A5568]">Page 3</p>
          </BinderCard>
        </div>
        <Footer>
          <button type="button" className={CONTINUE_ON} onClick={() => onFinish(ref.current)}>
            Continue
          </button>
        </Footer>
      </>
    );
  } else {
    const startupDone = ref.current.startup.done;
    const ongoingDone = ref.current.ongoing.length === 0 ? ref.current.ongoingAcknowledged === true : ref.current.ongoing.every((row) => row.done);
    const doneCount = ref.current.ongoing.filter((row) => row.done).length;
    body = (
      <>
        {crumb}
        <div className="mx-5 mt-1 flex justify-end">
          <button type="button" onClick={() => onExit(ref.current)} className="font-sans text-[16px] font-semibold leading-[23px] text-[#4A5568]">
            ✕ Exit
          </button>
        </div>
        <div className={`mx-5 mt-4 ${SCROLL}`}>
          <Eyebrow>{plaque}</Eyebrow>
          <h1 className={`mt-0.5 ${FREDOKA_CLASS} text-[24px] font-semibold leading-[34px] text-[#19347D]`}>Know your cost</h1>
          <p className="mt-1 text-[16px] leading-snug text-[#6B7280]">{screen.copy.hubIntro}</p>
          <div className="mt-4 flex flex-col gap-3.5">
            <HubCard
              title="Start-up costs"
              body={screen.copy.startupCard}
              done={startupDone}
              meta={startupDone ? `${formatStartupMoney(startupTotal(ref.current), currency)} total` : "Not started"}
              action={startupDone ? "Edit" : "Add costs"}
              onOpen={() => setStep({ name: "startup" })}
            />
            <HubCard
              title="Ongoing costs"
              body={screen.copy.ongoingCard}
              done={ongoingDone}
              meta={
                ongoingDone
                  ? "Every service calculated"
                  : doneCount > 0
                    ? `${doneCount} of ${ref.current.ongoing.length} services`
                    : "Not started"
              }
              action={startupDone && doneCount > 0 ? "Edit" : ongoingDone ? "Edit" : "Add costs"}
              onOpen={() => setStep({ name: "ongoing" })}
            />
          </div>
          {!ready && <p className="mt-4 text-[16px] leading-snug text-[#9AA3B5]">{screen.copy.hubWait}</p>}
        </div>
        <Footer>
          <button
            type="button"
            disabled={!ready}
            className={ready ? CONTINUE_ON : CONTINUE_OFF}
            onClick={() => {
              if (!costsReady(ref.current)) return;
              const next = stepAfterHub(screen.showTotals);
              setStep(next === "totals" ? { name: "totals" } : { name: "workbook" });
            }}
          >
            Continue
          </button>
        </Footer>
      </>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white [@media(max-height:879px)]:overflow-hidden" data-cost-step={step.name} data-task-screen="know-your-cost">
      {body}
    </section>
  );
}

function HubCard({
  title,
  body,
  done,
  meta,
  action,
  onOpen,
}: {
  title: string;
  body: string;
  done: boolean;
  meta: string;
  action: string;
  onOpen: () => void;
}) {
  const rich = meta.includes(" total");
  return (
    <article className={`flex flex-col gap-2.5 rounded-2xl p-4 ${done ? "bg-[#FFFCF5] shadow-[inset_0_0_0_1.5px_#FFE6B8]" : "bg-white shadow-[inset_0_0_0_1.5px_#E5E7EB]"}`} data-cost-card={title}>
      <div className="flex items-center gap-2">
        <h2 className="flex-1 font-heading text-[17px] font-bold text-[#19347D]">{title}</h2>
        {done && <TickBadge size={26} />}
      </div>
      <p className="text-[16px] leading-snug text-[#6B7280]">{body}</p>
      <p className="text-[16px] font-medium text-[#6B7280]">
        {rich ? (
          <>
            <b className="font-bold text-[#19347D]">{meta.replace(" total", "")}</b> total
          </>
        ) : (
          meta
        )}
      </p>
      {action === "Edit" ? (
        <button type="button" onClick={onOpen} className="self-start font-semibold text-[#0CC1E0]">
          Edit
        </button>
      ) : (
        <button type="button" onClick={onOpen} className={`${ADD} self-start`}>
          {action}
        </button>
      )}
    </article>
  );
}
