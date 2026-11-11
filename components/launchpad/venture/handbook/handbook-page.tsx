"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { useRef, useState, type ReactNode } from "react";
import {
  partLabel,
  silverHandbookSections,
  type HandbookPageView,
} from "@/lib/launchpad/venture-test/handbook";
import { IDENTITY_ANSWER_KEY } from "@/lib/launchpad/content/seed/identity-silver";
import type { LaunchpadSummarySection } from "@/lib/launchpad/content/types";
import { sectionLines, summaryCatalog } from "@/lib/launchpad/content/summary";
import {
  useIdentityAnswer,
  useLaunchpadAnswers,
} from "@/components/launchpad/venture/identity/answers-context";
import { ChosenValue } from "@/components/launchpad/venture/handbook/chosen-value";
import { SummaryLines } from "@/components/launchpad/venture/summary-lines";
import { AccentLabel, HandRule, PAPER_ACCENT, WORKBOOK_BODY, WORKBOOK_HINT, WORKBOOK_SUB } from "@/components/launchpad/venture/handbook/paper-art";
import { LargeScribble, SCRIBBLE_SRC, type ScribbleName } from "@/components/launchpad/venture/handbook/scribble-mark";
import { orderSystemOf } from "@/lib/launchpad/content/answers";
import { DeliveryWorkbook } from "@/components/launchpad/venture/handbook/delivery-workbook";
import type { OrderSystemCopy } from "@/lib/launchpad/content/types";
import { GrowthPlanSheet, WeeklyFocusSheet, WhatWentWellSheet } from "@/components/launchpad/venture/handbook/weekly-focus-sheet";
import { VisionBlock } from "@/components/launchpad/venture/handbook/vision-block";
import { LogoMark, logoMarkLabel } from "@/components/launchpad/venture/identity/business-logo";
import { FREDOKA_CLASS, FREDOKA_HEADING_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";
import { costsOf, fieldsOf, practiceRunOf } from "@/lib/launchpad/content/answers";
import type { WorkbookTemplateField, WorkbookTemplatePage } from "@/lib/launchpad/content/surface-copy";
import { chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";
import { joinPhrase } from "@/lib/launchpad/content/planning/catalog";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { CostWorkbookBody } from "@/components/launchpad/venture/screens/cost-workbook";
import { FundingSheet, PricingPlaybackPage, SellingCustomersPage, TypicalWeekPage } from "@/components/launchpad/venture/handbook/planning-sheets";
import { gettingReadyWorkbookSheets } from "@/lib/launchpad/content/getting-ready/workbook-sheets";
import { salesWorkbookSheets } from "@/lib/launchpad/content/sales/workbook-sheets";
import { identityAnswerOf } from "@/lib/launchpad/content/answers";
import { ScriptedSheetPage } from "@/components/launchpad/venture/handbook/scripted-sheet";
import { budgetSplitSheet } from "@/lib/launchpad/content/budgeting/workbook";
import { LevelTemplateSections } from "@/components/launchpad/venture/handbook/level-template";
import { BlankSlot, useTemplateBlanks } from "@/components/launchpad/venture/handbook/template-blanks";

/*
 * Handbook page art from handbook-vision-products-r4 (4 Nov): one warm paper
 * card, hand-drawn dividers, accent labels with an underline swash, product
 * tag chips and one doodle. The accent is the logo palette's light blue.
 */
const ACCENT = PAPER_ACCENT;

/** The page's one doodle: an outline paw (dog walking) or bead loop (bracelets). */
export function Doodle({ ventureId }: { ventureId: string }) {
  if (ventureId === "friendship-bracelets")
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 100 100"
        fill="none"
        stroke={ACCENT}
        strokeWidth="7"
        aria-hidden="true"
        className="mb-1.5 rotate-[14deg]"
        data-doodle="bead"
      >
        <path d="M18 60C18 34 34 18 50 18S82 34 82 60" strokeLinecap="round" />
        <circle cx="18" cy="70" r="9" />
        <circle cx="50" cy="80" r="9" />
        <circle cx="82" cy="70" r="9" />
      </svg>
    );
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 100 100"
      fill="none"
      stroke={ACCENT}
      strokeWidth="7"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mb-1.5 rotate-[14deg]"
      data-doodle="paw"
    >
      <circle cx="27" cy="42" r="9" />
      <circle cx="41" cy="25" r="9.5" />
      <circle cx="60" cy="25" r="9.5" />
      <circle cx="74" cy="42" r="9" />
      <path d="M50 50C62 50 76 62 76 73C76 82 67 85 59 83C55 82 45 82 41 83C33 85 24 82 24 73C24 62 38 50 50 50Z" />
    </svg>
  );
}

