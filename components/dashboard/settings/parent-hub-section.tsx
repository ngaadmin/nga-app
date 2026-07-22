"use client";

import { copyMatrix } from "@/constants/copyMatrix";
import { CalendarIcon, ShieldIcon } from "@/lib/dashboard/icons";
import { cn } from "@/lib/utils/cn";
import { ParentConversionRatePanel } from "@/components/dashboard/settings/parent-conversion-rate-panel";
import { ParentCurrencyPanel } from "@/components/dashboard/settings/parent-currency-panel";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

const tealOutlineClass =
  "rounded-nga-lg border-2 border-[#0CC1E0] bg-white px-3 py-2 font-heading text-xs font-bold text-[#031F82] transition-colors hover:bg-[#BDE9FB]/25 active:bg-[#BDE9FB]/40";

type ParentHubSectionProps = {
  isUnlocked: boolean;
  onRequestUnlock: () => void;
  onLock: () => void;
  onOpenBirthYear: () => void;
};

export function ParentHubSection({
  isUnlocked,
  onRequestUnlock,
  onLock,
  onOpenBirthYear,
}: ParentHubSectionProps) {
  const copy = copyMatrix.dashboard.settings.parentHub;

  return (
    <section
      aria-labelledby="parent-hub-heading"
      className={cn(floatingPanelClass, "overflow-hidden")}
    >
      <button
        type="button"
        onClick={isUnlocked ? onLock : onRequestUnlock}
        aria-expanded={isUnlocked}
        aria-controls="parent-hub-panel"
        className={cn(
          "flex w-full items-center gap-3 p-4 text-left transition-all hover:bg-[#BDE9FB]/10",
          isUnlocked && "border-b border-[#BDE9FB]/60",
        )}
      >
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#DCB766]/15 text-[#DCB766]">
          <ShieldIcon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p
            id="parent-hub-heading"
            className="font-heading text-sm font-extrabold text-[#031F82]"
          >
            {copy.title}
          </p>
          <p className="mt-0.5 font-sans text-xs text-[#1E3A5F]">
            {isUnlocked ? copy.unlockedSubtext : copy.lockedSubtext}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 font-heading text-[10px] font-bold uppercase tracking-wide",
            isUnlocked
              ? "bg-[#22C55E]/15 text-[#15803D]"
              : "bg-[#BDE9FB]/35 text-[#0CC1E0]",
          )}
        >
          {isUnlocked ? copy.unlockedBadge : copy.lockedBadge}
        </span>
      </button>

      {isUnlocked ? (
        <div id="parent-hub-panel" className="space-y-5 p-4 pt-3">
          <ParentConversionRatePanel isEditable />

          <div className="border-t border-[#BDE9FB]/60 pt-4">
            <ParentCurrencyPanel isEditable />
          </div>

          <div className="border-t border-[#BDE9FB]/60 pt-4">
            <p className="font-heading text-sm font-extrabold text-[#031F82]">
              {copyMatrix.dashboard.settings.birthYear.modalTitle}
            </p>
            <p className="mt-1 font-sans text-xs leading-relaxed text-[#1E3A5F]">
              {copy.birthYearHint}
            </p>
            <button
              type="button"
              onClick={onOpenBirthYear}
              className={cn("mt-3 inline-flex items-center gap-2", tealOutlineClass)}
            >
              <CalendarIcon className="size-4 text-[#0CC1E0]" />
              {copyMatrix.dashboard.settings.account.birthYearTrack}
            </button>
          </div>

          <button
            type="button"
            onClick={onLock}
            className="w-full rounded-nga-lg px-4 py-2 font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:bg-[#BDE9FB]/40"
          >
            {copy.lockHub}
          </button>
        </div>
      ) : (
        <div id="parent-hub-panel" className="space-y-4 px-4 pb-4">
          <ParentConversionRatePanel isEditable={false} />
          <ParentCurrencyPanel isEditable={false} />
          <button
            type="button"
            onClick={onRequestUnlock}
            className={cn(
              "h-touch w-full rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-4 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2",
            )}
          >
            {copy.unlockButton}
          </button>
        </div>
      )}
    </section>
  );
}
