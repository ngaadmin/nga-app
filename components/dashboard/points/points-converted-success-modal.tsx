"use client";

import { ModalShell } from "@/components/ui/modal-shell";
import { cn } from "@/lib/utils/cn";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2";

type PointsConvertedSuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body: string;
  acknowledgeLabel: string;
};

export function PointsConvertedSuccessModal({
  isOpen,
  onClose,
  title,
  body,
  acknowledgeLabel,
}: PointsConvertedSuccessModalProps) {
  if (!isOpen) return null;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      layer="toast"
      labelledBy="points-converted-title"
      backdropClassName="bg-[#031F82]/50"
      panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md sm:p-6"
    >
      <h2
        id="points-converted-title"
        className="font-heading text-xl font-extrabold leading-tight text-[#031F82] sm:text-2xl"
      >
        {title}
      </h2>
      <p className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]">
        {body}
      </p>
      <button
        type="button"
        onClick={onClose}
        className={cn("mt-5 h-touch w-full px-6 shadow-md", orangeCtaClass)}
      >
        {acknowledgeLabel}
      </button>
    </ModalShell>
  );
}
