"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { useMemo, useState } from "react";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import type { LaunchpadFloor, LaunchpadSalesScreen } from "@/lib/launchpad/content/types";
import { chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";
import { marketingOf, salesChannelsOf, type MarketingMaterialsAnswer, type SalesChannelsAnswer, type TellPeopleAnswer } from "@/lib/launchpad/content/answers";
import { OWN_LABEL, SALES_CHANNELS_KEY } from "@/lib/launchpad/content/sales/copy";
import type { LaunchpadTextField } from "@/lib/launchpad/content/types";
import { Chip } from "@/components/launchpad/venture/screens/lesson-controls";
import { FieldControl } from "@/components/launchpad/venture/screens/field-control";
import { LessonContinue, LessonSurface, ScreenGuidance, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";
import { LESSON_BODY, LESSON_HINT } from "@/components/launchpad/venture/screens/screen-ui";

type ReadyAnswer = SalesChannelsAnswer | MarketingMaterialsAnswer | TellPeopleAnswer;

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
  const [selected, setSelected] = useState<string[]>(saved ? [...saved.selected] : []);
  const [where, setWhere] = useState<Record<string, string[]>>(
    Object.fromEntries(Object.entries(saved?.where ?? {}).map(([key, ids]) => [key, [...ids]])),
  );
  const [extra, setExtra] = useState<Record<string, string>>({ ...(saved?.whereExtra ?? {}) });
  const groups = screen.whereGroups ?? [];
  const pages = useMemo(() => [[] as string[], ...(screen.wherePages ?? []).map((ids) => [...ids])], [screen.wherePages]);
  const total = pages.length;
  const current = (pages[Math.min(page, total - 1)] ?? []).filter((id) => selected.includes(id));
  const ready = page === 0
    ? selected.some((id) => id !== "tbc")
    : current.every((id) => (where[id] ?? []).length > 0 || extra[id]?.trim());
  const finish = () => {
    if (!ready) return;
    if (page < total - 1) {
      setPage(page + 1);
      return;
    }
    onFinish({ kind: "sales-channels", version: 1, selected, where, ...(Object.keys(extra).length ? { whereExtra: extra } : {}) });
  };
  return (
    <LessonSurface
      title={screen.title}
      onBack={() => (page === 0 ? onExit() : setPage(page - 1))}
      progress={{ index: page + 1, total }}
      footer={<LessonContinue disabled={!ready} onClick={finish} />}
    >
      <div data-task-screen="sales-channels">
        {page === 0 ? (
          <>
            {screen.question ? <ScreenPrompt tone="question" flush>{screen.question}</ScreenPrompt> : null}
            {screen.context ? <p className={`mt-3 ${LESSON_BODY}`}>{screen.context}</p> : null}
            {screen.hint ? <ScreenGuidance flush>{screen.hint}</ScreenGuidance> : null}
            <div className="mt-4">
              {(screen.channels ?? []).map((channel) => (
                <Chip key={channel.id} variant="lined" label={channel.label} selected={selected.includes(channel.id)} onClick={() => setSelected(toggle(selected, channel.id))} />
              ))}
            </div>
          </>
        ) : (
          <>
            {page === 1 && screen.wherePrompt ? <ScreenPrompt tone="section" flush>{screen.wherePrompt}</ScreenPrompt> : null}
            {current.map((id) => {
              const group = groups.find((item) => item.channelId === id);
              if (!group) return null;
              const picked = where[id] ?? [];
              return (
                <div key={id} className="mt-4">
                  <ScreenPrompt tone="section" flush>{group.heading}</ScreenPrompt>
                  <ScreenPrompt tone="sub" flush>{group.label}</ScreenPrompt>
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
  const selected = new Set(sales?.selected ?? []);
  const friends = sales?.where.friends ?? [];
  const fields = (screen.pieceFields ?? []).filter((field) => {
    if (field.channelId === "flyers") return selected.has("flyers") || selected.has("noticeboard");
    if (field.channelId === "verbal") return selected.has("friends") && friends.includes("see");
    if (field.channelId === "message") return selected.has("friends") && friends.includes("message");
    if (field.channelId === "online") return selected.has("online");
    return false;
  });
  const total = 2;
  const required = fields.filter((field) => !field.optional);
  const ready = page === 0 ? Boolean(mainService && hook && proof) : required.every((field) => pieces[field.id]);
  const finish = () => {
    if (!ready) return;
    const answer: MarketingMaterialsAnswer = {
      kind: "marketing-materials",
      version: 1,
      mainService,
      ...(secondService ? { secondService } : {}),
      hook,
      proof,
      pieces,
    };
    if (page === 0 && total > 1) {
      setPage(1);
      return;
    }
    onFinish(answer);
  };
  const select = (label: string, value: string, options: readonly { id: string; label: string }[], onChange: (id: string) => void) => {
    const field: LaunchpadTextField = {
      name: label.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "") || "pick",
      input: "choice",
      label,
      options: options.map((option) => ({ id: option.id, label: option.label })),
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
      onBack={() => (page === 0 ? onExit() : setPage(0))}
      progress={{ index: page + 1, total }}
      footer={<LessonContinue disabled={!ready} onClick={finish} />}
    >
      <div data-task-screen="sales-materials">
        {page === 0 ? (
          <>
            {screen.question ? <ScreenPrompt tone="question" flush>{screen.question}</ScreenPrompt> : null}
            {screen.context ? <p className={`mt-3 ${LESSON_BODY}`}>{screen.context}</p> : null}
            {screen.hint ? <ScreenGuidance flush>{screen.hint}</ScreenGuidance> : null}
            {select(screen.serviceLabels?.main ?? s.sales.mainService, mainService, services.map((row) => ({ id: row.id, label: row.label })), setMain)}
            {select(screen.serviceLabels?.second ?? s.sales.secondService, secondService, services.filter((row) => row.id !== mainService).map((row) => ({ id: row.id, label: row.label })), setSecond)}
            {select(s.sales.hook, hook, screen.hooks ?? [], setHook)}
            {select(s.sales.proof, proof, screen.proofs ?? [], setProof)}
          </>
        ) : (
          fields.map((field) => (
            <div key={field.id}>
              {select(field.label, pieces[field.id] ?? "", field.options, (id) => setPieces({ ...pieces, [field.id]: id }))}
            </div>
          ))
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
    selected.has("flyers") ? { id: "flyers", before: s.sales.printAndDistribute, after: s.sales.flyers } : null,
    selected.has("friends") && friends.includes("see") ? { id: "see", before: s.sales.tellPeople, after: s.sales.inPerson } : null,
    selected.has("friends") && friends.includes("message") ? { id: "message", before: s.sales.sendMessage, after: s.sales.people } : null,
    selected.has("online") ? { id: "days", before: s.sales.sharePost, after: s.sales.daysInAdvance } : null,
    selected.has("online") ? { id: "ask", before: s.sales.askFriends, after: s.sales.friendsShare } : null,
    selected.has("noticeboard") ? { id: "board", before: s.sales.putUp, after: s.sales.posters } : null,
  ].flatMap((row) => (row ? [row] : []));
  const cards = selected.has("cards");
  const [counts, setCounts] = useState<Record<string, string>>({});
  const ids = [...lines.map((line) => line.id), ...(cards ? ["cards", "stores"] : [])];
  const ready = ids.every((id) => Number(counts[id]) > 0);
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
    <LessonSurface title={screen.title} onBack={onExit} footer={<LessonContinue disabled={!ready} onClick={() => ready && onFinish({ kind: "tell-people", version: 1, counts: Object.fromEntries(ids.map((id) => [id, Number(counts[id])])) })} />}>
      <div data-task-screen="sales-targets">
        {screen.question ? <ScreenPrompt tone="question" flush>{screen.question}</ScreenPrompt> : null}
        {screen.hint ? <ScreenGuidance flush>{screen.hint}</ScreenGuidance> : null}
        <div className="mt-4 flex flex-col gap-3">
          {lines.map((line) => (
            <p key={line.id} className={LESSON_BODY}>{line.before} {field(line.id)} {line.after}</p>
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