/** Section lines from the saved answers (the same lines the wrap-up shows). */
export function useSectionLines(sections: readonly LaunchpadSummarySection[]) {
  const ctx = useLaunchpadAnswers();
  const catalog = summaryCatalog(ctx?.floors ?? []);
  return sections.map((section) => ({
    section,
    lines: sectionLines(section, ctx?.answers, catalog),
  }));
}

function joinSentence(lines: readonly string[]): string {
  if (lines.length === 0) return "";
  if (lines.length === 1) return lines[0]!;
  if (lines.length === 2) return `${lines[0]} and ${lines[1]}`;
  return `${lines.slice(0, -1).join(", ")}, and ${lines[lines.length - 1]}`;
}

/**
 * One handbook section. A list answer is one sentence on the page.
 */
export function HandbookSection({
  section,
  lines,
  doodle,
}: {
  section: LaunchpadSummarySection;
  lines: readonly string[];
  doodle?: ReactNode;
}) {
  return (
    <div data-handbook-section={section.id}>
      <HandRule />
      <AccentLabel doodle={doodle}>{section.label}</AccentLabel>
      {section.display === "list" ? (
        <p className={`mt-3 ${WORKBOOK_BODY}`} aria-label={section.label}>
          <ChosenValue>{joinSentence(lines)}</ChosenValue>
        </p>
      ) : section.display === "text" && lines.length === 1 ? (
        <p className={`mt-3 ${WORKBOOK_BODY}`}>
          <ChosenValue>{lines[0]}</ChosenValue>
        </p>
      ) : (
        <SummaryLines
          display={section.display}
          lines={lines}
          className={`mt-3 ${WORKBOOK_BODY}`}
        />
      )}
    </div>
  );
}

/** Small orange rocket doodle for the empty logo slot. */
function RocketDoodle() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#FFA503"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-doodle="rocket"
    >
      <path d="M12 3c3 2 4.5 5.5 4.5 9.5L14 16h-4l-2.5-3.5C7.5 8.5 9 5 12 3z" />
      <circle cx="12" cy="9.5" r="1.6" />
      <path d="M7.5 12.5L5 15l2.5 1M16.5 12.5L19 15l-2.5 1M10.5 18.5L12 21l1.5-2.5" />
    </svg>
  );
}

/**
 * Workbook page 1, the cover (workbook-page1-cover-spec-r1; Cath, 5 Nov
 * 5:35pm): the logo at 80px centered at the top, a smaller business name, then
 * Our vision. The identity silver has no separate page, so this is the only
 * place the vision shows; from the building the logo and name are edited here.
 * Page 1 is the cover and Our vision. The offer lives on the next page.
 */
const COVER_LOGO_PX = 48;

