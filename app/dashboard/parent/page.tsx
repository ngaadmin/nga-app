import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ParentTabScreen } from "@/components/parent/parent-tab-screen";
import { DASHBOARD_DEFAULT_HREF } from "@/lib/dashboard/navigation";
import { loadParentTabAccess } from "@/lib/parent/parent-tab-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Parent dashboard",
  description: "Only the parent can see this. It's PIN-protected.",
};

/** Learners, guests and parents without an active linked child are sent away. */
export default async function ParentTabPage() {
  const access = await loadParentTabAccess();
  if (!access.eligible) redirect(DASHBOARD_DEFAULT_HREF);
  return (
    <ParentTabScreen
      parentUserId={access.parentUserId}
      parentName={access.parentName}
    />
  );
}
