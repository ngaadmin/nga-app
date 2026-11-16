"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { useMemo, useState } from "react";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import type { LaunchpadFloor, LaunchpadSalesScreen } from "@/lib/launchpad/content/types";
import { chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";
import { findCustomersOf, identityAnswerOf, marketingOf, salesChannelsOf, type MarketingMaterialsAnswer, type OrderSystemAnswer, type SalesChannelsAnswer, type TellPeopleAnswer } from "@/lib/launchpad/content/answers";
import { FIND_CUSTOMERS_KEY } from "@/lib/launchpad/content/getting-ready/copy";
import { IDENTITY_ANSWER_KEY } from "@/lib/launchpad/content/seed/identity-silver";
import { OrderSystemFlow } from "@/components/launchpad/venture/screens/order-system-flow";
import { SCRIBBLE_SRC } from "@/components/launchpad/venture/handbook/scribble-mark";
import { marketingLines, marketingPieceHeading, type MarketingPieceId } from "@/lib/launchpad/content/sales/workbook-sheets";
import { OWN_LABEL, SALES_CHANNELS_KEY, pairedIds } from "@/lib/launchpad/content/sales/copy";
import type { LaunchpadTextField } from "@/lib/launchpad/content/types";
import { Chip } from "@/components/launchpad/venture/screens/lesson-controls";
import { FieldControl } from "@/components/launchpad/venture/screens/field-control";
import { AnchorDoodle, LessonContinue, LessonSurface, ScreenGuidance, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";
import { LESSON_BODY, LESSON_HINT } from "@/components/launchpad/venture/screens/screen-ui";

type ReadyAnswer = SalesChannelsAnswer | MarketingMaterialsAnswer | TellPeopleAnswer | OrderSystemAnswer;

function toggle(list: readonly string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function SalesFlow({
  screen,
  answers,
  floors,
  onExit,
  onFinish,
}: {
  screen: LaunchpadSalesScreen;
  answers?: LaunchpadAnswers;
  floors: readonly LaunchpadFloor[];
  onExit: () => void;
  onSave?: (answer: ReadyAnswer) => void;
  onFinish: (answer: ReadyAnswer) => void;
}) {
  if (screen.step === "order") return <OrderSystemFlow screen={screen} answers={answers} onExit={onExit} onFinish={onFinish} />;
  if (screen.step === "materials") return <MaterialsStep screen={screen} answers={answers} floors={floors} onExit={onExit} onFinish={onFinish} />;
  if (screen.step === "targets") return <TargetsStep screen={screen} answers={answers} onExit={onExit} onFinish={onFinish} />;
  return <ChannelsStep screen={screen} answers={answers} onExit={onExit} onFinish={onFinish} />;
}

function ChannelsStep({
  screen,
  answers,
  onExit,
  onFinish,
}: {
  screen: LaunchpadSalesScreen;
  answers?: LaunchpadAnswers;
  onExit: () => void;
  onFinish: (answer: SalesChannelsAnswer) => void;
}) {
  const s = useSurfaceCopy();
  const saved = salesChannelsOf(answers, screen.answerKey);
  const [page, setPage] = useState(0);
  const [where, setWhere] = useState<Record<string, string[]>>(
    Object.fromEntries(Object.entries(saved?.where ?? {}).map(([key, ids]) => [key, [...ids]])),
  );
  const [extra, setExtra] = useState<Record<string, string>>({ ...(saved?.whereExtra ?? {}) });
  const groups = screen.whereGroups ?? [];
  const known = useMemo(() => new Set((screen.channels ?? []).map((channel) => channel.id)), [screen.channels]);
  const playback = useMemo(() => {
    const kept = (saved?.selected ?? []).filter((id) => known.has(id));
    if (kept.length) return kept;
    const earlier = (findCustomersOf(answers, FIND_CUSTOMERS_KEY)?.channels ?? []).filter((id) => known.has(id));
    if (earlier.length) return earlier;
    return [...known];
  }, [answers, known, saved?.selected]);
  const wherePages = useMemo(
    () => (screen.wherePages ?? []).map((ids) => ids.filter((id) => playback.includes(id))).filter((ids) => ids.length > 0),
    [playback, screen.wherePages],
  );
  const total = 1 + wherePages.length;
  const current = page === 0 ? [] : (wherePages[page - 1] ?? []);
  const ready = page === 0
    ? playback.length > 0
    : current.every((id) => (where[id] ?? []).length > 0 || extra[id]?.trim());
  const finish = () => {
    if (!ready) return;
    if (page < total - 1) {
      setPage(page + 1);
      return;
    }
    const keptWhere = Object.fromEntries(Object.entries(where).filter(([id]) => playback.includes(id)));
    const keptExtra = Object.fromEntries(Object.entries(extra).filter(([id]) => playback.includes(id) && extra[id]?.trim()));
    onFinish({ kind: "sales-channels", version: 1, selected: playback, where: keptWhere, ...(Object.keys(keptExtra).length ? { whereExtra: keptExtra } : {}) });
  };
  return (
    <LessonSurface
      title={screen.title}
      onBack={() => (page === 0 ? onExit() : setPage(page - 1))}
      progress={{ index: page + 1, total }}
      footer={<LessonContinue disabled={!ready} onClick={finish} />}
      decoration={page > 0 && page === total - 1 ? <AnchorDoodle name="heart" size={80} /> : undefined}
    >
      <div data-task-screen="sales-channels">
        {page === 0 ? (
          <div data-channel-playback="">
            <img src={SCRIBBLE_SRC.heart} alt="" data-channel-art="heart" className="mx-auto block h-[92px] w-auto" />
            {screen.question ? <ScreenPrompt tone="question" flush className="!mt-5">{screen.question}</ScreenPrompt> : null}
            {screen.context ? <p className={`mt-3 ${LESSON_BODY}`}>{screen.context}</p> : null}
            {screen.hint ? <ScreenGuidance flush>{screen.hint}</ScreenGuidance> : null}
            <ul className="m-0 mt-4 list-none p-0">
              {playback.map((id) => {
                const channel = (screen.channels ?? []).find((row) => row.id === id);
                if (!channel) return null;
                return (
                  <li key={id} className={`relative py-0.5 pl-4 before:absolute before:left-[3px] before:top-2 before:size-1.5 before:rounded-full before:bg-[#0CC1E0] before:content-[''] ${LESSON_BODY}`}>
                    {channel.label}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <>
            {page === 1 && screen.wherePrompt ? <ScreenPrompt tone="section" flush>{screen.wherePrompt}</ScreenPrompt> : null}
            {current.map((id, index) => {
              const group = groups.find((item) => item.channelId === id);
              if (!group) return null;
              const picked = where[id] ?? [];
              return (
                <div key={id} className={index === 0 ? "mt-5" : "mt-7"} data-channel-group={id}>
                  <ScreenPrompt tone="question" flush>{group.heading}</ScreenPrompt>
                  <p className={`mt-1 ${LESSON_BODY}`}>{group.label}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {group.options.map((option) => (
                      <Chip key={option.id} label={option.label} selected={picked.includes(option.id)} onClick={() => setWhere({ ...where, [id]: toggle(picked, option.id) })} />
                    ))}
                    {group.allowOwn ? (
                      <Chip dashed label={OWN_LABEL} selected={picked.includes("own")} onClick={() => setWhere({ ...where, [id]: toggle(picked, "own") })} />
                    ) : null}
                  </div>
                  {picked.includes("own") ? (
                    <input
                      aria-label={`${group.heading} ${s.sales.ownPlace}`}
                      value={extra[id] ?? ""}
                      onChange={(event) => setExtra({ ...extra, [id]: event.target.value.slice(0, 80) })}
                      className="mt-2 h-11 w-full rounded-xl px-3 font-sans text-[18px] leading-[26px] text-[#19347D] shadow-[inset_0_0_0_1.5px_#0CC1E0] outline-none"
                    />
                  ) : null}
                </div>
              );
            })}
            {page === total - 1 && screen.permission ? <p className={`mt-4 ${LESSON_HINT}`}>{screen.permission}</p> : null}
          </>
        )}
      </div>
    </LessonSurface>
  );
}

function MaterialsStep({
  screen,
  answers,
  floors,
  onExit,
  onFinish,
}: {
  screen: LaunchpadSalesScreen;
  answers?: LaunchpadAnswers;
  floors: readonly LaunchpadFloor[];
  onExit: () => void;
  onFinish: (answer: MarketingMaterialsAnswer) => void;
}) {
  const s = useSurfaceCopy();
  const saved = marketingOf(answers, screen.answerKey);
  const sales = salesChannelsOf(answers, SALES_CHANNELS_KEY);
  const services = chosenServices(floors, answers, "l1-offer");
  const [page, setPage] = useState(0);
  const [mainService, setMain] = useState(saved?.mainService ?? services[0]?.id ?? "");
  const [secondService, setSecond] = useState(saved?.secondService ?? services.find((row) => row.id !== (saved?.mainService ?? services[0]?.id))?.id ?? "");
  const [hook, setHook] = useState(saved?.hook ?? "");
  const [proof, setProof] = useState(saved?.proof ?? "");
  const [pieces, setPieces] = useState<Record<string, string>>({ ...(saved?.pieces ?? {}) });
  const pairs = screen.proofFlyerPairs ?? [];
  const chooseProof = (id: string) => {
    setProof(id);
    const blocked = new Set(pairedIds(pairs, "proof", id));
    setPieces((current) => {
      const extra = current["flyer-extra"];
      if (extra && blocked.has(extra)) return { ...current, "flyer-extra": "" };
      return current;
    });
  };
  const choosePiece = (fieldId: string, id: string) => {
    setPieces((current) => ({ ...current, [fieldId]: id }));
    if (fieldId === "flyer-extra" && pairedIds(pairs, "flyer-extra", id).includes(proof)) setProof("");
  };
  const selected = new Set(sales?.selected ?? []);
  const friends = sales?.where.friends ?? [];
  const catalog: { id: MarketingPieceId; ids: readonly string[] }[] = [
    { id: "flyer", ids: ["flyer-book", "flyer-extra"] },
    { id: "verbal", ids: ["verbal-close"] },
    { id: "message", ids: ["message-close"] },
    { id: "online", ids: ["online-close"] },
    { id: "card", ids: [] },
  ];
  const sequence = catalog.filter((piece) => {
    if (piece.id === "flyer") return selected.has("flyers");
    if (piece.id === "verbal") return selected.has("friends") && friends.includes("see");
    if (piece.id === "message") return selected.has("friends") && friends.includes("message");
    if (piece.id === "online") return selected.has("online");
    return selected.has("cards");
  });
  const steps = sequence.length
    ? sequence.flatMap((piece) => [
        { kind: "ask" as const, piece },
        { kind: "show" as const, piece },
      ])
    : [{ kind: "ask" as const, piece: null }];
  const total = steps.length;
  const step = steps[Math.min(page, total - 1)] ?? steps[0]!;
  const stepFields = (step.piece?.ids ?? []).flatMap((id) => {
    const field = (screen.pieceFields ?? []).find((item) => item.id === id);
    return field ? [field] : [];
  });
  const required = stepFields.filter((field) => !field.optional);
  const ready = step.kind === "show" || (Boolean(mainService && hook && proof) && required.every((field) => pieces[field.id]));
  const answer: MarketingMaterialsAnswer = {
    kind: "marketing-materials",
    version: 1,
    mainService,
    ...(secondService ? { secondService } : {}),
    hook,
    proof,
    pieces,
  };
  const finish = () => {
    if (!ready) return;
    if (page < total - 1) {
      setPage(page + 1);
      return;
    }
    onFinish(answer);
  };
  const businessName = identityAnswerOf(answers, IDENTITY_ANSWER_KEY)?.name || s.workbook.fallbackName;
  const preview = step.kind === "show" && step.piece ? marketingLines({ ...answers, [screen.answerKey]: answer }, step.piece.id, businessName).lines : [];
  const select = (label: string, value: string, options: readonly { id: string; label: string }[], onChange: (id: string) => void, blocked: ReadonlySet<string> = new Set()) => {
    const field: LaunchpadTextField = {
      name: label.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "") || "pick",
      input: "choice",
      label,
      options: options.map((option) => ({ id: option.id, label: option.label, disabled: blocked.has(option.id) })),
    };
    return (
      <div className="mt-4">
        <ScreenPrompt tone="sub" flush>{label}</ScreenPrompt>
        <FieldControl field={field} value={value} onChange={(next) => onChange(String(next))} appearance="underline" idPrefix="sales" />
      </div>
    );
  };
  return (
    <LessonSurface
      title={screen.title}
      onBack={() => (page === 0 ? onExit() : setPage(page - 1))}
      progress={{ index: page + 1, total }}
      footer={<LessonContinue disabled={!ready} onClick={finish} />}
    >
      <div data-task-screen="sales-materials" data-material-step={step.kind} data-material-piece={step.piece?.id ?? ""}>
        {step.kind === "ask" ? (
          <>
            {page === 0 && screen.question ? <ScreenPrompt tone="question" flush>{screen.question}</ScreenPrompt> : null}
            {page === 0 && screen.context ? <p className={`mt-3 ${LESSON_BODY}`}>{screen.context}</p> : null}
            {page === 0 && screen.hint ? <ScreenGuidance flush>{screen.hint}</ScreenGuidance> : null}
            {select(screen.serviceLabels?.main ?? s.sales.mainService, mainService, services.map((row) => ({ id: row.id, label: row.label })), setMain)}
            {select(screen.serviceLabels?.second ?? s.sales.secondService, secondService, services.filter((row) => row.id !== mainService).map((row) => ({ id: row.id, label: row.label })), setSecond)}
            {select(s.sales.hook, hook, screen.hooks ?? [], setHook)}
            {select(s.sales.proof, proof, screen.proofs ?? [], chooseProof, new Set(pairedIds(pairs, "flyer-extra", pieces["flyer-extra"] ?? "")))}
            {stepFields.map((field) => (
              <div key={field.id}>
                {select(
                  field.label,
                  pieces[field.id] ?? "",
                  field.options,
                  (id) => choosePiece(field.id, id),
                  field.id === "flyer-extra" ? new Set(pairedIds(pairs, "proof", proof)) : new Set(),
                )}
              </div>
            ))}
          </>
        ) : (
          <>
            {step.piece ? <ScreenPrompt tone="question" flush>{marketingPieceHeading(step.piece.id, s.sales.pieceHeadings)}</ScreenPrompt> : null}
            {preview.map((line, index) => (
              <p key={`${index}-${line}`} className={`mt-3 ${LESSON_BODY}`}>{line}</p>
            ))}
          </>
        )}
      </div>
    </LessonSurface>
  );
}

function TargetsStep({
  screen,
  answers,
  onExit,
  onFinish,
}: {
  screen: LaunchpadSalesScreen;
  answers?: LaunchpadAnswers;
  onExit: () => void;
  onFinish: (answer: TellPeopleAnswer) => void;
}) {
  const s = useSurfaceCopy();
  const sales = salesChannelsOf(answers, SALES_CHANNELS_KEY);
  const selected = new Set(sales?.selected ?? []);
  const friends = sales?.where.friends ?? [];
  const lines = [
    selected.has("flyers") ? { id: "flyers", before: s.sales.printAndDistribute, after: s.sales.flyers, choice: false } : null,
    selected.has("friends") && friends.includes("see") ? { id: "see", before: s.sales.tellPeople, after: s.sales.inPerson, choice: false } : null,
    selected.has("friends") && friends.includes("message") ? { id: "message", before: s.sales.sendMessage, after: s.sales.people, choice: false } : null,
    selected.has("online") ? { id: "share", before: s.sales.sharePost, after: "", choice: true } : null,
    selected.has("online") ? { id: "ask", before: s.sales.askFriends, after: s.sales.friendsShare, choice: false } : null,
  ].flatMap((row) => (row ? [row] : []));
  const cards = selected.has("cards");
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [shareWhen, setShareWhen] = useState("");
  const ids = [...lines.filter((line) => !line.choice).map((line) => line.id), ...(cards ? ["cards", "stores"] : [])];
  const ready = ids.every((id) => Number(counts[id]) > 0) && (!selected.has("online") || Boolean(shareWhen));
  const field = (id: string) => (
    <input
      aria-label={id}
      inputMode="numeric"
      value={counts[id] ?? ""}
      onChange={(event) => setCounts({ ...counts, [id]: event.target.value.replace(/\D/g, "").slice(0, 3) })}
      className="mx-1 inline-flex h-9 w-12 rounded-lg border border-[#D5DAE3] text-center font-sans text-[18px] font-semibold leading-[26px] text-[#19347D] outline-none"
    />
  );
  return (
    <LessonSurface title={screen.title} onBack={onExit} footer={<LessonContinue disabled={!ready} onClick={() => ready && onFinish({ kind: "tell-people", version: 1, counts: Object.fromEntries(ids.map((id) => [id, Number(counts[id])])), ...(shareWhen ? { shareWhen } : {}) })} />}>
      <div data-task-screen="sales-targets">
        {screen.question ? <ScreenPrompt tone="question" flush>{screen.question}</ScreenPrompt> : null}
        {screen.hint ? <ScreenGuidance flush>{screen.hint}</ScreenGuidance> : null}
        <div className="mt-4 flex flex-col gap-3">
          {lines.map((line) => (
            <p key={line.id} className={LESSON_BODY}>
              {line.before}{" "}
              {line.choice ? (
                <select aria-label={line.before.trim()} value={shareWhen} onChange={(event) => setShareWhen(event.target.value)} className="mx-1 h-9 rounded-lg border border-[#D5DAE3] bg-white px-2 font-sans text-[18px] font-semibold text-[#19347D]">
                  <option value="" />
                  {s.sales.shareTimes.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              ) : field(line.id)}{" "}
              {line.after}
            </p>
          ))}
          {cards ? (
            <p className={LESSON_BODY}>{s.sales.iWillPrint} {field("cards")} {s.sales.businessCards} {field("stores")} {s.sales.storesLeave}</p>
          ) : null}
        </div>
        {screen.permission ? <p className={`mt-4 ${LESSON_HINT}`}>{screen.permission}</p> : null}
      </div>
    </LessonSurface>
  );
}
