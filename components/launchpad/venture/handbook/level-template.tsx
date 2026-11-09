"use client";

import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { fieldsOf } from "@/lib/launchpad/content/answers";
import { displayFieldValue, fieldByName } from "@/lib/launchpad/content/fields";
import { selectionLabels, sourceLinesOf, summaryCatalog, type SummaryCatalog } from "@/lib/launchpad/content/summary";
import type { LaunchpadSummarySection, LaunchpadSummarySource } from "@/lib/launchpad/content/types";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { ChosenValue } from "@/components/launchpad/venture/handbook/chosen-value";
import { AccentLabel, HandRule, WORKBOOK_BODY } from "@/components/launchpad/venture/handbook/paper-art";
import { BlankSlot } from "@/components/launchpad/venture/handbook/template-blanks";

const lowerFirst = (value: string) => (value ? value.charAt(0).toLowerCase() + value.slice(1) : value);

function filledOrBlank(shown: string) {
  return shown ? <ChosenValue>{shown}</ChosenValue> : <BlankSlot />;
}

function SourceTemplate({
  section,
  source,
  answers,
  catalog,
}: {
  section: LaunchpadSummarySection;
  source: LaunchpadSummarySource;
  answers: LaunchpadAnswers | undefined;
  catalog: SummaryCatalog;
}) {
  const screen = catalog.get(source.answerKey);
  if (screen?.type === "short-text") {
    const answer = fieldsOf(answers, screen.answerKey);
    const skipped = answer?.notApplicable && screen.notApplicableLabel;
    return (
      <p>
        {screen.parts.map((part, index) => {
          if (part.kind === "text") return <span key={index}>{part.text}</span>;
          if (part.kind === "carried") {
            const label = skipped ? "" : selectionLabels(catalog, answers, part.answerKey)[0];
            return <span key={index}>{label ? <ChosenValue>{lowerFirst(label)}</ChosenValue> : <BlankSlot />}</span>;
          }
          const field = fieldByName(screen, part.field);
          const raw = skipped ? undefined : answer?.values[part.field];
          const shown = field && raw !== undefined && raw !== "" ? displayFieldValue(field, raw) : "";
          return <span key={index}>{filledOrBlank(shown)}</span>;
        })}
      </p>
    );
  }
  const lines = sourceLinesOf(section, source, answers, catalog);
  if (lines.length) {
    return (
      <p>
        <ChosenValue>{lines.join(", ")}</ChosenValue>
      </p>
    );
  }
  const prompt = screen && "prompt" in screen ? screen.prompt : undefined;
  return (
    <p>
      {prompt ? <span>{prompt} </span> : null}
      <BlankSlot />
    </p>
  );
}

/** A level's sections with their authored wording, blanks left open until an answer is saved. */
export function LevelTemplateSections({ sections }: { sections: readonly LaunchpadSummarySection[] }) {
  const ctx = useLaunchpadAnswers();
  const catalog = summaryCatalog(ctx?.floors ?? []);
  return (
    <>
      {sections.map((section) => (
        <div key={section.id} data-handbook-section={section.id} data-template-section="">
          <HandRule />
          <AccentLabel>{section.label}</AccentLabel>
          <div className={`mt-3 flex flex-col gap-2 ${WORKBOOK_BODY}`}>
            {section.sources.length === 0 ? (
              <p>
                <BlankSlot />
              </p>
            ) : (
              section.sources.map((source) => (
                <SourceTemplate key={source.answerKey} section={section} source={source} answers={ctx?.answers} catalog={catalog} />
              ))
            )}
          </div>
        </div>
      ))}
    </>
  );
}
