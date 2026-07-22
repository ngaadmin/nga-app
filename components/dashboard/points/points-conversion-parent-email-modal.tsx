"use client";

import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import type { PointsConversionEmailDispatch } from "@/lib/dashboard/points-conversion-email";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2";

type PointsConversionParentEmailModalProps = {
  isOpen: boolean;
  dispatch: PointsConversionEmailDispatch | null;
  onClose: () => void;
};

export function PointsConversionParentEmailModal({
  isOpen,
  dispatch,
  onClose,
}: PointsConversionParentEmailModalProps) {
  const copy = copyMatrix.dashboard.settings.conversion.parentEmail;

  if (!isOpen || !dispatch) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      layer="toast"
      labelledBy="points-parent-email-title"
      backdropClassName="bg-[#031F82]/50"
      panelClassName="max-w-sm rounded-2xl border-0 bg-white p-5 shadow-md sm:p-6"
    >
      <p className="font-heading text-xs font-bold uppercase tracking-wide text-[#0CC1E0]">
        {copy.draftLabel}
      </p>
      <h2
        id="points-parent-email-title"
        className="mt-2 font-heading text-lg font-extrabold text-[#031F82]"
      >
        {copy.title}
      </h2>
      <p className="mt-1 font-sans text-xs leading-relaxed text-[#1E3A5F]">
        {copy.body}
      </p>

      <div className="mt-4 space-y-2 rounded-xl bg-[#F7FBFF] p-3 font-sans text-xs text-[#031F82]">
        <p>
          <span className="font-heading font-bold text-[#0CC1E0]">{copy.toLabel}</span>{" "}
          {dispatch.parentEmail}
        </p>
        <p>
          <span className="font-heading font-bold text-[#0CC1E0]">{copy.subjectLabel}</span>{" "}
          {dispatch.subject}
        </p>
        <pre
          className={cn(
            "mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-3 text-[11px] leading-relaxed text-[#1E3A5F] shadow-sm",
          )}
        >
          {dispatch.body}
        </pre>
      </div>

      <button
        type="button"
        onClick={onClose}
        className={cn("mt-4 h-touch w-full px-6 shadow-md", orangeCtaClass)}
      >
        {copy.acknowledge}
      </button>
    </ModalShell>
  );
}
