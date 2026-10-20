"use client";

import { AnswerEmoji } from "@/components/academy/lesson/answer-emoji";
import { useCompletedHubSkills } from "@/components/academy/lesson/lesson-hub-progress";
import { lessonNextButtonClass } from "@/components/academy/lesson/lesson-shared-styles";
import { LessonScreenLayout } from "@/components/academy/lesson/lesson-ui";
import type { SkillHubScreenConfig } from "@/lib/academy/lessons/types";
import { cn } from "@/lib/utils/cn";
import type { CoreScreenProps } from "./types";

export function SkillHubScreen({
  screen,
  flow,
}: CoreScreenProps<SkillHubScreenConfig>) {
  const completed = useCompletedHubSkills();
  const doneCount = screen.skills.filter((skill) => completed.has(skill.hubSkillKey)).length;
  const allDone = screen.skills.length > 0 && doneCount === screen.skills.length;

  return (
    <LessonScreenLayout prompt={screen.prompt}>
      <p className="mt-2 font-sans text-base font-semibold text-[#1E3A5F]">
        {doneCount} of {screen.skills.length} skills done
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {screen.skills.map((skill) => {
          const done = completed.has(skill.hubSkillKey);
          return (
            <button
              key={skill.hubSkillKey}
              type="button"
              onClick={() => {
                if (typeof skill.goToIndex === "number") {
                  flow.setScreenIndex(skill.goToIndex);
                }
              }}
              data-selection={done ? "selected" : undefined}
              className="lesson-choice-tile flex min-h-[60px] w-full items-center gap-3.5 rounded-full bg-transparent px-3.5 py-2 text-left active:scale-[0.99]"
            >
              <AnswerEmoji emoji={skill.emoji ?? "⭐"} />
              <span className="min-w-0 flex-1 font-heading text-[20px] font-extrabold leading-snug text-[#031F82]">
                {skill.label}
              </span>
              {done ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-[#FFB822] px-2.5 py-1 font-heading text-sm font-extrabold text-[#031F82]">
                  <span aria-hidden>✓</span>
                  Done
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        disabled={!allDone}
        onClick={() => {
          if (!allDone) return;
          if (typeof screen.finishToIndex === "number") {
            flow.setScreenIndex(screen.finishToIndex);
            return;
          }
          flow.handleNext({ canAdvance: true });
        }}
        className={cn(lessonNextButtonClass, "mt-6 w-full max-w-none")}
      >
        {screen.finishLabel}
      </button>
    </LessonScreenLayout>
  );
}
