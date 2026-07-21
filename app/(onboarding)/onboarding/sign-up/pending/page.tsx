import type { Metadata } from "next";
import { SignUpPendingPanel } from "@/components/onboarding/sign-up-pending-panel";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";

export const metadata: Metadata = {
  title: "Waiting for Parent Approval",
  description:
    "Your parent or guardian needs to approve your Explorer account.",
};

export default function SignUpPendingPage() {
  return (
    <SearchParamsBoundary>
      <SignUpPendingPanel />
    </SearchParamsBoundary>
  );
}
