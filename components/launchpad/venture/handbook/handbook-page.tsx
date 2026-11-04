"use client";

import { useState, type ReactNode } from "react";
import { identityChoices } from "@/lib/launchpad/content/identity-content";
import { partLabel, type HandbookPageView } from "@/lib/launchpad/venture-test/handbook";
import type { LaunchpadSummarySection } from "@/lib/launchpad/content/types";
import { sectionLines, summaryCatalog } from "@/lib/launchpad/content/summary";
import { useIdentityAnswer, useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { SummaryLines } from "@/components/launchpad/venture/summary-lines";
import { BusinessLogo } from "@/components/launchpad/venture/identity/business-logo";
import { IdentityEditor } from "@/components/launchpad/venture/identity/identity-choices";
import { AccentLabel, HandRule, PAPER_ACCENT, TagChip } from "@/components/launchpad/venture/handbook/paper-art";
import { VisionBlock } from "@/components/launchpad/venture/handbook/vision-block";
import { BusinessName, LogoMark, logoMarkLabel } from "@/components/launchpad/venture/identity/business-logo";
import { resolveNameColor } from "@/lib/launchpad/content/identity";
import { BTN_CYAN, TickBadge } from "@/components/launchpad/venture-test/venture-test-ui";

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
      <svg width="22" height="22" viewBox="0 0 100 100" fill="none" stroke={ACCENT} strokeWidth="7" aria-hidden="true" className="mb-1.5 rotate-[14deg]" data-doodle="bead">
        <path d="M18 60C18 34 34 18 50 18S82 34 82 60" strokeLinecap="round" />
        <circle cx="18" cy="70" r="9" />
        <circle cx="50" cy="80" r="9" />
        <circle cx="82" cy="70" r="9" />
      </svg>
    );
  return (
    <svg width="22" height="22" viewBox="0 0 100 100" fill="none" stroke={ACCENT} strokeWidth="7" strokeLinejoin="round" aria-hidden="true" className="mb-1.5 rotate-[14deg]" data-doodle="paw">
      <circle cx="27" cy="42" r="9" />
      <circle cx="41" cy="25" r="9.5" />
      <circle cx="60" cy="25" r="9.5" />
      <circle cx="74" cy="42" r="9" />
      <path d="M50 50C62 50 76 62 76 73C76 82 67 85 59 83C55 82 45 82 41 83C33 85 24 82 24 73C24 62 38 50 50 50Z" />
    </svg>
  );
}

function DoneChip() {
  return (
    <span className="flex items-center gap-1 rounded-md bg-[#F3F4F6] py-[3px] pl-1.5 pr-[7px] text-[11px] font-medium text-[#374151]" data-done-chip="">
      <TickBadge size={13} />
      Done
    </span>
  );
}

function TopRow({ eyebrow, done }: { eyebrow: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">{eyebrow}</span>
      {done && <DoneChip />}
    </div>
  );
}

function EditPencil() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

/** Section lines from the saved answers (the same lines the wrap-up shows). */
export function useSectionLines(sections: readonly LaunchpadSummarySection[]) {
  const ctx = useLaunchpadAnswers();
  const catalog = summaryCatalog(ctx?.floors ?? []);
  return sections.map((section) => ({ section, lines: sectionLines(section, ctx?.answers, catalog) }));
}

/**
 * One handbook section in the r4 look: a list answer as product tag chips,
 * a single text answer as the big quote, anything else as plain lines.
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
        <ul className="mt-3 flex flex-col items-start gap-[9px]" aria-label={section.label}>
          {lines.map((l) => (
            <TagChip key={l}>{l}</TagChip>
          ))}
        </ul>
      ) : section.display === "text" && lines.length === 1 ? (
        <div className="relative mt-3 pl-7" data-quote="">
          <svg className="absolute left-0 top-1 opacity-40" width="22" height="18" viewBox="0 0 44 36" fill={ACCENT} aria-hidden="true">
            <path d="M4 36V22C4 10 10 3 19 1l2 5C15 8 12 13 12 18h8v18Z" />
            <path d="M26 36V22C26 10 32 3 41 1l2 5C37 8 34 13 34 18h8v18Z" />
          </svg>
          <p className="font-heading text-[19px] font-semibold leading-[1.42] tracking-[-0.005em] text-[#111827]">{lines[0]}</p>
        </div>
      ) : (
        <SummaryLines display={section.display} lines={lines} className="mt-3 text-[15px] leading-[1.45] text-[#111827]" />
      )}
    </div>
  );
}

/**
 * "Vision and products" (r4): the logo and name drawn from the saved identity
 * answer (the same answer the lessons and the wrap-up write), an Edit button
 * when editable, then the identity wrap-up's handbook sections ("Our vision",
 * "What we sell") from the learner's saved answers. A section with no answer
 * yet is left off.
 */