function CoverPageBody({
  page,
}: {
  page: HandbookPageView;
}) {
  const s = useSurfaceCopy();
  const wrapUp =
    page.silver.wrapUp?.type === "identity-wrap-up" ? page.silver.wrapUp : null;
  const answerKey = wrapUp?.answerKey ?? "";
  const { answer } = useIdentityAnswer(answerKey);
  const hasLogo = !!(answer.shape && answer.color && answer.icon);

  return (
    <div className="relative flex flex-col items-center" data-cover="" data-cover-dense="">
      <div className="flex items-center justify-center gap-3">
      {hasLogo ? (
        <div className="relative">
          <div data-cover-logo="filled">
          <LogoMark
            shape={answer.shape}
            color={answer.color}
            icon={answer.icon}
            size={COVER_LOGO_PX}
            label={logoMarkLabel(answer)}
          />
          </div>
        </div>
      ) : (
        <div
          data-cover-logo="empty"
          className="flex h-12 w-12 flex-col items-center justify-center gap-0.5 rounded-full border-2 border-dashed border-[#D9DEE8] text-center"
        >
          <RocketDoodle />
          <span className="px-1 text-[9.5px] leading-tight text-[#9AA3B5]">
            {s.workbook.logoHere}
          </span>
        </div>
      )}
      {answer.name ? (
        <div data-cover-name="filled">
          <p data-business-name="" className={`${FREDOKA_HEADING_CLASS} text-[21px] font-bold leading-7 text-[#19347D]`} style={{ fontSize: "21px" }}>
            {answer.name}
          </p>
        </div>
      ) : (
        <p
          data-cover-name="empty"
          className="font-heading text-[16px] font-semibold text-[#9AA3B5]"
        >
          {s.workbook.businessName}
        </p>
      )}
      </div>
      <div className="flex w-full flex-col">
        <HandRule className="mb-3.5 mt-5" />
        {wrapUp?.vision && <VisionBlock spec={wrapUp.vision} />}
      </div>
    </div>
  );
}

/**
 * K14: every page after the cover carries a small identity header (logo and
 * name) so the workbook reads as the learner's own. Left off until either is chosen.
 */
/** Workbook page opened from the paperclip tab. Copy comes from the payload. */
export function TemplatesComingSoon() {
  const copy = useSurfaceCopy().templates;
  return (
    <article data-handbook-page="templates" aria-label={copy.title}>
      <MiniIdentity />
      <AccentLabel as="h2">{copy.title}</AccentLabel>
      <p className={`mt-3 ${WORKBOOK_BODY}`}>{copy.comingSoon}</p>
    </article>
  );
}

const TEMPLATE_HINT = "font-sans text-[16px] font-normal leading-[26px] text-[#4A5568]";
const TEMPLATE_LINE = "border-b-[1.5px] border-[#8390AF] bg-transparent font-sans text-[16px] leading-[26px] text-[#19347D] outline-none";

function templateScribble(name?: string): ScribbleName | undefined {
  if (name === "beagle" || name === "wallet" || name === "calendar" || name === "growth" || name === "star" || name === "sparkle") return name;
  return undefined;
}

function TemplateWriteIn({
  field,
  value,
  compact,
}: {
  field: WorkbookTemplateField;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className={field.wide ? (compact ? "mb-1.5 block" : "mb-2.5 block") : compact ? "mb-1.5 flex items-end gap-2" : "mb-2.5 flex items-end gap-2"}>
      <span className={field.wide ? `block ${WORKBOOK_SUB}` : `shrink-0 ${WORKBOOK_SUB}`}>{field.label}</span>
      <span data-template-line="" className={field.wide ? `mt-0.5 block min-h-[26px] w-full ${TEMPLATE_LINE}` : `min-h-[26px] min-w-9 flex-1 ${TEMPLATE_LINE}`}>
        {value.trim() ? <ChosenValue>{value}</ChosenValue> : "\u00a0"}
      </span>
    </div>
  );
}

