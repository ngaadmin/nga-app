"use client";

import { useState, type ReactNode } from "react";
import type { LaunchpadAnswers, LaunchpadAnswer } from "@/lib/launchpad/content/answers";
import type { LaunchpadDeliveryScreen, LaunchpadFloor } from "@/lib/launchpad/content/types";
import { deliveryLookups, keptAmount, moneyText, parsePaid } from "@/lib/launchpad/content/delivery/logic";
import { getReadyOf, recordJobOf, wrapUpJobOf } from "@/lib/launchpad/content/answers";
import { BronzeFirstLead, LESSON_BODY, LESSON_HINT, LESSON_PICK, LessonContinue, LessonSurface, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";
import { SCRIBBLE_SRC, type ScribbleName } from "@/components/launchpad/venture/handbook/scribble-mark";

function scribble(name: string): string | undefined {
  return name in SCRIBBLE_SRC ? SCRIBBLE_SRC[name as ScribbleName] : undefined;
}

function Chevron() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true" className="ml-1 inline-block">
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Tick() {
  return (
    <span className="mt-0.5 flex size-[22px] flex-none items-center justify-center rounded-full bg-[#E7F8FC]" aria-hidden="true">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2.2 6.2 4.8 8.8 9.8 3.4" stroke="#0CC1E0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function InlinePick({
  before,
  after,
  value,
  emptyLabel,
  options,
  onChange,
}: {
  before: string;
  after: string;
  value: string;
  emptyLabel: string;
  options: readonly { id: string; label: string }[];
  onChange: (id: string) => void;
}) {
  const picked = options.find((option) => option.id === value);
  return (
    <p className={`mb-[18px] ${LESSON_BODY}`}>
      {before}
      <span className="relative inline">
        <span className={picked ? LESSON_PICK : "font-sans text-[18px] font-semibold leading-[26px] text-[#8A94A8] underline decoration-[#8A94A8] decoration-[1.5px] underline-offset-[3px]"}>
          {picked?.label || emptyLabel}
          <Chevron />
        </span>
        <select
          aria-label={before.trim()}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        >
          <option value="">{emptyLabel}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>{option.label}</option>
          ))}
        </select>
      </span>
      {after}
    </p>
  );
}

function Replay({ before, value, after }: { before: string; value: string; after: string }) {
  return (
    <p className={`mb-[18px] border-l-[3px] border-[#0CC1E0] pl-3 ${LESSON_BODY}`}>
      {before}
      {value ? <span className="font-semibold">{value}</span> : null}
      {after}
    </p>
  );
}

function Doodle({ name }: { name: string }) {
  const src = scribble(name);
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      width={56}
      height={56}
      draggable={false}
      data-scribble-large={name}
      className="pointer-events-none absolute bottom-[100px] right-7 z-raised h-auto w-14 mix-blend-multiply"
    />
  );
}

export function DeliveryFlow({
  screen,
  answers,
  floors,
  onExit,
  onFinish,
}: {
  screen: LaunchpadDeliveryScreen;
  answers?: LaunchpadAnswers;
  floors: readonly LaunchpadFloor[];
  onExit: () => void;
  onFinish: (answer: LaunchpadAnswer) => void;
}) {
  const lookups = deliveryLookups(screen, floors, answers);
  if (screen.step === "ready" && screen.ready) {
    return <ReadyScreens screen={screen} copy={screen.ready} remind={lookups.remind} gear={lookups.gear} answers={answers} onExit={onExit} onFinish={onFinish} />;
  }
  if (screen.step === "wrap" && screen.wrap) {
    return <WrapScreens screen={screen} copy={screen.wrap} proof={lookups.proof} payment={lookups.payment} feedback={lookups.feedback} answers={answers} onExit={onExit} onFinish={onFinish} />;
  }
  if (screen.step === "record" && screen.record) {
    return <RecordScreens screen={screen} copy={screen.record} lookups={lookups} answers={answers} onExit={onExit} onFinish={onFinish} />;
  }
  return null;
}

