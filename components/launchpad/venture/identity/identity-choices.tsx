"use client";

import type { ReactNode } from "react";
import type { LaunchpadPickerOption } from "@/lib/launchpad/content/types";
import {
  NAME_INK_HEX,
  type BusinessIdentityAnswer,
  type IdentityField,
  type LogoIconId,
  type LogoShapeId,
  type NameColorId,
  type NameFontId,
} from "@/lib/launchpad/content/identity";
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";
import { IconChip, LogoMark } from "@/components/launchpad/venture/identity/business-logo";
import { NAME_FONT_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";
import type { IdentityChoices } from "@/lib/launchpad/content/identity-content";

/*
 * The choice groups shared by the picker steps and the wrap-up's inline
 * editors. Each is a radiogroup of 44px+ buttons with accessible names.
 */

export type UpdateIdentity = <F extends IdentityField>(field: F, value: NonNullable<BusinessIdentityAnswer[F]>) => void;

const OPTION =
  "flex min-h-11 min-w-11 flex-col items-center justify-center gap-1.5 rounded-2xl bg-white p-2.5 font-heading text-[13px] font-semibold text-nga-ink";
const ring = (on: boolean) => (on ? "shadow-[inset_0_0_0_3px_#0cc1e0] bg-nga-mist" : "shadow-[inset_0_0_0_2px_#bde9fb]");

function Group({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={`flex flex-wrap justify-center gap-2.5 ${className}`}>
      {children}
    </div>
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
  return (
    <Group label="Logo shape">
      {options.map((o) => {
        const on = answer.shape === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            data-option={o.id}
            onClick={() => update("shape", o.id)}
            className={`${OPTION} w-[132px] ${ring(on)}`}
          >
            <LogoMark shape={o.id} color={answer.color ?? VT.ink} size={56} />
            <span>{o.label}</span>
          </button>
        );
      })}
    </Group>
  );
}

export function ColorChoices({
  options,
  answer,
  update,
}: {
  options: readonly (LaunchpadPickerOption & { hex: string })[];
  answer: BusinessIdentityAnswer;
  update: UpdateIdentity;
}) {
  return (
    <Group label="Logo color" className="gap-3">
      {options.map((o) => {
        const on = answer.color?.toUpperCase() === o.hex.toUpperCase();
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            data-option={o.id}
            onClick={() => update("color", o.hex.toUpperCase())}
            className="flex w-14 flex-col items-center gap-1 font-heading text-[12px] font-semibold text-nga-ink"
          >
            <span
              aria-hidden="true"
              className="size-12 rounded-full"
              style={{
                background: o.hex,
                boxShadow: on ? `0 0 0 3px #fff, 0 0 0 6px ${VT.secondary}` : "inset 0 0 0 2px rgba(255,255,255,0.35)",
              }}
            />
            <span>{o.label}</span>
          </button>
        );
      })}
    </Group>
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
  return (
    <Group label="Logo icon">
      {options.map((o) => {
        const on = answer.icon === o.id;
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            data-option={o.id}
            onClick={() => update("icon", o.id)}
            className={`${OPTION} w-[96px] ${ring(on)}`}
          >
            <IconChip icon={o.id} color={answer.color ?? VT.ink} size={52} />
            <span>{o.label}</span>
          </button>
        );
      })}
    </Group>
  );
}

export function NameInput({
  id,
  label,
  placeholderText,
  maxLength,
  answer,
  update,
}: {
  id: string;
  label: string;
  placeholderText?: string;
  maxLength: number;
  answer: BusinessIdentityAnswer;
  update: UpdateIdentity;
}) {
  const value = answer.name ?? "";
  const count = Array.from(value).length;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-heading text-[13px] font-semibold text-nga-slate">
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
        className="min-h-12 w-full rounded-2xl bg-white px-4 font-heading text-lg font-semibold text-nga-ink shadow-[inset_0_0_0_2px_#bde9fb] outline-none focus:shadow-[inset_0_0_0_3px_#0cc1e0]"
      />
      <span id={`${id}-count`} className="self-end text-[12px] text-nga-slate" aria-live="polite">
        {count} of {maxLength} letters
      </span>
    </div>
  );
}

export function FontChoices({
  options,
  answer,
  update,
}: {
  options: readonly LaunchpadPickerOption<NameFontId>[];
  answer: BusinessIdentityAnswer;
  update: UpdateIdentity;
}) {
  const sample = answer.name ?? "Your name";
  return (
    <Group label="Name font" className="flex-col items-stretch">
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
            className={`${OPTION} flex-row justify-between px-4 ${ring(on)}`}
          >
            <span
              className={`${NAME_FONT_CLASS[o.id]} min-w-0 flex-1 truncate text-left text-xl text-nga-ink`}
              aria-hidden="true"
            >
              {sample}
            </span>
            <span className="shrink-0 pl-2 text-nga-slate">{o.label}</span>
          </button>
        );
      })}
    </Group>
  );
}

export function NameColorChoices({
  options,
  answer,
  update,
}: {
  options: readonly LaunchpadPickerOption<NameColorId>[];
  answer: BusinessIdentityAnswer;
  update: UpdateIdentity;
}) {
  // Equal choices: neither is checked until the learner picks one.
  const current = answer.nameColor;
  return (
    <Group label="Name color">
      {options.map((o) => {
        const on = current === o.id;
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
            className={`${OPTION} w-[140px] ${ring(on)}`}
          >
            <span aria-hidden="true" className="size-8 rounded-full" style={{ background: hex }} />
            <span>{o.label}</span>
          </button>
        );
      })}
    </Group>
  );
}

/**
 * The inline editor for one identity field. Shared by the identity wrap-up's
 * tabs and the handbook's edit pencils, so both edit the same saved answer.
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
