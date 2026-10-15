"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { GuestLeaveDialog } from "@/components/onboarding/guest-leave-dialog";
import {
  guestHasUnsavedProgress,
  readGuestUnsavedXp,
  registerGuestLeaveOpener,
} from "@/lib/onboarding/guest-save-prompt";

/**
 * Back out of the dashboard, and Log out, ask before a guest leaves unsaved XP.
 * Closing the tab uses the browser beforeunload warning only.
 */
export function GuestUnsavedProgressGuard() {
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const bypassRef = useRef(false);
  const [xp, setXp] = useState(0);
  const [open, setOpen] = useState(false);
  const proceedRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    pathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    return registerGuestLeaveOpener((proceed) => {
      proceedRef.current = proceed;
      setXp(readGuestUnsavedXp());
      setOpen(true);
    });
  }, []);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (bypassRef.current || !guestHasUnsavedProgress()) return;
      event.preventDefault();
      event.returnValue = "";
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    function onPopState() {
      if (bypassRef.current) {
        bypassRef.current = false;
        return;
      }
      const left = pathRef.current;
      const now = window.location.pathname;
      if (!left.startsWith("/dashboard")) return;
      if (now.startsWith("/dashboard")) return;
      if (now.startsWith("/onboarding/sign-up")) return;
      if (!guestHasUnsavedProgress()) return;

      window.history.pushState(null, "", left);
      proceedRef.current = () => {
        bypassRef.current = true;
        window.history.back();
      };
      setXp(readGuestUnsavedXp());
      setOpen(true);
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <GuestLeaveDialog
      isOpen={open}
      xp={xp}
      onLeave={() => {
        const proceed = proceedRef.current;
        proceedRef.current = null;
        bypassRef.current = true;
        setOpen(false);
        proceed?.();
      }}
    />
  );
}
