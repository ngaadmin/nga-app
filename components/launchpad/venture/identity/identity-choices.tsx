"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { useState, type ReactNode } from "react";
import type { LaunchpadPickerOption } from "@/lib/launchpad/content/types";
import {
  LOGO_PREVIEW_BASE,
  NAME_INK_HEX,
  type BusinessIdentityAnswer,
  type IdentityField,
  type LogoIconId,
  type LogoShapeId,
  type NameColorId,
  type NameFontId,
} from "@/lib/launchpad/content/identity";
import { LogoMark } from "@/components/launchpad/venture/identity/business-logo";
import { FREDOKA_CLASS, NAME_FONT_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";
import type { IdentityChoices } from "@/lib/launchpad/content/identity-content";

/*
 * The choice groups shared by the logo builder, the name screen, the
 * wrap-up's editor and the handbook's Edit panel (r8 builder, r10 name
 * screen). Each is a radiogroup of 44px+ buttons with accessible names.
 */

export type UpdateIdentity = <F extends IdentityField>(field: F, value: NonNullable<BusinessIdentityAnswer[F]>) => void;

/** Form accent from the r8/r10 designs (the palette's light blue). */
export const IDENTITY_ACCENT = "#3FB7DA";

function Group({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={className}>
      {children}
    </div>
  );
}

/** A tile holding a small logo (shape and icon options): selected gets a 2px ring in the logo color. */
function LogoTile({
  on,
  label,
  ring,
  option,
  onPick,
  children,
}: {
  on: boolean;
  label: string;
  ring: string;
  option: string;
  onPick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={label}
      data-option={option}
      onClick={onPick}
      className="flex min-w-0 max-w-[92px] flex-1 flex-col items-center gap-2 text-[18px] font-medium text-[#374151]"
    >
      <span
        aria-hidden="true"
        className="flex aspect-square w-full max-w-[84px] items-center justify-center rounded-[20px] [&_svg]:h-auto [&_svg]:w-[72%]"
        style={{ background: on ? "#FFFFFF" : "#F9FAFB", boxShadow: on ? `0 0 0 2px ${ring}` : undefined }}
      >
        {children}
      </span>
      <span>{label}</span>
    </button>
  );
}

export function ShapeChoices({
  options,
  answer,
  update,
}: {
  options: readonly LaunchpadPickerOption<LogoShapeId>[];
  answer: BusinessIdentityAnswer;
  update: UpdateIdentity;
}) {
  const s = useSurfaceCopy();
  const base = answer.color ?? LOGO_PREVIEW_BASE;
  return (
    <Group label={s.identity.logoShape} className="flex w-full justify-center gap-2">
      {options.map((o) => (
        <LogoTile key={o.id} on={answer.shape === o.id} label={o.label} ring={base} option={o.id} onPick={() => update("shape", o.id)}>
          <LogoMark shape={o.id} color={base} icon={answer.icon} size={60} />
        </LogoTile>
      ))}
    </Group>
  );
}

/** r8 swatches: 52px ring around a 40px dot; the picked one gets a 2px ring in its own color, its name below. */
export function ColorChoices({
  options,
  answer,
  update,
}: {
  options: readonly (LaunchpadPickerOption & { hex: string })[];
  answer: BusinessIdentityAnswer;
  update: UpdateIdentity;
}) {
  const s = useSurfaceCopy();
  const picked = options.find((o) => o.hex.toUpperCase() === answer.color?.toUpperCase());
  return (
    <div>
      <Group label={s.identity.logoColor} className="flex justify-center gap-7">
        {options.map((o) => {
          const on = picked?.id === o.id;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={o.label}
              data-option={o.id}
              onClick={() => update("color", o.hex.toUpperCase())}
              className="flex size-[52px] items-center justify-center rounded-full"
              style={{ boxShadow: on ? `0 0 0 2px ${o.hex}` : undefined }}
            >
              <span aria-hidden="true" className="size-10 rounded-full" style={{ background: o.hex }} />
            </button>
          );
        })}
      </Group>
      <p className="mt-3.5 min-h-5 text-center text-[18px] font-medium text-[#374151]" aria-hidden="true" data-color-name="">
        {picked?.label ?? ""}
      </p>
    </div>
  );
}

