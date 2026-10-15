import type { Metadata } from "next";
import { SignUpPendingPanel } from "@/components/onboarding/sign-up-pending-panel";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";

export const metadata: Metadata = {
  title: "Approval saves your XP",
  description:
    "Your account needs approval to save your XP. You can keep playing while you wait.",
};

export default function SignUpPendingPage() {
  return (
    <SearchParamsBoundary>
      <SignUpPendingPanel />
    </SearchParamsBoundary>
  );
}
