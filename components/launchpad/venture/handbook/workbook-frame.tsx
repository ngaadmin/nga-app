"use client";

import type { ReactNode } from "react";
import { resolveNameColor } from "@/lib/launchpad/content/identity";
import { IDENTITY_ANSWER_KEY } from "@/lib/launchpad/content/seed/identity-silver";
import { useIdentityAnswer } from "@/components/launchpad/venture/identity/answers-context";
import { LogoMark, logoMarkLabel } from "@/components/launchpad/venture/identity/business-logo";
import { PAPER_BACKGROUND, SpiralBinding } from "@/components/launchpad/venture/handbook/paper-art";

const NAVY = "#19347D";

/** Logo and business name on the paper. The real venture mark, never a letter. */
function PaperIdentity({ businessName }: { businessName: string }) {
  const { answer } = useIdentityAnswer(IDENTITY_ANSWER_KEY);
  const hasLogo = !!(answer.shape && answer.color && answer.icon);
  const name = answer.name || businessName;
  if (!hasLogo && !name) return null;
  return (
    <div className="mb-3 flex items-center gap-2" data-paper-identity="">
      {hasLogo && (
        <LogoMark shape={answer.shape} color={answer.color} icon={answer.icon} size={24} label={logoMarkLabel(answer)} />
      )}
      {name && (
        <span className="truncate font-heading text-[15px] font-semibold" style={{ color: answer.name ? resolveNameColor(answer) : "#19347D" }}>
          {name}
        </span>
      )}
    </div>
  );
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

/**
 * Workbook chrome for a lesson page: cream spiral, L1-L6 tabs, paired arrows, and a footer.
 * The selected level is the one the learner is in. Later levels stay muted.
 */
export function WorkbookFrame({
  businessName,
  level,
  marker,
  canBack,
  canForward,
  onBack,
  onForward,
  footer,
  marks,
  children,
}: {
  businessName: string;
  level: number;
  marker?: string;
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
  footer: ReactNode;
  /** Scribbles pinned to the paper, in 390×844 phone pixels. */
  marks?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-white text-[#111827]" data-workbook-frame="">
      <header className="flex h-14 flex-none items-center gap-2 px-3">
        <div className="min-w-0">
          <h1 className="font-heading text-[17px] font-semibold leading-tight text-[#111827]">My workbook</h1>
          <p className="truncate text-[13px] text-[#6B7280]">{businessName}</p>
        </div>
      </header>
      <div className="relative min-h-0 flex-1 px-[11px]">
        <div className="relative h-full overflow-hidden rounded-2xl border border-[#EDE7DC]" style={{ background: PAPER_BACKGROUND }} data-paper-card="">
          <SpiralBinding />
          {marks}
          <div className="h-full overflow-x-hidden overflow-y-auto pb-2 pl-11 pr-4 pt-6">
            <PaperIdentity businessName={businessName} />
            {children}
          </div>
          {marker && <p className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-[#9CA3AF]">{marker}</p>}
        </div>
      </div>
      <div className="relative z-raised -mt-1.5 flex flex-none items-end gap-2 px-3 pb-1">
        <div className="grid w-1/2 grid-cols-6 gap-1" aria-label="Workbook floors">
          {[1, 2, 3, 4, 5, 6].map((n) => {
            const selected = n === level;
            const muted = n > level;
            return (
              <span
                key={n}
                aria-current={selected ? "page" : undefined}
                className={`flex h-11 items-center justify-center rounded-b-[3px] rounded-t-none border text-[12px] font-semibold ${
                  selected ? "border-[#19347D] bg-white text-[#19347D]" : muted ? "border-[#E5E7EB] bg-[#F7F5F1] text-[#C4C0B8]" : "border-[#E7E1D6] bg-[#F3EFE6] text-[#6B645C]"
                }`}
              >
                L{n}
              </span>
            );
          })}
        </div>
        <div className="flex gap-1">
          <button type="button" aria-label="Previous page" disabled={!canBack} onClick={onBack} className="flex size-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#374151] disabled:opacity-40">
            <Arrow dir="left" />
          </button>
          <button type="button" aria-label="Next page" disabled={!canForward} onClick={onForward} className="flex size-9 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#374151] disabled:opacity-40">
            <Arrow dir="right" />
          </button>
        </div>
      </div>
      <div className="flex flex-none justify-center px-4 pb-4 pt-1">{footer}</div>
    </div>
  );
}

export function ContinueButton({ disabled, onClick, children = "Continue" }: { disabled?: boolean; onClick: () => void; children?: string }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-11 min-w-[148px] rounded-full px-6 text-[15px] font-semibold text-white disabled:opacity-40"
      style={{ background: NAVY }}
    >
      {children}
    </button>
  );
}

export const ART = {
  beagle: "/launchpad/workbook/beagle.png",
  ticket: "/launchpad/workbook/paw-ticket.png",
  kit: "/launchpad/workbook/startup-kit.png",
  coins: "/launchpad/workbook/coin-stack.png",
  wallet: "/launchpad/workbook/wallet.png",
  growth: "/launchpad/workbook/growth-chart.png",
  jar: "/launchpad/workbook/jar.png",
  pennyThinking: "/launchpad/workbook/penny-thinking.png",
  pennyJourney: "/launchpad/workbook/penny-journey.png",
  pennyMaster: "/launchpad/workbook/penny-master.png",
  pennyProtip: "/launchpad/workbook/penny-protip.png",
} as const;

export function Sticker({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} width={96} height={96} className={`h-auto w-[96px] max-w-none shrink-0 object-contain ${className}`} />;
}
