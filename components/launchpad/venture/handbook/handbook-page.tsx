"use client";

import { useState, type ReactNode } from "react";
import type { IdentityField, BusinessIdentityAnswer } from "@/lib/launchpad/content/identity";
import { resolveNameColor } from "@/lib/launchpad/content/identity";
import { identityChoices, type IdentityChoices } from "@/lib/launchpad/content/identity-content";
import type { HandbookPageView } from "@/lib/launchpad/venture-test/handbook";
import { useIdentityAnswer } from "@/components/launchpad/venture/identity/answers-context";
import { BusinessLogo } from "@/components/launchpad/venture/identity/business-logo";
import { IdentityFieldEditor } from "@/components/launchpad/venture/identity/identity-choices";
import { NAME_FONT_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";
import { DoneStamp, HandbookProp, PencilIcon } from "@/components/launchpad/venture/handbook/handbook-art";
import { BTN_CYAN } from "@/components/launchpad/venture-test/venture-test-ui";
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";

/** Section block tints and their sticker labels, cycled per block (existing tokens only). */
const BLOCKS = [
  { block: "bg-nga-mist", sticker: "bg-nga-secondary text-nga-ink" },
  { block: "bg-nga-accent/20", sticker: "bg-nga-accent text-nga-ink" },
  { block: "bg-nga-panel/45", sticker: "bg-nga-ink text-white" },
  { block: "bg-nga-mist border-2 border-dashed border-nga-secondary", sticker: "bg-nga-ink text-white" },
] as const;

function Banner({ page }: { page: HandbookPageView }) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5 rounded-xl bg-nga-ink px-3 py-2.5 text-white">
      <span className="flex size-[42px] flex-none items-center justify-center rounded-full bg-nga-accent font-heading text-[17px] font-extrabold text-nga-ink">
        L{page.level}
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.8px] text-nga-secondary">
          {page.floorName} · <span className="whitespace-nowrap">Silver {page.silverNumber}</span>
        </p>
        <h2 className="font-heading text-[17px] font-extrabold leading-[1.15]">{page.silver.title}</h2>
      </div>
    </div>
  );
}

/** One colored workbook block with a sticker label. */
function Block({ label, tone, prop, children }: { label: string; tone: number; prop?: ReactNode; children: ReactNode }) {
  const t = BLOCKS[tone % BLOCKS.length]!;
  return (
    <section className={`relative mb-2.5 rounded-xl px-2.5 pb-2.5 pt-2 ${t.block}`} aria-label={label}>
      {prop}
      <span className={`-ml-1 mb-1.5 inline-block -rotate-2 rounded-full px-2.5 py-0.5 font-heading text-xs font-bold ${t.sticker}`}>
        {label}
      </span>
      {children}
    </section>
  );
}

/** A written entry: a plain heading with the learner's answer under it. */
function Entry({
  heading,
  children,
  edit,
}: {
  heading: string;
  children: ReactNode;
  edit?: { open: boolean; onToggle: () => void; editor: ReactNode };
}) {
  return (
    <div className="border-t border-white/80 py-1 first:border-t-0" data-entry={heading}>
      <div className="flex min-h-11 items-center gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.5px] text-nga-slate">{heading}</h3>
          <div className="text-[14px] font-semibold text-nga-ink">{children}</div>
        </div>
        {edit && (
          <button
            type="button"
            aria-label={`${edit.open ? "Close" : "Edit"} ${heading.toLowerCase()}`}
            aria-expanded={edit.open}
            onClick={edit.onToggle}
            className={`flex size-11 flex-none items-center justify-center rounded-full ${edit.open ? "bg-nga-secondary" : "bg-white"} shadow-[inset_0_0_0_2px_#bde9fb]`}
            data-edit-pencil=""
          >
            <PencilIcon />
          </button>
        )}
      </div>
      {edit?.open && (
        <div className="mb-1 mt-1.5 rounded-xl bg-white p-2.5" data-inline-editor={heading}>
          {edit.editor}
          <button type="button" className={`${BTN_CYAN} mt-2.5 w-full !py-2 !text-sm`} onClick={edit.onToggle}>
            Done
          </button>
        </div>
      )}
    </div>
  );
}

const NOT_PICKED = <span className="font-medium text-nga-slate">Not picked yet</span>;

function Swatch({ hex }: { hex: string }) {
  return <span aria-hidden="true" className="mr-1.5 inline-block size-3.5 rounded-full align-[-2px]" style={{ background: hex }} />;
}

function labelOf(options: readonly { id: string; label: string }[], id: string | undefined): string | undefined {
  return id === undefined ? undefined : options.find((o) => o.id === id)?.label;
}

const LOGO_FIELDS: readonly { field: IdentityField; heading: string }[] = [
  { field: "shape", heading: "Shape" },
  { field: "color", heading: "Color" },
  { field: "icon", heading: "Icon" },
];
const NAME_FIELDS: readonly { field: IdentityField; heading: string }[] = [
  { field: "name", heading: "Business name" },
  { field: "font", heading: "Font" },
  { field: "nameColor", heading: "Name color" },
];