/** Draft poster on the Templates tab. The blank PDF opens in this page, not a new tab. */
export function PosterTemplatePage({
  poster,
}: {
  poster: {
    heading: string;
    blankLink: string;
    openA4: string;
    downloadA4: string;
    openLetter: string;
    downloadLetter: string;
    viewerClose: string;
    viewerPrint: string;
    draftSrc: string;
    a4Url: string;
    letterUrl: string;
    a4Download: string;
    letterDownload: string;
  };
}) {
  const [file, setFile] = useState<"a4" | "letter" | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const src = file === "letter" ? poster.letterUrl : poster.a4Url;
  const link = "inline-flex items-start gap-1.5 font-sans text-[16px] font-semibold leading-6 text-[#0CC1E0] underline decoration-[#0CC1E0] underline-offset-[3px]";
  return (
    <article data-handbook-page="templates" data-workbook-templates="" data-template-page="poster" aria-label={poster.heading}>
      <MiniIdentity />
      <AccentLabel as="h2">{poster.heading}</AccentLabel>
      <img src={poster.draftSrc} alt="" width={290} data-draft-poster="" className="mx-auto mt-1.5 block h-auto w-[290px] border border-[#19347D] bg-white" />
      <button type="button" className={`mt-3 text-left ${link}`} data-poster-open="" onClick={() => setFile("a4")}>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-1 shrink-0">
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M14 3v5h5" />
        </svg>
        {poster.blankLink}
      </button>
      {file && (
        <div className="fixed inset-0 z-modal flex flex-col bg-white" data-poster-viewer="" role="dialog" aria-label={poster.heading}>
          <div className="flex h-14 flex-none items-center justify-between gap-2 px-3">
            <button type="button" className="h-10 rounded-full px-3 font-sans text-[16px] font-semibold text-[#19347D]" onClick={() => setFile(null)}>{poster.viewerClose}</button>
            <div className="flex gap-2">
              <button type="button" className="h-10 rounded-full px-3 font-sans text-[16px] font-semibold text-[#19347D]" onClick={() => setFile("a4")}>{poster.openA4}</button>
              <button type="button" className="h-10 rounded-full px-3 font-sans text-[16px] font-semibold text-[#19347D]" onClick={() => setFile("letter")}>{poster.openLetter}</button>
            </div>
            <button type="button" className="h-10 rounded-full bg-[#19347D] px-4 font-sans text-[16px] font-semibold text-white" onClick={() => frame.current?.contentWindow?.print()}>{poster.viewerPrint}</button>
          </div>
          <iframe ref={frame} title={poster.heading} src={src} className="min-h-0 w-full flex-1 border-0" data-poster-frame="" />
        </div>
      )}
    </article>
  );
}

/** One paperclip page. Strings, fields, and ticks come from the payload. */
export function WorkbookTemplatePage({ page }: { page: WorkbookTemplatePage }) {
  const templates = useSurfaceCopy().templates;
  const ctx = useLaunchpadAnswers();
  const saved = fieldsOf(ctx?.answers, templates.answerKey)?.values ?? {};
  const text = (id: string) => {
    const value = saved[id];
    return typeof value === "string" ? value : value == null ? "" : String(value);
  };
  const scribble = templateScribble(page.scribble);
  const compact = Boolean(page.ticks?.length);
  const art = scribble ? (
    <img src={SCRIBBLE_SRC[scribble]} alt="" width={80} height={80} draggable={false} data-scribble-large={scribble} className="h-auto w-20 mix-blend-multiply" />
  ) : null;
  return (
    <article data-handbook-page="templates" data-workbook-templates="" data-template-page={page.id} aria-label={page.title}>
      <MiniIdentity />
      <div className="relative">
        <AccentLabel as="h2">{page.title}</AccentLabel>
        <img src={SCRIBBLE_SRC.sparkle} alt="" width={18} height={18} draggable={false} className="pointer-events-none absolute right-1 top-0 size-[18px] rotate-[10deg] mix-blend-multiply" />
      </div>
      {page.lead ? <p className={`mt-2 ${TEMPLATE_HINT}`}>{page.lead}</p> : null}
      {page.subhead ? <h3 className={`mt-1 ${WORKBOOK_SUB}`}>{page.subhead}</h3> : null}
      {page.intro ? <p className={TEMPLATE_HINT}>{page.intro}</p> : null}
      {page.tip ? <p className={`mt-2 ${TEMPLATE_HINT}`}>{page.tip}</p> : null}
      {page.jobTitle ? <h3 className={`${FREDOKA_HEADING_CLASS} mt-3 text-[18px] font-bold leading-6 text-[#0CC1E0]`}>{page.jobTitle}</h3> : null}
      <div className="mt-2">
        {(page.fields ?? []).map((field) => (
          <TemplateWriteIn key={field.id} field={field} value={text(field.id)} compact={compact} />
        ))}
      </div>
      {page.wrapTitle && page.wrapFields ? (
        <div className="mt-3 border-t-[1.5px] border-dashed border-[rgba(27,46,107,0.25)] pt-3">
          <h3 className={`${FREDOKA_HEADING_CLASS} text-[18px] font-bold leading-6 text-[#0CC1E0]`}>{page.wrapTitle}</h3>
          <div className="mt-2">
            {page.wrapFields.map((field) => (
              <TemplateWriteIn key={field.id} field={field} value={text(field.id)} compact={compact} />
            ))}
          </div>
        </div>
      ) : null}
      {page.ticks?.length ? (
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5" data-template-ticks="">
            {page.ticks.map((tick) => (
              <div key={tick.id} className="flex items-center gap-2">
                <span data-template-tick={saved[tick.id] === "yes" ? "yes" : "no"} aria-hidden="true" className="inline-flex size-[18px] flex-none items-center justify-center rounded-[3px] border-[1.5px] border-[#8390AF]">
                  {saved[tick.id] === "yes" ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#19347D" strokeWidth="3">
                      <path d="M5 12.5l5 5L19 7" />
                    </svg>
                  ) : null}
                </span>
                <span className={WORKBOOK_SUB}>{tick.label}</span>
              </div>
            ))}
          </div>
          {art}
        </div>
      ) : (
        <div className="relative">
          <img src={SCRIBBLE_SRC.star} alt="" width={18} height={18} draggable={false} className="pointer-events-none absolute bottom-3 left-0 size-[18px] rotate-[8deg] mix-blend-multiply" />
          {art ? <div className="mt-6 flex justify-end pr-2">{art}</div> : null}
        </div>
      )}
    </article>
  );
}

