import type { Metadata } from "next";
import { ParentConsentApprovalPanel } from "@/components/onboarding/parent-consent-approval-panel";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";

export const metadata: Metadata = {
  title: "Parent Consent",
  description:
    "Parent or guardian approval for Explorer accounts under 14.",
};

export default function ParentConsentPage() {
  return (
    <SearchParamsBoundary>
      <ParentConsentApprovalPanel />
    </SearchParamsBoundary>
  );
}
