"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { identityChoices } from "@/lib/launchpad/content/identity-content";
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
import { SummaryLines } from "@/components/launchpad/venture/summary-lines";
import { BinderSection } from "@/components/launchpad/venture/summary-wrap-up";
import { IdentityEditor } from "@/components/launchpad/venture/identity/identity-choices";
import {
  AccentLabel,
  HandRule,
  PAPER_ACCENT,
} from "@/components/launchpad/venture/handbook/paper-art";
import { useVisionSentence, VisionBlock, VISION_TEXT_STEPS } from "@/components/launchpad/venture/handbook/vision-block";
import {
  BusinessName,
  LogoMark,
  logoMarkLabel,
} from "@/components/launchpad/venture/identity/business-logo";
import { resolveNameColor } from "@/lib/launchpad/content/identity";
import {
  BTN_CYAN_COMPACT,
} from "@/components/launchpad/venture-test/venture-test-ui";
import { costsOf, practiceRunOf, selectionOf } from "@/lib/launchpad/content/answers";
import { chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { CostWorkbookBody } from "@/components/launchpad/venture/screens/cost-workbook";
import { ProductHandbook } from "@/components/launchpad/venture/handbook/module2-handbook";
import { FundingSheet, JobsSheet, PlanningWrapSheet, PriceSheet, PricingSummarySheet } from "@/components/launchpad/venture/handbook/planning-sheets";
import { ReadyWrap } from "@/components/launchpad/venture/screens/getting-ready-flow";
import { FlatSticker } from "@/components/launchpad/venture/handbook/flat-stickers";

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

/** No Done chip on any workbook page (Cath, 5 Nov 5:35pm): the eyebrow only. */
function TopRow({ eyebrow }: { eyebrow: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">
        {eyebrow}
      </span>
    </div>
  );
}

function EditPencil() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="#374151"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
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
        <p className="mt-3 text-[15px] leading-snug text-[#19347D]" aria-label={section.label}>
          {joinSentence(lines)}
        </p>
      ) : section.display === "text" && lines.length === 1 ? (
        <div className="relative mt-3 pl-7" data-quote="">
          <svg
            className="absolute left-0 top-1 opacity-40"
            width="22"
            height="18"
            viewBox="0 0 44 36"
            fill={ACCENT}
            aria-hidden="true"
          >
            <path d="M4 36V22C4 10 10 3 19 1l2 5C15 8 12 13 12 18h8v18Z" />
            <path d="M26 36V22C26 10 32 3 41 1l2 5C37 8 34 13 34 18h8v18Z" />
          </svg>
          <p className="font-heading text-[19px] font-semibold leading-[1.42] tracking-[-0.005em] text-[#111827]">
            {lines[0]}
          </p>
        </div>
      ) : (
        <SummaryLines
          display={section.display}
          lines={lines}
          className="mt-3 text-[15px] leading-[1.45] text-[#111827]"
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
 * The whole cover must fit the page card with no scrolling: the vision text
 * steps down (VISION_TEXT_STEPS) until it does. Grey placeholders until filled.
 */
const COVER_LOGO_PX = 80;

function WhatWeSell() {
  const ctx = useLaunchpadAnswers();
  const labels = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer").map((service) => service.label);
  if (!labels.length) return null;
  const sentence = labels.length === 1 ? labels[0] : labels.length === 2 ? `${labels[0]} and ${labels[1]}` : `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
  return (
    <div className="mt-2" data-what-we-sell="">
      <AccentLabel>What we sell</AccentLabel>
      <p className="mt-1 text-[14px] leading-snug text-[#19347D]">{sentence}.</p>
    </div>
  );
}

function CoverPageBody({
  page,
  editable,
  iconVentureId,
}: {
  page: HandbookPageView;
  editable: boolean;
  iconVentureId: string;
}) {
  const wrapUp =
    page.silver.wrapUp?.type === "identity-wrap-up" ? page.silver.wrapUp : null;
  const answerKey = wrapUp?.answerKey ?? "";
  const { answer, update } = useIdentityAnswer(answerKey);
  const choices = identityChoices(page.silver, answerKey, iconVentureId);
  const [editing, setEditing] = useState(false);
  const hasLogo = !!(answer.shape && answer.color && answer.icon);
  const sentence = useVisionSentence(wrapUp?.vision);
  const rootRef = useRef<HTMLDivElement>(null);
  const [fitKey, setFitKey] = useState(0);
  const fitSig = JSON.stringify([sentence, answer.name, answer.font, hasLogo, editable, editing, fitKey]);
  const [fit, setFit] = useState({ sig: fitSig, step: 0 });
  const step = fit.sig === fitSig ? fit.step : 0;

  // Re-fit when the window resizes or the web fonts finish loading (glyph widths change).
  useEffect(() => {
    const bump = () => setFitKey((k) => k + 1);
    window.addEventListener("resize", bump);
    const fonts = typeof document !== "undefined" ? document.fonts : undefined;
    fonts?.addEventListener?.("loadingdone", bump);
    void fonts?.ready?.then(bump);
    return () => {
      window.removeEventListener("resize", bump);
      fonts?.removeEventListener?.("loadingdone", bump);
    };
  }, []);

  // Step the vision down (text size, quote mark, spacing) one render at a time
  // until the cover fits its page card with no scroll. Layout effects run
  // before paint, so the learner only sees the final step. While the logo and
  // name editor is open the card may scroll.
  useLayoutEffect(() => {
    if (fit.sig !== fitSig) {
      setFit({ sig: fitSig, step: 0 });
      return;
    }
    const scroller = rootRef.current?.closest<HTMLElement>("[data-paper-scroll]");
    if (!scroller || editing) return;
    if (scroller.scrollHeight > scroller.clientHeight + 1 && fit.step < VISION_TEXT_STEPS.length - 1) {
      setFit({ sig: fitSig, step: fit.step + 1 });
    }
  }, [fit, fitSig, editing]);

  return (
    <div ref={rootRef} className={`relative flex flex-col items-center ${step >= 3 ? "gap-1.5" : "gap-2.5"}`} data-cover="" data-cover-fit-step={step}>
      <img src="/launchpad/workbook/penny-protip.png" alt="" width={46} height={46} className="pointer-events-none absolute bottom-0 right-1 h-[46px] w-auto" />
      <span className="pointer-events-none absolute right-2 top-1"><FlatSticker kind="sparkle" doodle /></span>
      <span className="pointer-events-none absolute left-6 top-16"><FlatSticker kind="heart" doodle /></span>
      {hasLogo ? (
        <div data-cover-logo="filled">
          <LogoMark
            shape={answer.shape}
            color={answer.color}
            icon={answer.icon}
            size={COVER_LOGO_PX}
            label={logoMarkLabel(answer)}
          />
        </div>
      ) : (
        <div
          data-cover-logo="empty"
          className="flex h-[80px] w-[80px] flex-col items-center justify-center gap-0.5 rounded-full border-2 border-dashed border-[#D9DEE8] text-center"
        >
          <RocketDoodle />
          <span className="px-1 text-[9.5px] leading-tight text-[#9AA3B5]">
            Your logo goes here
          </span>
        </div>
      )}
      {answer.name ? (
        <div data-cover-name="filled">
          <BusinessName
            name={answer.name}
            font={answer.font ?? "poppins-bold"}
            color={resolveNameColor(answer)}
            size="cover"
          />
        </div>
      ) : (
        <p
          data-cover-name="empty"
          className="font-heading text-[16px] font-semibold text-[#9AA3B5]"
        >
          Your business name
        </p>
      )}
      {editable && (hasLogo || answer.name) && (
        <button
          type="button"
          aria-expanded={editing}
          onClick={() => setEditing((e) => !e)}
          className="absolute -right-1 top-0 flex h-[30px] items-center gap-[5px] rounded-[10px] bg-white pl-2 pr-2.5 text-[13px] font-medium text-[#374151] shadow-[inset_0_0_0_1px_#E5E7EB] before:absolute before:-inset-x-1 before:-inset-y-[7px] before:content-['']"
          data-edit-identity=""
        >
          <EditPencil />
          {editing ? "Close" : "Edit"}
          <span className="sr-only"> logo and name</span>
        </button>
      )}
      {editable && editing && (
        <div
          className="w-full rounded-xl bg-white p-3"
          data-inline-editor="identity"
        >
          <IdentityEditor
            choices={choices}
            answer={answer}
            update={update}
            idPrefix={`handbook-${answerKey}`}
          />
          <div className="mt-3 flex w-full justify-center self-stretch">
            <button
              type="button"
              className={BTN_CYAN_COMPACT}
              data-inline-editor-done=""
              onClick={() => setEditing(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
      <div className="flex w-full flex-col">
        <HandRule className={step >= 3 ? "mb-2 mt-2.5" : "mb-3.5 mt-5"} />
        {wrapUp?.vision && <VisionBlock spec={wrapUp.vision} textStep={step} />}
        <WhatWeSell />
      </div>
    </div>
  );
}

/**
 * K14: every page after the cover carries a small identity header (logo and
 * name) so the workbook reads as the learner's own. Left off until either is chosen.
 */
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
          className="truncate font-heading text-[13px] font-semibold"
          style={{ color: resolveNameColor(answer) }}
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
function SummaryPageBody({
  page,
  editable,
  iconVentureId,
}: {
  page: HandbookPageView;
  editable: boolean;
  iconVentureId: string;
}) {
  const sections = useSectionLines(silverHandbookSections(page.silver));
  const ctx = useLaunchpadAnswers();
  const [editing, setEditing] = useState<string | null>(null);
  if (editable && ctx) {
    const catalog = summaryCatalog(ctx.floors ?? []);
    return (
      <>
        <TopRow eyebrow={`${page.floorName} · Step ${page.silverNumber}`} />
        <h2 className="mt-3 font-heading text-[22px] font-semibold leading-tight text-[#111827]">{page.silver.title}</h2>
        <div className="mt-3">
          {sections.map(({ section }, i) => (
            <BinderSection
              key={section.id}
              section={section}
              first={i === 0}
              answers={ctx.answers}
              catalog={catalog}
              editing={editing}
              setEditing={setEditing}
              setAnswer={ctx.setAnswer}
            />
          ))}
        </div>
        {page.silver.id === "l1-s1" && (
          <div className="mt-3 flex gap-2">
            <FlatSticker kind="star" doodle />
            <FlatSticker kind="heart" doodle />
            <FlatSticker kind="sparkle" doodle />
          </div>
        )}
      </>
    );
  }
  return (
    <>
      <TopRow
        eyebrow={`${page.floorName} · Step ${page.silverNumber}`}
        />
      <h2 className="mt-3 font-heading text-[22px] font-semibold leading-tight text-[#111827]">
        {page.silver.title}
      </h2>
      {sections.map(({ section, lines }, i) =>
        lines.length ? (
          <HandbookSection
            key={section.id}
            section={section}
            lines={lines}
            doodle={i === 0 ? <Doodle ventureId={iconVentureId} /> : undefined}
          />
        ) : (
          <div key={section.id} data-handbook-section={section.id}>
            <HandRule />
            <AccentLabel>{section.label}</AccentLabel>
            <p className="mt-2 text-[14px] italic text-[#9CA3AF]">
              Not answered yet
            </p>
          </div>
        ),
      )}
      {page.silver.id === "l1-s1" && (
        <div className="mt-3 flex gap-2">
          <FlatSticker kind="star" doodle />
          <FlatSticker kind="heart" doodle />
          <FlatSticker kind="sparkle" doodle />
        </div>
      )}
    </>
  );
}

/** Every other completed silver: its title, then its finished bronzes as tag chips. */
function PlaceholderPageBody({ page }: { page: HandbookPageView }) {
  return (
    <>
      <TopRow
        eyebrow={`${page.floorName} · Step ${page.silverNumber}`}
        />
      <h2 className="mt-3 font-heading text-[22px] font-semibold leading-tight text-[#111827]">
        {page.silver.title}
      </h2>
      <HandRule />
      <AccentLabel>What I did</AccentLabel>
      <ul className="mt-3 flex flex-col gap-2" aria-label="What I did">
        {page.bronzeTitles.map((t, i) => (
          <li key={t} className="text-[15px] leading-snug text-[#19347D]">{partLabel(t, i)}</li>
        ))}
      </ul>
    </>
  );
}

/**
 * One handbook page (one completed silver), drawn on the r4 paper card.
 * `editable` comes from the entry point and the silver's completion (see
 * isHandbookPageEditable): from the building, completed identity pages get
 * an Edit button and summary pages get their pencils (the inline edits the
 * sheet's column AA allows); from home everything is read-only. Placeholder pages
 * have nothing to edit.
 */
export function HandbookPage({
  page,
  editable,
  iconVentureId,
  onEditCosts,
}: {
  page: HandbookPageView;
  editable: boolean;
  iconVentureId: string;
  /** Opens the cost sheet for the start-up list or one service. */
  onEditCosts?: (step: { name: "startup" } | { name: "service"; serviceId: string }) => void;
}) {
  return (
    <article
      className="relative"
      data-handbook-page={page.sheet ?? (page.kind === "cover" ? "cover" : page.kind === "costs" ? "my-costs" : page.silver.id)}
      data-editable={editable ? "true" : "false"}
      aria-label={
        page.kind === "cover"
          ? `Page ${page.number}`
          : page.kind === "costs"
            ? `Page ${page.number}: My costs`
            : `Page ${page.number}: ${page.silver.title}`
      }
    >
      {page.kind !== "cover" && <MiniIdentity />}
      {page.sheet === "price" ? (
        <PriceSheet />
      ) : page.sheet === "jobs" ? (
        <JobsSheet />
      ) : page.sheet === "pricing-b" ? (
        <PricingSummarySheet />
      ) : page.sheet === "plan-1" || page.sheet === "plan-2" || page.sheet === "plan-3" || page.sheet === "plan-4" ? (
        <PlanningWrapSheet sheet={page.sheet} />
      ) : page.sheet === "funding" ? (
        <FundingSheet />
      ) : page.silver.id === "l2-s1" ? (
        <ProductOrSummary page={page} editable={editable} iconVentureId={iconVentureId} />
      ) : page.sheet === "ready-a" || page.sheet === "ready-b" || page.sheet === "ready-c" ? (
        <ReadyWrapPage sheet={page.sheet} />
      ) : page.kind === "cover" ? (
        <CoverPageBody page={page} editable={editable} iconVentureId={iconVentureId} />
      ) : page.kind === "summary" && page.silver.id === "l2-s1" ? (
        <ProductOrSummary page={page} editable={editable} iconVentureId={iconVentureId} />
      ) : page.kind === "summary" ? (
        <SummaryPageBody page={page} editable={editable} iconVentureId={iconVentureId} />
      ) : page.kind === "costs" ? (
        <CostsPageBody editable={editable && !!onEditCosts} onEditCosts={onEditCosts} silver={page.silver} part={page.sheet === "costs-b" ? "rest" : page.sheet === "costs-a" ? "startup" : "all"} />
      ) : (
        <PlaceholderPageBody page={page} />
      )}
    </article>
  );
}

function ProductOrSummary({
  page,
  editable,
  iconVentureId,
}: {
  page: HandbookPageView;
  editable: boolean;
  iconVentureId: string;
}) {
  const ctx = useLaunchpadAnswers();
  if (ctx?.answers && ctx.answers["l2-offer"]?.kind === "offer") return <ProductHandbook editable={editable} />;
  if (page.kind === "summary") return <SummaryPageBody page={page} editable={editable} iconVentureId={iconVentureId} />;
  return <PlaceholderPageBody page={page} />;
}

function ReadyWrapPage({ sheet }: { sheet: "ready-a" | "ready-b" | "ready-c" }) {
  const ctx = useLaunchpadAnswers();
  const practice = practiceRunOf(ctx?.answers, "practice_run");
  const services = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  const serviceLabel = services.find((row) => row.id === practice?.service)?.label ?? "Dog walking";
  return <ReadyWrap page={sheet === "ready-a" ? "a" : sheet === "ready-b" ? "b" : "c"} answers={ctx?.answers} serviceLabel={serviceLabel} />;
}

function CostsPageBody({
  silver,
  editable,
  onEditCosts,
  part = "all",
}: {
  silver: HandbookPageView["silver"];
  editable: boolean;
  part?: "all" | "startup" | "rest";
  onEditCosts?: (step: { name: "startup" } | { name: "service"; serviceId: string }) => void;
}) {
  const ctx = useLaunchpadAnswers();
  const screen = silver.bronzes.flatMap((b) => b.tasks.flatMap((t) => t.screens)).find((s) => s.type === "know-your-cost");
  const answer = screen && screen.type === "know-your-cost" ? costsOf(ctx?.answers, screen.answerKey) : undefined;
  if (!screen || screen.type !== "know-your-cost" || !answer) return null;
  return (
    <>
      <CostWorkbookBody
        answer={answer}
        currency={readCurrencyPreference()}
        marketingLabel={screen.copy.marketingLabel}
        starterLabel={screen.copy.starterLabel}
        hint={screen.copy.workbookHint}
        editable={editable}
        part={part}
        onEditStartup={onEditCosts ? () => onEditCosts({ name: "startup" }) : undefined}
        onEditService={onEditCosts ? (serviceId) => onEditCosts({ name: "service", serviceId }) : undefined}
      />
    </>
  );
}
