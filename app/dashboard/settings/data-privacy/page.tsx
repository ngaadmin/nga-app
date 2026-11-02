import { MyAccountPage } from "@/components/privacy/my-account-page";

export const dynamic = "force-dynamic";

/** Your data & privacy: the account holder's own data, behind the Parent PIN. */
export default function SettingsDataPrivacyPage() {
  return <MyAccountPage section="privacy" />;
}