function IdentityPageBody({ page, editable, iconVentureId }: { page: HandbookPageView; editable: boolean; iconVentureId: string }) {
  const wrapUp = page.silver.wrapUp?.type === "identity-wrap-up" ? page.silver.wrapUp : null;
  const answerKey = wrapUp?.answerKey ?? "";
  const { answer, update } = useIdentityAnswer(answerKey);
  const choices = identityChoices(page.silver, answerKey, iconVentureId);
  const [editing, setEditing] = useState(false);
  // D25 / cover order: logo, name, then the compiled vision. When the vision
  // spec exists it stands in for the offer-picks "Our vision" section.
  const vision = wrapUp?.vision;
  const sections = useSectionLines(wrapUp?.handbookSections ?? [])
    .filter((s) => s.lines.length)
    .filter((s) => !(vision && s.section.id === "our-vision"));
  const fontLabel = choices.fonts.find((f) => f.id === answer.font)?.label;
  return (
    <>
      <TopRow eyebrow="Your identity" done={page.done} />
      <div className="mt-3.5 flex flex-col items-center gap-3" data-identity-lockup="">
        <BusinessLogo answer={answer} size="hb" namePlaceholder="Your business name" />
        {fontLabel && (
          <p className="-mt-2 text-[11px] text-[#9CA3AF]" data-font-label="">
            Font: {fontLabel}
          </p>
        )}
        {editable && (
          <button
            type="button"
            aria-expanded={editing}
            onClick={() => setEditing((e) => !e)}
            className="relative flex h-[34px] items-center gap-[7px] rounded-[10px] pl-[13px] pr-4 text-sm font-medium text-[#374151] shadow-[inset_0_0_0_1px_#E5E7EB] before:absolute before:-inset-x-1 before:-inset-y-[5px] before:content-['']"
            data-edit-identity=""
          >
            <EditPencil />
            {editing ? "Close" : "Edit"}
            <span className="sr-only"> logo and name</span>
          </button>
        )}
      </div>
      {editable && editing && (
        <div className="mt-3 rounded-xl bg-white p-3" data-inline-editor="identity">
          <IdentityEditor choices={choices} answer={answer} update={update} idPrefix={`handbook-${answerKey}`} />
          <button type="button" className={`${BTN_CYAN} mt-3 w-full !py-2 !text-sm`} onClick={() => setEditing(false)}>
            Done
          </button>
        </div>
      )}
      {vision && (
        <div className="mt-3 w-full" data-identity-page-vision="">
          <HandRule />
          <VisionBlock spec={vision} doodle={sections.length ? undefined : <Doodle ventureId={iconVentureId} />} />
        </div>
      )}
      {sections.map(({ section, lines }, i) => (
        <HandbookSection
          key={section.id}
          section={section}
          lines={lines}
          doodle={i === sections.length - 1 ? <Doodle ventureId={iconVentureId} /> : undefined}
        />
      ))}
    </>
  );
}

/** Small orange rocket doodle for the empty logo slot. */
function RocketDoodle() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFA503" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" data-doodle="rocket">
      <path d="M12 3c3 2 4.5 5.5 4.5 9.5L14 16h-4l-2.5-3.5C7.5 8.5 9 5 12 3z" />
      <circle cx="12" cy="9.5" r="1.6" />
      <path d="M7.5 12.5L5 15l2.5 1M16.5 12.5L19 15l-2.5 1M10.5 18.5L12 21l1.5-2.5" />
    </svg>
  );
}

/**
 * Workbook page 1, the cover (workbook-page1-cover-spec-r1): the logo slot,
 * the business name, then the vision. Read-only, no pencils; each slot fills
 * on its own from the saved answers and shows grey placeholder text until then.
 */
/** Cover logo: 72px (was 120px; 40% smaller so the longer vision fits, Cath 5 Nov 8:15am). */
const COVER_LOGO_PX = 72;