function MiniIdentity() {
  const { answer } = useIdentityAnswer(IDENTITY_ANSWER_KEY);
  const hasLogo = !!(answer.shape && answer.color && answer.icon);
  if (!hasLogo && !answer.name) return null;
  return (
    <div className="mb-2 flex items-center gap-2" data-mini-identity="">
      {hasLogo && (
        <LogoMark
          shape={answer.shape}
          color={answer.color}
          icon={answer.icon}
          size={24}
          label={logoMarkLabel(answer)}
        />
      )}
      {answer.name && (
        <span
          className={`${FREDOKA_CLASS} truncate text-[16px] font-semibold leading-[22px] text-[#3FB7DA]`}
        >
          {answer.name}
        </span>
      )}
    </div>
  );
}

/**
 * An answers page: the silver's title, then its handbook sections (a
 * workbook-summary wrap-up's, or the column Z sections its capture screens
 * name) read from the saved answers. Read-only.
 */
function SummaryPageBody({ page }: { page: HandbookPageView }) {
  const s = useSurfaceCopy();
  const sectionList = silverHandbookSections(page.silver);
  const sections = useSectionLines(sectionList);
  const templates = useTemplateBlanks();
  if (templates) {
    return (
      <>
        <LevelTemplateSections sections={sectionList} />
      </>
    );
  }
  return (
    <>
      {sections.map(({ section, lines }, i) =>
        lines.length ? (
          <div key={section.id} className="relative">
            <HandbookSection
              section={section}
              lines={lines}
            />
          </div>
        ) : (
          <div key={section.id} data-handbook-section={section.id}>
            <HandRule />
            <AccentLabel>{section.label}</AccentLabel>
            <p className={`mt-2 ${WORKBOOK_HINT}`}>
              {s.chrome.notAnswered}
            </p>
          </div>
        ),
      )}
    </>
  );
}

/** Growing workbook page declared on the Level Up payload. */
function LevelUpWorkbookPage({ silver, sheet }: { silver: HandbookPageView["silver"]; sheet: string }) {
  for (const bronze of silver.bronzes)
    for (const task of bronze.tasks)
      for (const screen of task.screens)
        if (screen.type === "level-up") {
          const title = screen.content.workbookPages?.find((item) => item.id === sheet)?.title;
          if (!title) return null;
          if (sheet === "what-went-well") return <WhatWentWellSheet content={screen.content} title={title} />;
          if (sheet === "growth-plan") return <GrowthPlanSheet content={screen.content} title={title} />;
          if (sheet === "weekly-focus") return <WeeklyFocusSheet content={screen.content} title={title} />;
        }
  return null;
}

