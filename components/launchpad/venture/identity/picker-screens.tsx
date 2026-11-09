"use client";

import { useState } from "react";
import type { LaunchpadLogoPickerScreen, LaunchpadNamePickerScreen, LaunchpadTaskScreen } from "@/lib/launchpad/content/types";
import { isIdentityFieldSet, type BusinessIdentityAnswer } from "@/lib/launchpad/content/identity";
import { iconSetFor } from "@/lib/launchpad/content/identity-content";
import { useIdentityAnswer } from "@/components/launchpad/venture/identity/answers-context";
import { LogoMark, logoMarkLabel } from "@/components/launchpad/venture/identity/business-logo";
import {
  ColorChoices,
  FontChoices,
  IconChoices,
  NameColorChoices,
  NameInput,
  SectionHeading,
  Segmented,
  ShapeChoices,
  type UpdateIdentity,
} from "@/components/launchpad/venture/identity/identity-choices";

type LogoStep = LaunchpadLogoPickerScreen["step"];

const TAB_LABEL: Record<LogoStep, string> = { shape: "Shape", color: "Color", icon: "Icon" };

/** Which grouped identity page a task is: every screen a logo picker, every screen a name picker, or neither. */
export function identityTaskKind(screens: readonly LaunchpadTaskScreen[]): "logo" | "name" | null {
  if (screens.length > 1 && screens.every((s) => s.type === "logo-picker")) return "logo";
  if (screens.length > 1 && screens.every((s) => s.type === "name-picker")) return "name";
  return null;
}

function LogoStepChoices({
  screen,
  answer,
  update,
  iconVentureId,
}: {
  screen: LaunchpadLogoPickerScreen;
  answer: BusinessIdentityAnswer;
  update: UpdateIdentity;
  iconVentureId: string;
}) {
  if (screen.step === "shape") return <ShapeChoices options={screen.options} answer={answer} update={update} />;
  if (screen.step === "color") return <ColorChoices options={screen.options} answer={answer} update={update} />;
  return <IconChoices options={iconSetFor(screen, iconVentureId)} answer={answer} update={update} />;
}

/**
 * The logo builder (r8): one page with the live logo in a hero card, then
 * Shape, Color and Icon tabs. Every logo is Split style; there is no style or
 * layer choice. After a pick it moves on to the next tab if that one is not
 * picked yet. The workbook's forward button stays off until all three are set.
 */
export function LogoBuilder({ screens }: { screens: readonly LaunchpadLogoPickerScreen[] }) {
  const answerKey = screens[0]!.answerKey;
  const { answer, update, iconVentureId } = useIdentityAnswer(answerKey);
  const [tab, setTab] = useState<LogoStep>(() => screens.find((s) => !isIdentityFieldSet(answer, s.step))?.step ?? screens[0]!.step);
  const screen = screens.find((s) => s.step === tab) ?? screens[0]!;
  const pick: UpdateIdentity = (field, value) => {
    update(field, value);
    const i = screens.findIndex((s) => s.step === field);
    const next = screens[i + 1];
    if (next && !isIdentityFieldSet(answer, next.step)) setTab(next.step);
  };
  return (
    <div data-task-screen="logo-builder" data-step={tab} className="mx-6 mb-4 flex flex-col">
      <p className="font-sans text-[16px] font-normal leading-[23px] text-[#4A5568]" data-lede="">
        {screen.prompt}
      </p>
      <div
        role="group"
        aria-label="Logo preview"
        className="mt-5 flex h-[248px] items-center short:mt-3 short:h-[196px] justify-center rounded-3xl bg-[#F9FAFB]"
        data-logo-hero=""
      >
        <LogoMark shape={answer.shape} color={answer.color} icon={answer.icon} size={164} label={logoMarkLabel(answer)} />
      </div>
      <div className="mt-6 short:mt-4">
        <Segmented
          label="Logo parts"
          items={screens.map((s) => ({ id: s.step, label: TAB_LABEL[s.step] }))}
          value={tab}
          onChange={setTab}
          idPrefix={`${screens[0]!.id}-tab`}
          panelId={`${screens[0]!.id}-panel`}
        />
      </div>
      <div id={`${screens[0]!.id}-panel`} role="tabpanel" aria-labelledby={`${screens[0]!.id}-tab-${tab}`} className="mt-7 short:mt-4">
        <LogoStepChoices screen={screen} answer={answer} update={pick} iconVentureId={iconVentureId} />
      </div>
    </div>
  );
}

function NameSection({ screen, answer, update }: { screen: LaunchpadNamePickerScreen; answer: BusinessIdentityAnswer; update: UpdateIdentity }) {
  const headingId = `${screen.id}-heading`;
  return (
    <section className="mt-[30px] first:mt-2 short:mt-4 short:first:mt-1" data-step={screen.step} aria-labelledby={headingId}>
      <SectionHeading id={headingId}>{screen.heading ?? screen.prompt}</SectionHeading>
      {screen.step === "name" && (
        <NameInput
          id={`${screen.id}-input`}
          label={screen.inputLabel}
          placeholderText={screen.placeholderText}
          maxLength={screen.maxLength}
          answer={answer}
          update={update}
          visibleLabel={false}
        />
      )}
      {screen.step === "font" && <FontChoices options={screen.options} answer={answer} update={update} labelledBy={headingId} />}
      {screen.step === "nameColor" && (
        <NameColorChoices options={screen.options} answer={answer} update={update} labelledBy={headingId} />
      )}
    </section>
  );
}

/**
 * The name screen (r10): name field with a letter counter, font rows (each
 * label drawn in its own font) and font color rows, all on one page. Neither
 * color is preselected; until one is picked the name renders in dark ink.
 */
export function NameForm({ screens }: { screens: readonly LaunchpadNamePickerScreen[] }) {
  const { answer, update } = useIdentityAnswer(screens[0]!.answerKey);
  return (
    <div data-task-screen="name-form" className="mx-6 mb-4 flex flex-col short:mb-1">
      {screens.map((s) => (
        <NameSection key={s.id} screen={s} answer={answer} update={update} />
      ))}
    </div>
  );
}

/** Task screen "logo-picker" on its own (a task holding one step): the same builder with one tab. */
export function LogoPickerScreen({ screen }: { screen: LaunchpadLogoPickerScreen }) {
  return <LogoBuilder screens={[screen]} />;
}

/** Task screen "name-picker" on its own (a task holding one step). */
export function NamePickerScreen({ screen }: { screen: LaunchpadNamePickerScreen }) {
  return <NameForm screens={[screen]} />;
}