function entryValue(field: IdentityField, a: BusinessIdentityAnswer, c: IdentityChoices): ReactNode {
  switch (field) {
    case "shape":
      return labelOf(c.shapes, a.shape) ?? NOT_PICKED;
    case "color": {
      const label = c.colors.find((o) => o.hex.toUpperCase() === a.color?.toUpperCase())?.label;
      return a.color ? (
        <>
          <Swatch hex={a.color} />
          {label ?? a.color}
        </>
      ) : (
        NOT_PICKED
      );
    }
    case "icon":
      return labelOf(c.icons, a.icon) ?? NOT_PICKED;
    case "name":
      return a.name ? (
        <span className={a.font ? NAME_FONT_CLASS[a.font] : undefined} style={{ color: resolveNameColor(a), overflowWrap: "anywhere" }}>
          {a.name}
        </span>
      ) : (
        NOT_PICKED
      );
    case "font":
      return labelOf(c.fonts, a.font) ?? NOT_PICKED;
    case "nameColor": {
      const label = labelOf(c.nameColors, a.nameColor);
      return label ? (
        <>
          <Swatch hex={resolveNameColor(a)} />
          {label}
        </>
      ) : (
        NOT_PICKED
      );
    }
  }
}

/**
 * "Build your identity": the logo drawn from the saved answer (the same
 * answer the lessons and the wrap-up write), plus each pick written out.
 * Every value is read live from the answer, so an edit here, in a lesson or
 * on the wrap-up shows everywhere, and any later page that derives from these
 * answers re-renders from them automatically (the default; no copies kept).
 */
function IdentityPageBody({ page, editable, iconVentureId }: { page: HandbookPageView; editable: boolean; iconVentureId: string }) {
  const answerKey = page.silver.wrapUp!.answerKey;
  const { answer, update } = useIdentityAnswer(answerKey);
  const choices = identityChoices(page.silver, answerKey, iconVentureId);
  const [open, setOpen] = useState<IdentityField | null>(null);
  const [logoBronze, nameBronze] = page.silver.bronzes;
  const entries = (fields: typeof LOGO_FIELDS) =>
    fields.map(({ field, heading }) => (
      <Entry
        key={field}
        heading={heading}
        edit={
          editable
            ? {
                open: open === field,
                onToggle: () => setOpen(open === field ? null : field),
                editor: (
                  <IdentityFieldEditor
                    field={field}
                    choices={choices}
                    answer={answer}
                    update={update}
                    nameInputId={`handbook-${answerKey}-name`}
                  />
                ),
              }
            : undefined
        }
      >
        {entryValue(field, answer, choices)}
      </Entry>
    ));
  return (
    <>
      <Block label="My logo" tone={0}>
        <div className="flex justify-center py-1">
          <BusinessLogo answer={answer} size="sm" namePlaceholder="Your business name" />
        </div>
      </Block>
      <Block label={logoBronze?.title ?? "My logo"} tone={1}>
        {entries(LOGO_FIELDS)}
      </Block>
      <Block label={nameBronze?.title ?? "My name"} tone={2}>
        {entries(NAME_FIELDS)}
      </Block>
    </>
  );
}

/** Every other completed silver: the silver title as the block, its finished bronzes under plain headings. */
function PlaceholderPageBody({ page, propVentureId }: { page: HandbookPageView; propVentureId: string }) {
  return (
    <Block label={page.silver.title} tone={page.number} prop={<HandbookProp ventureId={propVentureId} index={page.number} />}>
      <div className="pb-14">
        {page.bronzeTitles.map((t) => (
          <h3 key={t} className="flex min-h-9 items-center gap-2 border-t border-white/80 font-heading text-[15px] font-bold text-nga-ink first:border-t-0">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="8" fill={VT.secondary} />
              <path d="M4.5 8.2l2.3 2.3 4.7-4.8" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
            {t}
          </h3>
        ))}
      </div>
    </Block>
  );
}

/**
 * One handbook page (one completed silver). `editable` comes from the entry
 * point and the silver's completion (see isHandbookPageEditable): from the
 * building, completed pages get edit pencils; from home everything is
 * read-only. Placeholder pages have nothing to edit.
 */
export function HandbookPage({
  page,
  editable,
  iconVentureId,
  propVentureId,
}: {
  page: HandbookPageView;
  editable: boolean;
  iconVentureId: string;
  propVentureId: string;
}) {
  return (
    <article className="relative" data-handbook-page={page.silver.id} data-editable={editable ? "true" : "false"} aria-label={`Page ${page.number}: ${page.silver.title}`}>
      <Banner page={page} />
      {page.done && <DoneStamp />}
      {page.kind === "identity" ? (
        <IdentityPageBody page={page} editable={editable} iconVentureId={iconVentureId} />
      ) : (
        <PlaceholderPageBody page={page} propVentureId={propVentureId} />
      )}
      <p className="mt-1 text-right text-[10px] font-semibold text-nga-slate">Page {page.number}</p>
    </article>
  );
}
