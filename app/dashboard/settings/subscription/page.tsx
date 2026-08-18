import type { Metadata } from "next";
import { SubscriptionPlaceholderPanel } from "@/components/dashboard/settings/subscription-placeholder-panel";
import { copyMatrix } from "@/constants/copyMatrix";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.settings.subscription.title,
  description: copyMatrix.dashboard.settings.subscription.description,
};

export default function SubscriptionPage() {
  return <SubscriptionPlaceholderPanel />;
}
