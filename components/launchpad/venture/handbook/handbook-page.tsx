"use client";

import { useState, type ReactNode } from "react";
import { identityChoices } from "@/lib/launchpad/content/identity-content";
import type { HandbookPageView } from "@/lib/launchpad/venture-test/handbook";
import { handbookVisionSample } from "@/lib/launchpad/venture-test/handbook-sample";
import { useIdentityAnswer } from "@/components/launchpad/venture/identity/answers-context";
import { BusinessLogo } from "@/components/launchpad/venture/identity/business-logo";
import { IdentityEditor } from "@/components/launchpad/venture/identity/identity-choices";
import { NAME_FONT_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";
import { BTN_CYAN } from "@/components/launchpad/venture-test/venture-test-ui";

/*
 * Handbook page art from handbook-vision-products-r4 (4 Nov): one warm paper
 * card, hand-drawn dividers, accent labels with an underline swash, product
 * tag chips and one doodle. The accent is the logo palette's light blue.
 */
const ACCENT = "#3FB7DA";

/** Hand-drawn divider between sections. */
function HandRule() {
  return (
    <svg className="mb-3.5 mt-5 block" width="100%" height="10" viewBox="0 0 254 10" preserveAspectRatio="none" aria-hidden="true" data-hand-rule="">
      <path d="M2 6C30 2.5 52 8.5 84 5.2S140 2.8 170 6.4S226 8 252 4.6" fill="none" stroke="#D9D1C3" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/** Accent section label (Fredoka, light blue) with its underline swash. */
function AccentLabel({ children, doodle, sample }: { children: ReactNode; doodle?: ReactNode; sample?: boolean }) {
  return (
    <div className="flex items-end gap-2">
      <h3 className={`${NAME_FONT_CLASS["fredoka-semibold"]} mt-1 inline-flex flex-col gap-px text-[15.5px] font-semibold tracking-[0.01em]`} style={{ color: ACCENT }}>
        {children}
        <svg width="74" height="7" viewBox="0 0 74 7" aria-hidden="true">
          <path d="M2 4.6C18 2 40 2.2 72 3.4" fill="none" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </h3>
      {doodle}
      {sample && (
        <span className="mb-1.5 ml-auto rounded border border-dashed border-[#C9CED6] px-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-[#6B7280]" data-sample="">
          Sample
        </span>
      )}
    </div>
  );
}

/** The page's one doodle: an outline paw (dog walking) or bead loop (bracelets). */
function Doodle({ ventureId }: { ventureId: string }) {
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

/** Product tag chip (a luggage tag with a punched hole). */
function TagChip({ children }: { children: ReactNode }) {
  return (
    <li
      className="relative flex h-8 items-center whitespace-nowrap rounded-r-lg bg-[#ECF8FB] pl-[23px] pr-3 text-[13px] font-medium text-[#111827] [clip-path:polygon(11px_0,100%_0,100%_100%,11px_100%,0_50%)]"
      data-tag-chip=""
    >
      <span aria-hidden="true" className="absolute left-[11px] top-1/2 -mt-[3px] size-1.5 rounded-full bg-[#FDFBF7]" />
      {children}
    </li>
  );
}

function DoneChip() {
  return (
    <span className="flex items-center gap-1 rounded-md bg-[#F3F4F6] py-[3px] pl-1.5 pr-[7px] text-[11px] font-medium text-[#374151]" data-done-chip="">
      <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#374151" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
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

/**
 * "Vision and products" (r4): the logo and name drawn from the saved identity
 * answer (the same answer the lessons and the wrap-up write), an Edit button
 * when editable, then "Our vision" and "What we sell". The seed has no vision
 * or product answers yet, so those show clearly marked sample text.
 */
function IdentityPageBody({ page, editable, iconVentureId }: { page: HandbookPageView; editable: boolean; iconVentureId: string }) {
  const answerKey = page.silver.wrapUp!.answerKey;
  const { answer, update } = useIdentityAnswer(answerKey);
  const choices = identityChoices(page.silver, answerKey, iconVentureId);
  const [editing, setEditing] = useState(false);
  const sample = handbookVisionSample(iconVentureId);
  const fontLabel = choices.fonts.find((f) => f.id === answer.font)?.label;
  return (
    <>
      <TopRow eyebrow="Vision and products" done={page.done} />
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

      <HandRule />
      <AccentLabel sample>Our vision</AccentLabel>
      <div className="relative mt-3 pl-7" data-vision="">
        <svg className="absolute left-0 top-1 opacity-40" width="22" height="18" viewBox="0 0 44 36" fill={ACCENT} aria-hidden="true">
          <path d="M4 36V22C4 10 10 3 19 1l2 5C15 8 12 13 12 18h8v18Z" />
          <path d="M26 36V22C26 10 32 3 41 1l2 5C37 8 34 13 34 18h8v18Z" />
        </svg>
        <p className="font-heading text-[19px] font-semibold leading-[1.42] tracking-[-0.005em] text-[#111827]">{sample.vision}</p>
      </div>

      <HandRule />
      <AccentLabel sample doodle={<Doodle ventureId={iconVentureId} />}>
        What we sell
      </AccentLabel>
      <ul className="mt-3 flex flex-col items-start gap-[9px]" aria-label="What we sell">
        {sample.products.map((p) => (
          <TagChip key={p}>{p}</TagChip>
        ))}
      </ul>
    </>
  );
}

/** Every other completed silver: its title, then its finished bronzes as tag chips. */
function PlaceholderPageBody({ page }: { page: HandbookPageView }) {
  return (
    <>
      <TopRow eyebrow={`${page.floorName} · Silver ${page.silverNumber}`} done={page.done} />
      <h2 className="mt-3 font-heading text-[22px] font-semibold leading-tight text-[#111827]">{page.silver.title}</h2>
      <HandRule />
      <AccentLabel>What I did</AccentLabel>
      <ul className="mt-3 flex flex-col items-start gap-[9px]" aria-label="What I did">
        {page.bronzeTitles.map((t) => (
          <TagChip key={t}>{t}</TagChip>
        ))}
      </ul>
    </>
  );
}

/**
 * One handbook page (one completed silver), drawn on the r4 paper card.
 * `editable` comes from the entry point and the silver's completion (see
 * isHandbookPageEditable): from the building, completed identity pages get
 * an Edit button; from home everything is read-only. Placeholder pages have
 * nothing to edit.
 */
export function HandbookPage({ page, editable, iconVentureId }: { page: HandbookPageView; editable: boolean; iconVentureId: string }) {
  return (
    <article
      className="relative"
      data-handbook-page={page.silver.id}
      data-editable={editable ? "true" : "false"}
      aria-label={`Page ${page.number}: ${page.silver.title}`}
    >
      {page.kind === "identity" ? (
        <IdentityPageBody page={page} editable={editable} iconVentureId={iconVentureId} />
      ) : (
        <PlaceholderPageBody page={page} />
      )}
    </article>
  );
}
