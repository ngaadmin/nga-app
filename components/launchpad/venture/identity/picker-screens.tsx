"use client";

import type { LaunchpadLogoPickerScreen, LaunchpadNamePickerScreen } from "@/lib/launchpad/content/types";
import { iconSetFor } from "@/lib/launchpad/content/identity-content";
import { useIdentityAnswer } from "@/components/launchpad/venture/identity/answers-context";
import { BusinessLogo } from "@/components/launchpad/venture/identity/business-logo";
import {
  ColorChoices,
  FontChoices,
  IconChoices,
  NameColorChoices,
  NameInput,
  ShapeChoices,
} from "@/components/launchpad/venture/identity/identity-choices";

const PREVIEW = "flex min-h-[156px] items-center justify-center rounded-3xl bg-white px-4 py-3 shadow-[inset_0_0_0_2px_#e3eef5]";

/**
 * Task screen "logo-picker": one step of the logo builder (shape, color or
 * icon) with the live logo preview on top. Picks save straight into the
 * learner's answer, so Previous / Next go back and change freely.
 */
export function LogoPickerScreen({ screen }: { screen: LaunchpadLogoPickerScreen }) {
  const { answer, update, iconVentureId } = useIdentityAnswer(screen.answerKey);
  return (
    <div data-task-screen="logo-picker" data-step={screen.step} className="mx-5 mb-4 flex flex-col gap-4">
      <div className={PREVIEW} aria-label="Logo preview" role="group">
        <BusinessLogo answer={answer} showName={false} />
      </div>
      {screen.heading && <h3 className="font-heading text-base font-bold text-nga-ink">{screen.heading}</h3>}
      <p className="text-center text-base text-nga-slate">{screen.prompt}</p>
      {screen.step === "shape" && <ShapeChoices options={screen.options} answer={answer} update={update} />}
      {screen.step === "color" && <ColorChoices options={screen.options} answer={answer} update={update} />}
      {screen.step === "icon" && (
        <IconChoices options={iconSetFor(screen, iconVentureId)} answer={answer} update={update} />
      )}
    </div>
  );
}

/**
 * Task screen "name-picker": one step of naming the business (name, font,
 * then name color last) with the live logo and name on top.
 */
export function NamePickerScreen({ screen }: { screen: LaunchpadNamePickerScreen }) {
  const { answer, update } = useIdentityAnswer(screen.answerKey);
  return (
    <div data-task-screen="name-picker" data-step={screen.step} className="mx-5 mb-4 flex flex-col gap-4">
      <div className={PREVIEW} aria-label="Logo preview" role="group">
        <BusinessLogo answer={answer} size="md" namePlaceholder="Your business name" />
      </div>
      {screen.heading && <h3 className="font-heading text-base font-bold text-nga-ink">{screen.heading}</h3>}
      <p className="text-center text-base text-nga-slate">{screen.prompt}</p>
      {screen.step === "name" && (
        <NameInput
          id={`${screen.id}-input`}
          label={screen.inputLabel}
          placeholderText={screen.placeholderText}
          maxLength={screen.maxLength}
          answer={answer}
          update={update}
        />
      )}
      {screen.step === "font" && <FontChoices options={screen.options} answer={answer} update={update} />}
      {screen.step === "nameColor" && <NameColorChoices options={screen.options} answer={answer} update={update} />}
    </div>
  );
}
