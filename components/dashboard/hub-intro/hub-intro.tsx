"use client";

import { HubIntroPanel } from "@/components/dashboard/hub-intro/hub-intro-panel";
import { useHubIntro } from "@/components/dashboard/hub-intro/use-hub-intro";
import { hubIntroCopy } from "@/lib/dashboard/hub-intro/copy";
import type { HubIntroId } from "@/lib/dashboard/hub-intro/types";

type HubIntroProps = {
  hubId: HubIntroId;
};

export function HubIntro({ hubId }: HubIntroProps) {
  const { hydrated, seen, open, mode, dismiss, closePanel, reopen } =
    useHubIntro(hubId);
  const copy = hubIntroCopy[hubId];

  return (
    <>
      <div className="mx-auto mb-3 flex w-full max-w-md shrink-0 items-center">
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="min-w-0 font-heading text-lg font-extrabold leading-tight text-[#031F82]">
            {copy.title}
          </h1>
          {hydrated && seen ? (
            <button
              type="button"
              onClick={reopen}
              aria-label={copy.infoButtonAriaLabel}
              className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#0CC1E0] font-heading text-xs font-extrabold text-[#031F82] transition-colors hover:bg-[#F0FBFF]"
            >
              i
            </button>
          ) : null}
        </div>
      </div>
      {open ? (
        <HubIntroPanel
          hubId={hubId}
          mode={mode}
          onDismiss={mode === "first" ? dismiss : closePanel}
        />
      ) : null}
    </>
  );
}
