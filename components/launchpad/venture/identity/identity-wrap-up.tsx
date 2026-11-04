"use client";

import { useState } from "react";
import type { LaunchpadIdentityWrapUp } from "@/lib/launchpad/content/types";
import type { IdentityChoices } from "@/lib/launchpad/content/identity-content";
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";
import { BTN_ORANGE, Heading, SubLine, TrailCrumb } from "@/components/launchpad/venture-test/venture-test-ui";
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

const EDITORS = [
  { id: "shape", label: "Shape" },
  { id: "color", label: "Color" },
  { id: "icon", label: "Icon" },
  { id: "name", label: "Name" },
  { id: "font", label: "Font" },
  { id: "nameColor", label: "Name color" },
] as const;
type EditorId = (typeof EDITORS)[number]["id"];

/**
 * Silver wrap-up "identity-wrap-up": the learner's one logo, drawn from the
 * saved answer, with every pick editable right here (edits save to the same
 * answer and the learner stays on this screen). Finalize marks it done.
 * The frame is a PLACEHOLDER pending Jasper's wrap-up art.
 */
export function IdentityWrapUp({
  level,
  silverTitle,
  wrapUp,
  choices,
  onBuilding,
  onCorridor,
  onFinalize,
}: {
  level: number;
  silverTitle: string;
  wrapUp: LaunchpadIdentityWrapUp;
  choices: IdentityChoices;
  onBuilding: () => void;
  onCorridor: () => void;
  onFinalize: () => void;
}) {
  const { answer, update, save } = useIdentityAnswer(wrapUp.answerKey);
  const [editor, setEditor] = useState<EditorId>("shape");
  return (
    <section className="flex flex-1 flex-col" data-wrap-up="identity">
      <TrailCrumb level={level} current={silverTitle} onBuilding={onBuilding} onCorridor={onCorridor} />
      <Heading>{wrapUp.heading}</Heading>
      {wrapUp.body && <SubLine className="mb-3">{wrapUp.body}</SubLine>}

      <div
        className="relative mx-5 flex min-h-[230px] items-center justify-center rounded-3xl bg-white px-4 py-5"
        style={wrapUp.placeholder ? { border: `3px dashed ${VT.panel}` } : undefined}
        data-placeholder-frame={wrapUp.placeholder ? "" : undefined}
      >
        {wrapUp.placeholder && (
          <span className="absolute right-3 top-2 font-heading text-[11px] font-semibold text-nga-slate">Frame art TBC</span>
        )}
        <BusinessLogo answer={answer} namePlaceholder="Your business name" />
      </div>

      <div role="tablist" aria-label="Change a part of your logo" className="mx-5 mt-4 grid grid-cols-3 gap-2">
        {EDITORS.map((e) => {
          const on = editor === e.id;
          return (
            <button
              key={e.id}
              type="button"
              role="tab"
              id={`wrapup-tab-${e.id}`}
              aria-selected={on}
              aria-controls="wrapup-editor"
              onClick={() => setEditor(e.id)}
              className={`min-h-11 rounded-full font-heading text-[13px] font-bold ${
                on ? "bg-nga-secondary text-white" : "bg-white text-nga-ink shadow-[inset_0_0_0_2px_#bde9fb]"
              }`}
            >
              {e.label}
            </button>
          );
        })}
      </div>

      <div id="wrapup-editor" role="tabpanel" aria-labelledby={`wrapup-tab-${editor}`} className="mx-5 mb-4 mt-4" data-editor={editor}>
        {editor === "shape" && <ShapeChoices options={choices.shapes} answer={answer} update={update} />}
        {editor === "color" && <ColorChoices options={choices.colors} answer={answer} update={update} />}
        {editor === "icon" && <IconChoices options={choices.icons} answer={answer} update={update} />}
        {editor === "name" && (
          <NameInput
            id="wrapup-name"
            label={choices.nameInputLabel}
            maxLength={choices.nameMaxLength}
            answer={answer}
            update={update}
          />
        )}
        {editor === "font" && <FontChoices options={choices.fonts} answer={answer} update={update} />}
        {editor === "nameColor" && <NameColorChoices options={choices.nameColors} answer={answer} update={update} />}
      </div>

      <div className="mx-5 mt-auto pb-4">
        <button
          type="button"
          className={`${BTN_ORANGE} w-full`}
          onClick={() => {
            save({ ...answer, finalized: true });
            onFinalize();
          }}
        >
          {wrapUp.finalizeLabel}
        </button>
      </div>
    </section>
  );
}
