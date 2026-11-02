import type { Metadata } from "next";
import { ResetParentPinPanel } from "@/components/onboarding/reset-parent-pin-panel";
import { SearchParamsBoundary } from "@/components/ui/search-params-boundary";

export const metadata: Metadata = {
  title: "Reset Parent PIN",
  description: "Set a new Parent PIN from the email link.",
};

export default function ResetParentPinPage() {
  return (
    <SearchParamsBoundary>
      <ResetParentPinPanel />
    </SearchParamsBoundary>
  );
}