/** Every other completed silver: its title, then its finished bronzes as tag chips. */
function PlaceholderPageBody({ page }: { page: HandbookPageView }) {
  const s = useSurfaceCopy();
  return (
    <>
      <AccentLabel as="h2">{page.silver.title}</AccentLabel>
      <HandRule />
      <AccentLabel>{s.workbook.whatIDid}</AccentLabel>
      <ul className="mt-3 flex flex-col gap-2" aria-label={s.workbook.whatIDid}>
        {page.bronzeTitles.map((t, i) => (
          <li key={t} className={WORKBOOK_BODY}>{partLabel(t, i)}</li>
        ))}
      </ul>
    </>
  );
}

/**
 * One handbook page (one completed silver), drawn on the r4 paper card.
 * Playback only. `editable` still marks a completed building page, and the
 * cost callback stays on the props so the building can pass it, but the page
 * does not render an editor.
 */
export function HandbookPage({
  page,
  editable,
}: {
  page: HandbookPageView;
  editable: boolean;
  iconVentureId: string;
  /** Kept on the props. The page no longer opens the cost editor. */
  onEditCosts?: (step: { name: "startup" } | { name: "service"; serviceId: string }) => void;
}) {
  const s = useSurfaceCopy();
  return (
    <article
      className="relative"
      data-handbook-page={page.sheet ?? (page.kind === "cover" ? "cover" : page.kind === "costs" ? "my-costs" : page.silver.id)}
      data-editable={editable ? "true" : "false"}
      aria-label={
        page.kind === "cover"
          ? `Page ${page.number}`
          : page.kind === "costs"
            ? `Page ${page.number}: ${s.workbook.myCosts}`
            : `Page ${page.number}: ${page.silver.title}`
      }
    >
      {page.kind !== "cover" && <MiniIdentity />}
      {page.sheet === "pricing" ? (
        <PricingPlaybackPage />
      ) : page.sheet === "week" ? (
        <TypicalWeekPage />
      ) : page.sheet === "funding" ? (
        <FundingSheet />
      ) : page.silver.id === "l2-s1" ? (
        <SellingCustomersPage />
      ) : page.sheet === "ready-a" || page.sheet === "ready-b" || page.sheet === "ready-c" ? (
        <ReadyWrapPage sheet={page.sheet} />
      ) : page.sheet === "order-system" ? (
        <OrderSystemWorkbook silver={page.silver} />
      ) : page.sheet === "ready-before" || page.sheet === "ready-after" || page.sheet === "job-record" ? (
        <DeliveryWorkbook silver={page.silver} sheet={page.sheet} />
      ) : page.sheet?.startsWith("sales-") ? (
        <SalesWorkbookPage sheet={page.sheet} />
      ) : page.sheet === "budget-split" ? (
        <ScriptedSheetPage sheet={budgetSplitSheet()} />
      ) : page.sheet === "what-went-well" || page.sheet === "weekly-focus" || page.sheet === "growth-plan" ? (
        <LevelUpWorkbookPage silver={page.silver} sheet={page.sheet} />
      ) : page.kind === "cover" ? (
        <CoverPageBody page={page} />
      ) : page.kind === "summary" ? (
        <SummaryPageBody page={page} />
      ) : page.kind === "costs" ? (
        <CostsPageBody silver={page.silver} part={page.sheet === "costs-b" ? "rest" : page.sheet === "costs-a" ? "startup" : "all"} />
      ) : (
        <PlaceholderPageBody page={page} />
      )}
    </article>
  );
}

const ORDER_PICK = "font-semibold text-[#0CC1E0]";

function OrderLine({ before, pick, after }: { before: string; pick?: string | null; after?: string }) {
  return (
    <p className={`mb-3 ${WORKBOOK_BODY}`}>
      {before}
      {pick ? <span className={ORDER_PICK}>{pick}</span> : null}
      {after}
    </p>
  );
}

