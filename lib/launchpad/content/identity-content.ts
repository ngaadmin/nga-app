import type {
  LaunchpadLogoPickerScreen,
  LaunchpadNamePickerScreen,
  LaunchpadPickerOption,
  LaunchpadSilver,
  LaunchpadTask,
  LaunchpadTaskScreen,
} from "@/lib/launchpad/content/types";
import {
  BUSINESS_NAME_MAX,
  isIdentityFieldSet,
  type IdentityField,
  type LogoIconId,
  type LogoShapeId,
  type NameColorId,
  type NameFontId,
} from "@/lib/launchpad/content/identity";
import { identityAnswerOf, type LaunchpadAnswers } from "@/lib/launchpad/content/answers";

export type IdentityPickerScreen = LaunchpadLogoPickerScreen | LaunchpadNamePickerScreen;

export function isIdentityPicker(screen: LaunchpadTaskScreen): screen is IdentityPickerScreen {
  return screen.type === "logo-picker" || screen.type === "name-picker";
}

/** The answer field a picker step writes (the step names match the fields). */
export function pickerField(screen: IdentityPickerScreen): IdentityField {
  return screen.step;
}

type IconStep = Extract<LaunchpadLogoPickerScreen, { step: "icon" }>;

/** Icons for this business: its own set, else the screen's fallback set. */
export function iconSetFor(screen: IconStep, ventureId: string): readonly LaunchpadPickerOption<LogoIconId>[] {
  return screen.iconSets[ventureId] ?? screen.iconSets[screen.fallbackVentureId] ?? [];
}

/** True when every identity picker on the task has its pick. Capture screens are gated in task-pages.ts. */
export function isIdentityTaskAnswered(task: Pick<LaunchpadTask, "screens">, answers: LaunchpadAnswers | undefined): boolean {
  return task.screens.every(
    (s) => !isIdentityPicker(s) || isIdentityFieldSet(identityAnswerOf(answers, s.answerKey), pickerField(s)),
  );
}

/** Every choice the identity wrap-up offers for inline editing, gathered from the silver's picker screens. */
export type IdentityChoices = {
  shapes: readonly LaunchpadPickerOption<LogoShapeId>[];
  colors: readonly (LaunchpadPickerOption & { hex: string })[];
  icons: readonly LaunchpadPickerOption<LogoIconId>[];
  fonts: readonly LaunchpadPickerOption<NameFontId>[];
  nameColors: readonly LaunchpadPickerOption<NameColorId>[];
  nameInputLabel: string;
  nameMaxLength: number;
};

export function identityChoices(silver: LaunchpadSilver, answerKey: string, ventureId: string): IdentityChoices {
  const out: IdentityChoices = {
    shapes: [],
    colors: [],
    icons: [],
    fonts: [],
    nameColors: [],
    nameInputLabel: "Business name",
    nameMaxLength: BUSINESS_NAME_MAX,
  };
  for (const b of silver.bronzes)
    for (const t of b.tasks)
      for (const s of t.screens) {
        if (!isIdentityPicker(s) || s.answerKey !== answerKey) continue;
        if (s.type === "logo-picker") {
          if (s.step === "shape") out.shapes = s.options;
          else if (s.step === "color") out.colors = s.options;
          else out.icons = iconSetFor(s, ventureId);
        } else if (s.step === "name") {
          out.nameInputLabel = s.inputLabel;
          out.nameMaxLength = s.maxLength;
        } else if (s.step === "font") out.fonts = s.options;
        else out.nameColors = s.options;
      }
  return out;
}
