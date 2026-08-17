"use client";

import { useEffect, useState } from "react";
import { AddLinkedProfilePanel } from "@/components/dashboard/settings/add-linked-profile-panel";
import { CreateParentProfilePanel } from "@/components/dashboard/settings/create-parent-profile-panel";
import { readUserSession } from "@/lib/onboarding/guest-session";

/** Parent Settings add/link entry: create a master first, or add a child. */
export function AddProfileGate() {
  const [isParentMaster, setIsParentMaster] = useState<boolean | null>(null);

  useEffect(() => {
    const session = readUserSession();
    setIsParentMaster(
      session?.accessMode === "registered" &&
        session.accountRole === "parent_master",
    );
  }, []);

  if (isParentMaster === null) {
    return null;
  }

  return isParentMaster ? <AddLinkedProfilePanel /> : <CreateParentProfilePanel />;
}