function OrderSystemWorkbook({ silver }: { silver: HandbookPageView["silver"] }) {
  const ctx = useLaunchpadAnswers();
  const screen = silver.bronzes.flatMap((bronze) => bronze.tasks.flatMap((task) => task.screens)).find((item) => item.type === "sales" && item.step === "order");
  const copy: OrderSystemCopy | undefined = screen && screen.type === "sales" ? screen.order : undefined;
  if (!copy) return null;
  const saved = orderSystemOf(ctx?.answers, screen && screen.type === "sales" ? screen.answerKey : "");
  const tracker = copy.trackerOptions.find((option) => option.id === saved?.tracker)?.workbook ?? null;
  const reminder = copy.reminderOptions.find((option) => option.id === saved?.reminder)?.label ?? null;
  return (
    <div data-order-workbook="">
      <AccentLabel as="h2">{copy.workbookTitle}</AccentLabel>
      <OrderLine before={copy.trackerBefore} pick={tracker} after={copy.trackerAfter} />
      <OrderLine before={copy.templateBefore} pick={copy.templateStrong} after={copy.templateAfter} />
      <OrderLine before={copy.repeatLine} />
      <OrderLine before={copy.reminderBefore} pick={reminder} after={copy.reminderAfter} />
      <OrderLine before={copy.checkBefore} pick={copy.checkPick} after={copy.checkAfter} />
      <LargeScribble name="calendar" />
    </div>
  );
}

function SalesWorkbookPage({ sheet }: { sheet: string }) {
  const ctx = useLaunchpadAnswers();
  const name = identityAnswerOf(ctx?.answers, IDENTITY_ANSWER_KEY)?.name || useSurfaceCopy().workbook.fallbackName;
  const page = salesWorkbookSheets(ctx?.answers, name).find((item) => item.id === sheet);
  return page ? <ScriptedSheetPage sheet={page} /> : null;
}

function ReadyWrapPage({ sheet }: { sheet: "ready-a" | "ready-b" | "ready-c" }) {
  const ctx = useLaunchpadAnswers();
  const templates = useTemplateBlanks();
  const copy = useSurfaceCopy();
  const practice = practiceRunOf(ctx?.answers, "practice_run");
  const services = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  const picked = (practice?.services ?? []).map((id) => services.find((row) => row.id === id)?.label ?? id);
  const serviceLabel = joinPhrase(picked.map((label) => label.charAt(0).toLowerCase() + label.slice(1)), copy.list.comma, copy.list.and);
  const page = gettingReadyWorkbookSheets(ctx?.answers, serviceLabel, templates).find((item) => item.id === sheet);
  return page ? <ScriptedSheetPage sheet={page} /> : null;
}

function CostsPageBody({
  silver,
  part = "all",
}: {
  silver: HandbookPageView["silver"];
  part?: "all" | "startup" | "rest";
}) {
  const s = useSurfaceCopy();
  const ctx = useLaunchpadAnswers();
  const templates = useTemplateBlanks();
  const screen = silver.bronzes.flatMap((b) => b.tasks.flatMap((t) => t.screens)).find((s) => s.type === "know-your-cost");
  const answer = screen && screen.type === "know-your-cost" ? costsOf(ctx?.answers, screen.answerKey) : undefined;
  if (!screen || screen.type !== "know-your-cost" || !answer) {
    if (!templates || !screen || screen.type !== "know-your-cost") return null;
    return (
      <>
        <AccentLabel as="h2">{s.workbook.myCosts}</AccentLabel>
        <p className={`mt-3 ${WORKBOOK_BODY}`}>{screen.copy.starterLabel} <BlankSlot /></p>
        <p className={`mt-2 ${WORKBOOK_BODY}`}>{screen.copy.marketingLabel} <BlankSlot /></p>
      </>
    );
  }
  return (
    <>
      <CostWorkbookBody
        answer={answer}
        currency={readCurrencyPreference()}
        marketingLabel={screen.copy.marketingLabel}
        starterLabel={screen.copy.starterLabel}
        hint={screen.copy.workbookHint}
        editable={false}
        part={part}
      />
    </>
  );
}
