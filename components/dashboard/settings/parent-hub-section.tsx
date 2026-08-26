"use client";

import { useState } from "react";
import { copyMatrix } from "@/constants/copyMatrix";
import { cn } from "@/lib/utils/cn";
import { ParentHubFeatureItem } from "@/components/dashboard/settings/parent-hub-feature-item";
import { ParentConversionRatePanel } from "@/components/dashboard/settings/parent-conversion-rate-panel";
import {
  formatConversionRateLabel,
} from "@/lib/dashboard/point-conversion";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { useSettingsParentView } from "@/lib/dashboard/testing-settings-view";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

export function ParentHubSection() {
  const featuresCopy = copyMatrix.dashboard.settings.parentHubFeatures;
  const { currencyCode } = useCurrency();
  const { audPer100Xp, xpExchangeRateSet } = useDashboardWallet();
  const isParentSettingsView = useSettingsParentView();
  const conversionRateLabel = formatConversionRateLabel(audPer100Xp, currencyCode);
  const [expanded, setExpanded] = useState(false);

  if (!isParentSettingsView) {
    return null;
  }

  return (
    <section
      aria-label={featuresCopy.pointsConversion}
      className={cn(floatingPanelClass, "overflow-hidden px-3")}
    >
      <ParentHubFeatureItem
        id="preferences-points-conversion"
        title={featuresCopy.pointsConversion}
        summary={
          xpExchangeRateSet
            ? conversionRateLabel
            : featuresCopy.pointsConversionNotSet
        }
        isExpanded={expanded}
        onToggle={() => setExpanded((current) => !current)}
      >
        <ParentConversionRatePanel isEditable />
      </ParentHubFeatureItem>
    </section>
  );
}
