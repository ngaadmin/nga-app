"use client";

import { saveTestingSettingsView, useSettingsParentView } from "@/lib/dashboard/testing-settings-view";
import { cn } from "@/lib/utils/cn";

/** Temporary testing control: inspect parent-only Settings without a parent signup. */
export function SettingsTestingViewToggle() {
  const isParentView = useSettingsParentView();

  return (
    <section
      aria-label="Testing view"
      className="rounded-2xl border-0 bg-white px-4 py-3 shadow-md"
    >
      <p className="font-heading text-sm font-bold uppercase tracking-wide text-[#8FA3B0]">
        Testing
      </p>
      <p className="mt-1 font-heading text-sm font-extrabold text-[#031F82]">
        Settings view
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => saveTestingSettingsView("child")}
          aria-pressed={!isParentView}
          className={cn(
            "rounded-xl border-2 px-3 py-2 font-heading text-sm font-bold transition-colors",
            !isParentView
              ? "border-[#0CC1E0] bg-[#BDE9FB]/35 text-[#031F82]"
              : "border-[#BDE9FB]/60 bg-white text-[#1E3A5F] hover:border-[#0CC1E0]/50",
          )}
        >
          Child view
        </button>
        <button
          type="button"
          onClick={() => saveTestingSettingsView("parent")}
          aria-pressed={isParentView}
          className={cn(
            "rounded-xl border-2 px-3 py-2 font-heading text-sm font-bold transition-colors",
            isParentView
              ? "border-[#0CC1E0] bg-[#BDE9FB]/35 text-[#031F82]"
              : "border-[#BDE9FB]/60 bg-white text-[#1E3A5F] hover:border-[#0CC1E0]/50",
          )}
        >
          Parent view
        </button>
      </div>
    </section>
  );
}
