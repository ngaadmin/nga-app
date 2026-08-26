"use client";

import { useEffect } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { hubIntroCopy } from "@/lib/dashboard/hub-intro/copy";
import type { HubIntroId } from "@/lib/dashboard/hub-intro/types";

type HubIntroPanelProps = {
  hubId: HubIntroId;
  mode: "first" | "info";
  onDismiss: () => void;
};

export function HubIntroPanel({ hubId, mode, onDismiss }: HubIntroPanelProps) {
  const copy = hubIntroCopy[hubId];
  const isFirst = mode === "first";
  const body = isFirst ? copy.firstVisitBody : copy.infoPanelBody;
  const cta = isFirst ? copy.firstVisitCta : copy.infoPanelCta;
  const disclaimer = isFirst ? copy.firstVisitDisclaimer : undefined;
  const titleId = `hub-intro-${hubId}-title`;
  const bodyId = `hub-intro-${hubId}-body`;
  const disclaimerId = disclaimer ? `hub-intro-${hubId}-disclaimer` : undefined;

  useEffect(() => {
    if (isFirst) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onDismiss();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isFirst, onDismiss]);

  return (
    <ModalShell
      isOpen
      onClose={isFirst ? undefined : onDismiss}
      dismissOnBackdrop={!isFirst}
      align="center"
      labelledBy={titleId}
      describedBy={disclaimerId ? `${bodyId} ${disclaimerId}` : bodyId}
      backdropClassName="bg-[#031F82]/15"
      panelClassName="rounded-nga-xl bg-white p-5 shadow-nga-card"
    >
      <h2
        id={titleId}
        className="font-heading text-xl font-extrabold leading-tight text-[#031F82]"
      >
        {copy.title}
      </h2>
      <p
        id={bodyId}
        className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]"
      >
        {body}
      </p>
      {disclaimer ? (
        <p
          id={disclaimerId}
          className="mt-3 font-sans text-xs leading-relaxed text-[#1E3A5F]/70"
        >
          {disclaimer}
        </p>
      ) : null}
      <button
        type="button"
        onClick={onDismiss}
        className="mt-5 inline-flex h-touch min-h-touch w-full items-center justify-center rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-6 font-heading text-sm font-bold text-[#031F82] shadow-sm transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2"
      >
        {cta}
      </button>
    </ModalShell>
  );
}
