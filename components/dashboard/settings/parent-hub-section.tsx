"use client";

import { useState } from "react";
import { ParentPinGate } from "@/components/parent/parent-pin-gate";
import { copyMatrix } from "@/constants/copyMatrix";
import { cn } from "@/lib/utils/cn";
import { ParentHubFeatureItem } from "@/components/dashboard/settings/parent-hub-feature-item";
import { ParentConversionRatePanel } from "@/components/dashboard/settings/parent-conversion-rate-panel";
import {
  formatConversionRateLabel,
} from "@/lib/dashboard/point-conversion";
import { useCurrency } from "@/lib/dashboard/currency-context";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { useUserSession } from "@/lib/dashboard/use-user-session";
import { useSettingsParentView } from "@/lib/dashboard/use-settings-parent-view";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

/**
 * Settings: the coins cash rate. For a parent it sits behind the Parent Hub PIN
 * (checked on the server, asked each time the section opens). Paying out
 * ("Mark as paid") lives only in the Parent Hub.
 */
export function ParentHubSection() {
  const featuresCopy = copyMatrix.dashboard.settings.parentHubFeatures;
  const { currencyCode } = useCurrency();
  const { audPer100Xp, xpExchangeRateSet } = useDashboardWallet();
  const session = useUserSession();
  const isParentSettingsView = useSettingsParentView();
  const isParentMaster = session?.accountRole === "parent_master";
  const conversionRateLabel = formatConversionRateLabel(audPer100Xp, currencyCode);
  const summary = isParentMaster
    ? featuresCopy.pointsConversionSummaryLocked
    : xpExchangeRateSet
      ? conversionRateLabel
      : featuresCopy.pointsConversionNotSet;
  const [expanded, setExpanded] = useState(false);
  /** Parent PIN pass for this open section only. Dropped when it closes. */
  const [pinPass, setPinPass] = useState<string | null>(null);

  if (!isParentSettingsView) {
    return null;
  }

  return (
    <section
      aria-label={featuresCopy.pointsConversion}
      className={cn(floatingPanelClass, "shrink-0 overflow-hidden px-3")}
    >
      <ParentHubFeatureItem
        id="preferences-points-conversion"
        title={featuresCopy.pointsConversion}
        summary={summary}
        isExpanded={expanded}
        onToggle={() => {
          setPinPass(null);
          setExpanded((current) => !current);
        }}
      >
        {isParentMaster && !pinPass ? (
          <div data-cash-rate-pin-gate>
            <ParentPinGate
              parentName=""
              className="mx-0 mt-1 px-0 pb-1 pt-2 shadow-none"
              enterBody="Enter your Parent Hub PIN to see or change the cash rate."
              onUnlocked={(pass) => setPinPass(pass)}
            />
          </div>
        ) : (
          <ParentConversionRatePanel isEditable parentPinPass={pinPass} />
        )}
      </ParentHubFeatureItem>
    </section>
  );
}
