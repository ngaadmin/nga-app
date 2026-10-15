import type { Metadata } from "next";
import { OnboardingHeader } from "@/components/onboarding/onboarding-header";
import { PrivacyPolicyView } from "@/components/legal/privacy-policy-view";
import { loadPrivacyPolicy } from "@/lib/privacy/load-privacy-policy";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How NextGenAchievers handles personal information in the app.",
};

export default function PrivacyPage() {
  const blocks = loadPrivacyPolicy();

  return (
    <>
      <OnboardingHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <PrivacyPolicyView blocks={blocks} />
      </main>
    </>
  );
}
