"use client";

import type { LaunchpadChoiceCaptureScreen } from "@/lib/launchpad/content/types";
import { selectionAnswer, selectionOf } from "@/lib/launchpad/content/answers";
import { LessonChoiceButton } from "@/components/academy/lesson/lesson-choice-button";
import { useCaptureAnswer } from "@/components/launchpad/venture/identity/answers-context";
import { ScreenGuidance, ScreenIntro, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";

/** Next selection after tapping `id`: single replaces, multi toggles (keeping pick order). */
export function toggleChoice(mode: "single" | "multi", selected: readonly string[], id: string): string[] {
  if (mode === "single") return [id];
  return selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
}

/**
 * Choice capture (single or multi). There are no wrong answers: a pick shows
 * the selected state only (no ticks, no feedback). Reuses the Academy choice tile.
 */
export function ChoiceCaptureScreen({ screen }: { screen: LaunchpadChoiceCaptureScreen }) {
  const { answers, save } = useCaptureAnswer(screen.answerKey);
  const selected = selectionOf(answers, screen.answerKey)?.selected ?? [];
  const promptId = `${screen.id}-prompt`;
  return (
    <div className="flex flex-col" data-screen-type="choice-capture" data-mode={screen.mode}>
      {screen.context && <ScreenIntro context={screen.context} guidance={screen.guidance} />}
      <ScreenPrompt id={promptId}>{screen.prompt}</ScreenPrompt>
      {screen.guidance && !screen.context && <ScreenGuidance>{screen.guidance}</ScreenGuidance>}
      <div role="group" aria-labelledby={promptId} className="mx-5 mb-4 mt-4 flex flex-col gap-2.5">
        {screen.options.map((o) => (
          <LessonChoiceButton
            key={o.id}
            selected={selected.includes(o.id)}
            onClick={() => save(selectionAnswer(toggleChoice(screen.mode, selected, o.id)))}
            className="!min-h-[54px] !text-[16px]"
          >
            {o.label}
          </LessonChoiceButton>
        ))}
      </div>
    </div>
  );
}
