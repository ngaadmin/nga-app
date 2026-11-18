import type { Metadata } from "next";
import { SignUpPendingPanel } from "@/components/onboarding/sign-up-pending-panel";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";
import { copyMatrix } from "@/constants/copyMatrix";

export const metadata: Metadata = {
  title: copyMatrix.onboarding.pendingConsent.heading,
  description: copyMatrix.onboarding.pendingConsent.body,
};

export default function SignUpPendingPage() {
  return (
    <SearchParamsBoundary>
      <SignUpPendingPanel />
    </SearchParamsBoundary>
  );
}
