import type { Metadata } from "next";
import { AccountSubscriptionStatusPanel } from "@/components/dashboard/settings/account-subscription-status-panel";
import { copyMatrix } from "@/constants/copyMatrix";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.settings.accountSubscription.title,
  description: copyMatrix.dashboard.settings.accountSubscription.description,
};

export default function AccountSubscriptionStatusPage() {
  return <AccountSubscriptionStatusPanel />;
}