export function IconChoices({
  options,
  answer,
  update,
}: {
  options: readonly LaunchpadPickerOption<LogoIconId>[];
  answer: BusinessIdentityAnswer;
  update: UpdateIdentity;
}) {
  const s = useSurfaceCopy();
  const base = answer.color ?? LOGO_PREVIEW_BASE;
  return (
    <Group label={s.identity.logoIcon} className="flex w-full justify-center gap-2">
      {options.map((o) => (
        <LogoTile key={o.id} on={answer.icon === o.id} label={o.label} ring={base} option={o.id} onPick={() => update("icon", o.id)}>
          <LogoMark shape={answer.shape ?? "circle"} color={base} icon={o.id} size={60} />
        </LogoTile>
      ))}
    </Group>
  );
}

/** Section heading: Fredoka 600, 18px. */
export function SectionHeading({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <h3 id={id} className={`mb-3 ${FREDOKA_CLASS} text-[18px] font-semibold leading-[26px] text-[#19347D]`}>
      {children}
    </h3>
  );
}

export function NameInput({
  id,
  label,
  placeholderText,
  maxLength,
  answer,
  update,
  visibleLabel = true,
}: {
  id: string;
  label: string;
  placeholderText?: string;
  maxLength: number;
  answer: BusinessIdentityAnswer;
  update: UpdateIdentity;
  /** The name screen shows its own section heading, so the field label is for screen readers only there. */
  visibleLabel?: boolean;
}) {
  const value = answer.name ?? "";
  const count = Array.from(value).length;
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className={visibleLabel ? "mb-2 text-[18px] font-medium text-[#374151]" : "sr-only"}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholderText}
        autoComplete="off"
        aria-describedby={`${id}-count`}
        onChange={(e) => update("name", e.target.value)}
        className="h-[54px] w-full rounded-xl bg-white px-4 font-sans text-[18px] font-medium leading-[26px] text-[#111827] shadow-[inset_0_0_0_1.5px_#E5E7EB] outline-none placeholder:text-[#9CA3AF] focus:shadow-[inset_0_0_0_1.5px_#3FB7DA]"
        style={{ caretColor: IDENTITY_ACCENT }}
      />
      <span id={`${id}-count`} className="mt-[7px] self-end text-[16px] text-[#9CA3AF]" aria-live="polite">
        <span aria-hidden="true">
          {count}/{maxLength}
        </span>
        <span className="sr-only">
          {count} of {maxLength} letters
        </span>
      </span>
    </div>
  );
}

/** r10 radio: filled light blue with a white center when on, a grey ring when off. */
function Radio({ on }: { on: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" className="flex-none">
      {on ? (
        <>
          <circle cx="11" cy="11" r="11" fill={IDENTITY_ACCENT} />
          <circle cx="11" cy="11" r="4.5" fill="#fff" />
        </>
      ) : (
        <circle cx="11" cy="11" r="10.25" fill="#fff" stroke="#C9CED6" strokeWidth="1.5" />
      )}
    </svg>
  );
}

const ROW = "flex h-[52px] w-full items-center gap-3.5 border-b border-[#F3F4F6] pl-0.5 text-left last:border-b-0";

