"use client";

import { ModalShell } from "@/components/ui/modal-shell";
import {
  ACADEMY_MODULE_DESCRIPTIONS,
  ACADEMY_MODULE_TITLES,
  getAcademyPhaseTheme,
  type AcademyLevelId,
} from "@/lib/dashboard/academy-state";
import { skillsForLevel } from "@/lib/skills/skills-registry";
import { cn } from "@/lib/utils/cn";

type AcademyModulePreviewModalProps = {
  moduleNumber: AcademyLevelId;
  isOpen: boolean;
  onClose: () => void;
};

export function AcademyModulePreviewModal({
  moduleNumber,
  isOpen,
  onClose,
}: AcademyModulePreviewModalProps) {
  const phase = getAcademyPhaseTheme(moduleNumber);
  const title = ACADEMY_MODULE_TITLES[moduleNumber];
  const description = ACADEMY_MODULE_DESCRIPTIONS[moduleNumber];
  const moduleSkills = skillsForLevel(moduleNumber);
  const titleId = `academy-module-preview-${moduleNumber}-title`;
  const descriptionId = `academy-module-preview-${moduleNumber}-description`;
  const skillsHeadingId = `academy-module-preview-${moduleNumber}-skills`;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={`${descriptionId} ${skillsHeadingId}`}
      align="center"
      backdropClassName="bg-[#031F82]/50"
      panelClassName="max-w-md rounded-2xl border-0 bg-white p-5 shadow-md sm:p-6"
    >
      <p
        className="font-heading text-sm font-bold uppercase tracking-wide"
        style={{ color: phase.fill }}
      >
        Module {moduleNumber}
      </p>
      <h2
        id={titleId}
        className="mt-2 font-heading text-xl font-extrabold leading-tight text-[#031F82] sm:text-2xl"
      >
        {title}
      </h2>
      <p
        id={descriptionId}
        className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]"
      >
        {description}
      </p>
      <div className="mt-4">
        <h3
          id={skillsHeadingId}
          className="font-heading text-sm font-bold text-[#031F82]"
        >
          Skills you&apos;ll learn in this module:
        </h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 font-sans text-sm leading-relaxed text-[#1E3A5F]">
          {moduleSkills.map((skill) => (
            <li key={skill.skillSlug}>{skill.skillName}</li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={onClose}
        className={cn(
          "mt-5 w-full rounded-nga-lg border-b-4 px-4 py-3 font-heading text-sm font-bold transition-all",
          "active:translate-y-[2px] active:border-b-2",
        )}
        style={{
          backgroundColor: phase.fill,
          borderBottomColor: phase.shadow,
          color: moduleNumber === 3 || moduleNumber === 6 ? "#031F82" : "#ffffff",
        }}
      >
        Got it
      </button>
    </ModalShell>
  );
}