function CoverPageBody({ page }: { page: HandbookPageView }) {
  const wrapUp = page.silver.wrapUp?.type === "identity-wrap-up" ? page.silver.wrapUp : null;
  const { answer } = useIdentityAnswer(wrapUp?.answerKey ?? "");
  const hasLogo = !!(answer.shape && answer.color && answer.icon);
  return (
    <div className="flex flex-col items-center gap-3 pt-2" data-cover="">
      {hasLogo ? (
        <div data-cover-logo="filled">
          <LogoMark shape={answer.shape} color={answer.color} icon={answer.icon} size={COVER_LOGO_PX} label={logoMarkLabel(answer)} />
        </div>
      ) : (
        <div
          data-cover-logo="empty"
          className="flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 rounded-full border-2 border-dashed border-[#D9DEE8] text-center"
        >
          <RocketDoodle />
          <span className="px-1 text-[10px] leading-tight text-[#9AA3B5]">Your logo goes here</span>
        </div>
      )}
      {answer.name ? (
        <div data-cover-name="filled">
          <BusinessName name={answer.name} font={answer.font ?? "poppins-bold"} color={resolveNameColor(answer)} size="hb" />
        </div>
      ) : (
        <p data-cover-name="empty" className="font-heading text-[18px] font-semibold text-[#9AA3B5]">
          Your business name
        </p>
      )}
      <div className="w-full">
        <HandRule />
        {wrapUp?.vision && <VisionBlock spec={wrapUp.vision} />}
      </div>
    </div>
  );
}

/** A workbook-summary silver: its title, then the wrap-up's sections from saved answers. */
function SummaryPageBody({ page, iconVentureId }: { page: HandbookPageView; iconVentureId: string }) {
  const wrapUp = page.silver.wrapUp?.type === "workbook-summary" ? page.silver.wrapUp : null;
  const sections = useSectionLines(wrapUp?.sections ?? []);
  return (
    <>
      <TopRow eyebrow={`${page.floorName} · Step ${page.silverNumber}`} done={page.done} />
      <h2 className="mt-3 font-heading text-[22px] font-semibold leading-tight text-[#111827]">{page.silver.title}</h2>
      {sections.map(({ section, lines }, i) =>
        lines.length ? (
          <HandbookSection key={section.id} section={section} lines={lines} doodle={i === 0 ? <Doodle ventureId={iconVentureId} /> : undefined} />
        ) : (
          <div key={section.id} data-handbook-section={section.id}>
            <HandRule />
            <AccentLabel>{section.label}</AccentLabel>
            <p className="mt-2 text-[14px] italic text-[#9CA3AF]">Not answered yet</p>
          </div>
        ),
      )}
    </>
  );
}

/** Every other completed silver: its title, then its finished bronzes as tag chips. */
function PlaceholderPageBody({ page }: { page: HandbookPageView }) {
  return (
    <>
      <TopRow eyebrow={`${page.floorName} · Step ${page.silverNumber}`} done={page.done} />
      <h2 className="mt-3 font-heading text-[22px] font-semibold leading-tight text-[#111827]">{page.silver.title}</h2>
      <HandRule />
      <AccentLabel>What I did</AccentLabel>
      <ul className="mt-3 flex flex-col items-start gap-[9px]" aria-label="What I did">
        {page.bronzeTitles.map((t, i) => (
          <TagChip key={t}>{partLabel(t, i)}</TagChip>
        ))}
      </ul>
    </>
  );
}

/**
 * One handbook page (one completed silver), drawn on the r4 paper card.
 * `editable` comes from the entry point and the silver's completion (see
 * isHandbookPageEditable): from the building, completed identity pages get
 * an Edit button; from home everything is read-only. Summary pages are read
 * here (their values are edited on the silver's wrap-up). Placeholder pages
 * have nothing to edit.
 */
export function HandbookPage({ page, editable, iconVentureId }: { page: HandbookPageView; editable: boolean; iconVentureId: string }) {
  return (
    <article
      className="relative"
      data-handbook-page={page.kind === "cover" ? "cover" : page.silver.id}
      data-editable={editable ? "true" : "false"}
      aria-label={page.kind === "cover" ? `Page ${page.number}` : `Page ${page.number}: ${page.silver.title}`}
    >
      {page.kind === "cover" ? (
        <CoverPageBody page={page} />
      ) : page.kind === "identity" ? (
        <IdentityPageBody page={page} editable={editable} iconVentureId={iconVentureId} />
      ) : page.kind === "summary" ? (
        <SummaryPageBody page={page} iconVentureId={iconVentureId} />
      ) : (
        <PlaceholderPageBody page={page} />
      )}
    </article>
  );
}