function ReadyScreens({
  screen,
  copy,
  remind,
  gear,
  answers,
  onExit,
  onFinish,
}: {
  screen: LaunchpadDeliveryScreen;
  copy: NonNullable<LaunchpadDeliveryScreen["ready"]>;
  remind: string;
  gear: readonly string[];
  answers?: LaunchpadAnswers;
  onExit: () => void;
  onFinish: (answer: LaunchpadAnswer) => void;
}) {
  const saved = getReadyOf(answers, screen.answerKey);
  const [page, setPage] = useState(0);
  const [about, setAbout] = useState(saved?.remindAbout ?? "");
  const [travel, setTravel] = useState(saved?.travelHow ?? "");
  const [leave, setLeave] = useState(saved?.leaveEarly ?? "");
  const [pack, setPack] = useState(saved?.packWhen ?? "");
  const ready = page === 0 ? copy.aboutOptions.some((row) => row.id === about) : page === 1 ? [copy.travelOptions, copy.leaveOptions, copy.packOptions].every((options, index) => options.some((row) => row.id === [travel, leave, pack][index])) : true;
  const finish = () => {
    if (!ready) return;
    if (page < 2) {
      setPage(page + 1);
      return;
    }
    onFinish({ kind: "get-ready", version: 1, remindAbout: about, travelHow: travel, leaveEarly: leave, packWhen: pack });
  };
  return (
    <Shell screen={screen} page={page} ready={ready} onBack={() => (page === 0 ? onExit() : setPage(page - 1))} onNext={finish}>
      {page === 0 ? (
        <>
          <BronzeFirstLead flush question={screen.question} context={screen.context} guidance={screen.guidance} />
          <Replay before={copy.remindBefore} value={remind} after={copy.remindAfter} />
          <InlinePick before={copy.aboutBefore} after={copy.aboutAfter} value={about} emptyLabel={copy.emptyLabel} options={copy.aboutOptions} onChange={setAbout} />
        </>
      ) : null}
      {page === 1 ? (
        <>
          <InlinePick before={copy.travelBefore} after={copy.travelAfter} value={travel} emptyLabel={copy.emptyLabel} options={copy.travelOptions} onChange={setTravel} />
          <InlinePick before={copy.leaveBefore} after={copy.leaveAfter} value={leave} emptyLabel={copy.emptyLabel} options={copy.leaveOptions} onChange={setLeave} />
          <InlinePick before={copy.packBefore} after={copy.packAfter} value={pack} emptyLabel={copy.emptyLabel} options={copy.packOptions} onChange={setPack} />
        </>
      ) : null}
      {page === 2 ? (
        <>
          <ScreenPrompt tone="section">{copy.packTitle}</ScreenPrompt>
          {gear.length === 0 ? (
            <p className={`mt-3 ${LESSON_BODY}`}>{copy.packEmpty}</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {gear.map((item) => (
                <li key={item} className={`flex items-start gap-2.5 ${LESSON_BODY}`}>
                  <Tick />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          <p className={`mt-[18px] ${LESSON_HINT}`}>{copy.note}</p>
        </>
      ) : null}
    </Shell>
  );
}

function WrapScreens({
  screen,
  copy,
  proof,
  payment,
  feedback,
  answers,
  onExit,
  onFinish,
}: {
  screen: LaunchpadDeliveryScreen;
  copy: NonNullable<LaunchpadDeliveryScreen["wrap"]>;
  proof: string;
  payment: string;
  feedback: string;
  answers?: LaunchpadAnswers;
  onExit: () => void;
  onFinish: (answer: LaunchpadAnswer) => void;
}) {
  const saved = wrapUpJobOf(answers, screen.answerKey);
  const [page, setPage] = useState(0);
  const [askPay, setAskPay] = useState(saved?.paymentWhen ?? "");
  const [ask, setAsk] = useState(saved?.feedbackQuestion ?? "");
  const [when, setWhen] = useState(saved?.trackerWhen ?? "");
  const ready = page === 1 ? copy.askPayOptions.some((row) => row.id === askPay) && copy.askOptions.some((row) => row.id === ask) : page === 2 ? copy.whenOptions.some((row) => row.id === when) : true;
  const finish = () => {
    if (!ready) return;
    if (page < 2) {
      setPage(page + 1);
      return;
    }
    onFinish({ kind: "wrap-up-job", version: 1, paymentWhen: askPay, feedbackQuestion: ask, trackerWhen: when });
  };
  return (
    <Shell screen={screen} page={page} ready={ready} onBack={() => (page === 0 ? onExit() : setPage(page - 1))} onNext={finish}>
      {page === 0 ? (
        <>
          <BronzeFirstLead flush question={screen.question} context={screen.context} guidance={screen.guidance} />
          <Replay before={copy.proofBefore} value={proof} after={copy.proofAfter} />
          <Replay before={copy.paymentBefore} value={payment} after={copy.paymentAfter} />
          <Replay before={copy.feedbackLines?.length && feedback ? "" : copy.feedbackBefore} value={feedback} after={copy.feedbackLines?.length && feedback ? "" : copy.feedbackAfter} />
        </>
      ) : null}
      {page === 1 ? (
        <>
          <InlinePick before={copy.askPayBefore} after={copy.askPayAfter} value={askPay} emptyLabel={copy.emptyLabel} options={copy.askPayOptions} onChange={setAskPay} />
          <InlinePick before={copy.askBefore} after={copy.askAfter} value={ask} emptyLabel={copy.emptyLabel} options={copy.askOptions} onChange={setAsk} />
        </>
      ) : null}
      {page === 2 ? (
        <>
          <Replay before={copy.trackerLine} value="" after="" />
          <InlinePick before={copy.whenBefore} after={copy.whenAfter} value={when} emptyLabel={copy.emptyLabel} options={copy.whenOptions} onChange={setWhen} />
          <p className={LESSON_HINT}>{copy.note}</p>
        </>
      ) : null}
    </Shell>
  );
}

type DraftJob = { serviceId: string; paid: string };

function RecordScreens({
  screen,
  copy,
  lookups,
  answers,
  onExit,
  onFinish,
}: {
  screen: LaunchpadDeliveryScreen;
  copy: NonNullable<LaunchpadDeliveryScreen["record"]>;
  lookups: ReturnType<typeof deliveryLookups>;
  answers?: LaunchpadAnswers;
  onExit: () => void;
  onFinish: (answer: LaunchpadAnswer) => void;
}) {
  const saved = recordJobOf(answers, screen.answerKey);
  const only = lookups.services.length === 1 ? lookups.services[0] : undefined;
  const [page, setPage] = useState(0);
  const [jobAt, setJobAt] = useState(0);
  const [jobs, setJobs] = useState<DraftJob[]>(() => {
    const rows = saved?.jobs.map((job) => ({ serviceId: job.serviceId, paid: String(job.paid) }));
    if (rows && rows.length) return rows;
    return [{ serviceId: only?.id ?? "", paid: "" }];
  });
  const job = jobs[jobAt] ?? jobs[0]!;
  const serviceId = job.serviceId || only?.id || "";
  const paid = parsePaid(job.paid, copy.paidMax);
  const cost = serviceId ? lookups.costFor(serviceId) : null;
  const price = serviceId ? lookups.priceFor(serviceId) : null;
  const kept = paid !== null ? keptAmount(paid, cost ?? 0) : null;
  const complete = (row: DraftJob) => Boolean((row.serviceId || only?.id) && parsePaid(row.paid, copy.paidMax) !== null);
  const ready = page === 0 ? Boolean(serviceId) : page === 1 ? paid !== null : jobs.every(complete);
  const update = (next: DraftJob) => setJobs((rows) => rows.map((row, index) => (index === jobAt ? next : row)));
  const finish = () => {
    if (!ready) return;
    if (page < 2) {
      setPage(page + 1);
      return;
    }
    onFinish({
      kind: "record-job",
      version: 1,
      jobs: jobs.flatMap((row) => {
        const amount = parsePaid(row.paid, copy.paidMax);
        const id = row.serviceId || only?.id || "";
        return amount !== null && id ? [{ serviceId: id, paid: amount }] : [];
      }),
    });
  };
  const addJob = () => {
    if (!jobs.every(complete)) return;
    setJobs((rows) => [...rows, { serviceId: only?.id ?? "", paid: "" }]);
    setJobAt(jobs.length);
    setPage(0);
  };
  const back = () => {
    if (page > 0) {
      setPage(page - 1);
      return;
    }
    if (jobAt > 0 && !job.paid.trim() && !job.serviceId) {
      setJobs((rows) => rows.slice(0, -1));
      setJobAt(jobAt - 1);
      setPage(2);
      return;
    }
    if (jobAt > 0) {
      setJobAt(jobAt - 1);
      setPage(2);
      return;
    }
    onExit();
  };
  return (
    <Shell screen={screen} page={page} ready={ready} onBack={back} onNext={finish}>
      {page === 0 ? (
        <>
          <BronzeFirstLead flush question={screen.question} context={screen.context} guidance={screen.guidance} />
          {only ? (
            <Replay before={copy.serviceBefore} value={only.label} after={copy.serviceAfter} />
          ) : (
            <InlinePick before={copy.serviceBefore} after={copy.serviceAfter} value={job.serviceId} emptyLabel={copy.emptyLabel} options={lookups.services} onChange={(id) => update({ ...job, serviceId: id })} />
          )}
          <Replay before={copy.priceBefore} value={price === null ? "" : moneyText(price)} after={copy.priceAfter} />
        </>
      ) : null}
      {page === 1 ? (
        <>
          <p className={`mb-[18px] ${LESSON_BODY}`}>
            {copy.paidBefore}
            <span className="mx-1 inline-flex h-8 w-[4.75rem] items-center gap-0 rounded-lg border-[1.5px] border-[#D5DAE3] bg-white pl-1.5">
              <span className="font-sans text-[18px] font-semibold leading-[26px] text-[#19347D]" aria-hidden="true">{copy.paidPrefix}</span>
              <input
                aria-label={copy.paidBefore.trim()}
                inputMode="decimal"
                placeholder={copy.paidHint}
                value={job.paid}
                onChange={(event) => update({ ...job, paid: event.target.value })}
                className="w-full min-w-0 bg-transparent pl-0 text-left font-sans text-[18px] font-semibold leading-[26px] text-[#19347D] outline-none placeholder:text-[16px] placeholder:font-normal placeholder:text-[#8A94A8]"
              />
            </span>
            {copy.paidAfter}
          </p>
          <Replay before={copy.costBefore} value={cost === null ? "" : moneyText(cost)} after={copy.costAfter} />
          <Replay before={copy.keptBefore} value={kept === null ? "" : moneyText(kept)} after={copy.keptAfter} />
          {kept !== null && kept <= 0 ? <p className={LESSON_HINT}>{copy.lowKeep}</p> : null}
        </>
      ) : null}
      {page === 2 ? (
        <>
          <Replay before={copy.trackerLine} value="" after="" />
          <button type="button" onClick={addJob} className="mb-3.5 font-sans text-[16px] font-semibold leading-6 text-[#0CC1E0]">
            {copy.addJob}
          </button>
          <p className={LESSON_HINT}>{copy.note}</p>
        </>
      ) : null}
    </Shell>
  );
}

function Shell({
  screen,
  page,
  ready,
  onBack,
  onNext,
  children,
}: {
  screen: LaunchpadDeliveryScreen;
  page: number;
  ready: boolean;
  onBack: () => void;
  onNext: () => void;
  children: ReactNode;
}) {
  return (
    <LessonSurface
      title={screen.title}
      onBack={onBack}
      progress={{ index: page + 1, total: 3 }}
      footer={<LessonContinue disabled={!ready} onClick={onNext} />}
      decoration={<Doodle name={screen.doodles[page] ?? ""} />}
    >
      <div data-task-screen="delivery" data-delivery-step={screen.step} data-order-page={page + 1}>
        {children}
      </div>
    </LessonSurface>
  );
}
