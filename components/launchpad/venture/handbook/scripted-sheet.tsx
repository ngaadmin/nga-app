"use client";

import type { ScriptedPart, ScriptedSheet } from "@/lib/launchpad/content/scripted-sheet";
import { ChosenValue } from "@/components/launchpad/venture/handbook/chosen-value";
import { AccentLabel, WORKBOOK_BODY, WORKBOOK_SUB } from "@/components/launchpad/venture/handbook/paper-art";
import { LargeScribble } from "@/components/launchpad/venture/handbook/scribble-mark";
import { BlankSlot, useTemplateBlanks } from "@/components/launchpad/venture/handbook/template-blanks";
import { BudgetSplit } from "@/components/launchpad/venture/handbook/budget-split";

function Part({ part }: { part: ScriptedPart }) {
  const templates = useTemplateBlanks();
  if (typeof part === "string") return <span>{part}</span>;
  if (part.value) return <ChosenValue>{part.value}</ChosenValue>;
  return templates ? <BlankSlot /> : <span>Not answered yet</span>;
}

/** Shared workbook page for a scripted sheet. Level content stays in the payload. */
export function ScriptedSheetPage({ sheet }: { sheet: ScriptedSheet }) {
  return (
    <div data-scripted-sheet={sheet.id}>
      {sheet.blocks.map((block, index) => {
        if (block.kind === "section") return <AccentLabel key={index} as="h2">{block.text}</AccentLabel>;
        if (block.kind === "sub") {
          const mark = block.underline;
          const at = mark ? block.text.indexOf(mark) : -1;
          return (
            <h3 key={index} className={`mt-4 ${WORKBOOK_SUB}`}>
              <span>
                {at >= 0 && mark ? (
                  <>
                    {block.text.slice(0, at)}
                    <span className="text-[#19347D] underline decoration-[#0CC1E0] decoration-[1.5px] underline-offset-[3px]">{mark}</span>
                    {block.text.slice(at + mark.length)}
                  </>
                ) : (
                  block.text
                )}
              </span>
            </h3>
          );
        }
        if (block.kind === "budget") {
          return <BudgetSplit key={index} heading={block.heading} earnedLabel={block.earnedLabel} />;
        }
        if (block.kind === "list") {
          return (
            <ul key={index} className={`mt-2 list-disc pl-5 ${WORKBOOK_BODY}`}>
              {block.items.map((item) => (
                <li key={item}><ChosenValue>{item}</ChosenValue></li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className={`mb-4 ${WORKBOOK_BODY}`}>
            {block.parts.map((part, partIndex) => (
              <Part key={partIndex} part={part} />
            ))}
          </p>
        );
      })}
      {sheet.largeScribble ? <LargeScribble name={sheet.largeScribble} /> : null}
    </div>
  );
}
