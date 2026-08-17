import type { Metadata } from "next";
import { AddProfileGate } from "@/components/dashboard/settings/add-profile-gate";
import { copyMatrix } from "@/constants/copyMatrix";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.settings.accountSubscription.addLinkedTitle,
  description:
    copyMatrix.dashboard.settings.accountSubscription.addLinkedTrackHint,
};

export default function AddProfilePage() {
  return <AddProfileGate />;
}