/** Font radio rows, each label drawn in its own font (the same label the handbook shows). */
export function FontChoices({
  options,
  answer,
  update,
  labelledBy,
}: {
  options: readonly LaunchpadPickerOption<NameFontId>[];
  answer: BusinessIdentityAnswer;
  update: UpdateIdentity;
  labelledBy?: string;
}) {
  return (
    <div role="radiogroup" aria-label={labelledBy ? undefined : "Name font"} aria-labelledby={labelledBy}>
      {options.map((o) => {
        const on = answer.font === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            data-option={o.id}
            onClick={() => update("font", o.id)}
            className={ROW}
          >
            <Radio on={on} />
            <span className={`${NAME_FONT_CLASS[o.id]} text-lg leading-6 text-[#111827]`} aria-hidden="true">
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Font color radio rows with an 18px dot. Equal choices: neither is checked until the learner picks one. */
export function NameColorChoices({
  options,
  answer,
  update,
  labelledBy,
}: {
  options: readonly LaunchpadPickerOption<NameColorId>[];
  answer: BusinessIdentityAnswer;
  update: UpdateIdentity;
  labelledBy?: string;
}) {
  return (
    <div role="radiogroup" aria-label={labelledBy ? undefined : "Name color"} aria-labelledby={labelledBy}>
      {options.map((o) => {
        const on = answer.nameColor === o.id;
        const hex = o.id === "ink" || !answer.color ? NAME_INK_HEX : answer.color;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            data-option={o.id}
            onClick={() => update("nameColor", o.id)}
            className={ROW}
          >
            <Radio on={on} />
            <span aria-hidden="true" className="ml-0.5 size-[18px] flex-none rounded-full" style={{ background: hex }} />
            <span className="-ml-1 font-sans text-[18px] font-medium leading-[26px] text-[#111827]">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * The editor for one identity field. Shared by the identity wrap-up and the
 * handbook's Edit panel, so both edit the same saved answer.
 */
export function IdentityFieldEditor({
  field,
  choices,
  answer,
  update,
  nameInputId,
}: {
  field: IdentityField;
  choices: IdentityChoices;
  answer: BusinessIdentityAnswer;
  update: UpdateIdentity;
  nameInputId: string;
}) {
  switch (field) {
    case "shape":
      return <ShapeChoices options={choices.shapes} answer={answer} update={update} />;
    case "color":
      return <ColorChoices options={choices.colors} answer={answer} update={update} />;
    case "icon":
      return <IconChoices options={choices.icons} answer={answer} update={update} />;
    case "name":
      return (
        <NameInput id={nameInputId} label={choices.nameInputLabel} maxLength={choices.nameMaxLength} answer={answer} update={update} />
      );
    case "font":
      return <FontChoices options={choices.fonts} answer={answer} update={update} />;
    case "nameColor":
      return <NameColorChoices options={choices.nameColors} answer={answer} update={update} />;
  }
}

/** r8 segmented control: grey track, the active item white with a hairline ring. */
export function Segmented<T extends string>({
  label,
  items,
  value,
  onChange,
  idPrefix,
  panelId,
}: {
  label: string;
  items: readonly { id: T; label: string }[];
  value: T | null;
  onChange: (id: T) => void;
  idPrefix: string;
  panelId: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex rounded-xl bg-[#F3F4F6] p-[3px]">
      {items.map((it) => {
        const on = value === it.id;
        return (
          <button
            key={it.id}
            type="button"
            role="tab"
            id={`${idPrefix}-${it.id}`}
            aria-selected={on}
            aria-controls={panelId}
            onClick={() => onChange(it.id)}
            className={`relative flex h-[38px] flex-1 items-center justify-center rounded-[9px] text-[18px] font-medium before:absolute before:-inset-y-[3px] before:inset-x-0 before:content-[''] ${
              on ? "bg-white text-[#111827] shadow-[0_0_0_1px_#E5E7EB]" : "text-[#6B7280]"
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

const LOGO_TAB_IDS = ["shape", "color", "icon"] as const;

/**
 * Change any identity pick in place: a Logo row (Shape, Color, Icon) and a
 * Name row (Name, Font, Font color) of segmented tabs over one editor panel.
 * Used by the wrap-up and by the handbook's Edit panel.
 */
export function IdentityEditor({
  choices,
  answer,
  update,
  idPrefix,
  initial = "shape",
}: {
  choices: IdentityChoices;
  answer: BusinessIdentityAnswer;
  update: UpdateIdentity;
  idPrefix: string;
  initial?: IdentityField;
}) {
  const s = useSurfaceCopy();
  const logoTabs = [
    { id: "shape" as const, label: s.identity.shape },
    { id: "color" as const, label: s.identity.color },
    { id: "icon" as const, label: s.identity.icon },
  ];
  const nameTabs = [
    { id: "name" as const, label: s.identity.name },
    { id: "font" as const, label: s.identity.font },
    { id: "nameColor" as const, label: s.identity.fontColor },
  ];
  const [field, setField] = useState<IdentityField>(initial);
  const panelId = `${idPrefix}-panel`;
  const logo = LOGO_TAB_IDS.some((id) => id === field);
  return (
    <div data-identity-editor="">
      <p className="mb-1.5 text-[16px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">Logo</p>
      <Segmented label={s.identity.changeLogo} items={logoTabs} value={logo ? (field as (typeof logoTabs)[number]["id"]) : null} onChange={setField} idPrefix={`${idPrefix}-tab`} panelId={panelId} />
      <p className="mb-1.5 mt-3 text-[16px] font-semibold uppercase tracking-[0.08em] text-[#6B7280]">Name</p>
      <Segmented label={s.identity.changeName} items={nameTabs} value={logo ? null : (field as (typeof nameTabs)[number]["id"])} onChange={setField} idPrefix={`${idPrefix}-tab`} panelId={panelId} />
      <div id={panelId} role="tabpanel" aria-labelledby={`${idPrefix}-tab-${field}`} className="mt-5" data-editor={field}>
        <IdentityFieldEditor field={field} choices={choices} answer={answer} update={update} nameInputId={`${idPrefix}-name`} />
      </div>
    </div>
  );
}
