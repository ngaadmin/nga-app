import type { Metadata } from "next";
import { ParentConsentApprovalPanel } from "@/components/onboarding/parent-consent-approval-panel";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";

export const metadata: Metadata = {
  title: "Parent Consent",
  description:
    "Expired Explorer approval links can be resent from this page. Valid links continue to parent account creation.",
};

export default function ParentConsentPage() {
  return (
    <SearchParamsBoundary>
      <ParentConsentApprovalPanel />
    </SearchParamsBoundary>
  );
}
