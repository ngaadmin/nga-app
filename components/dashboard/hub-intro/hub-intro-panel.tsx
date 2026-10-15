"use client";

import { PageIntroCard } from "@/components/dashboard/hub-intro/page-intro-card";
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

  return (
    <PageIntroCard
      idPrefix={`hub-intro-${hubId}`}
      title={copy.title}
      body={isFirst ? copy.firstVisitBody : copy.infoPanelBody}
      cta={isFirst ? copy.firstVisitCta : copy.infoPanelCta}
      disclaimer={isFirst ? copy.firstVisitDisclaimer : undefined}
      dismissOnBackdrop={!isFirst}
      closeOnEscape={!isFirst}
      onDismiss={onDismiss}
    />
  );
}
