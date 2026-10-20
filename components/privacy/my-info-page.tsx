"use client";

import { useEffect, useState } from "react";
import { loadMyInfo } from "@/lib/privacy/account-data-server";
import { MyInfoScreen } from "@/components/privacy/my-info-screen";

export function MyInfoPage() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | {
        status: "ready";
        username: string;
        trackLabel: string | null;
        managedBy: "teacher" | "account_manager";
      }
  >({ status: "loading" });

  useEffect(() => {
    void loadMyInfo().then((result) => {
      if (!result.ok) {
        setState({ status: "error", message: result.error });
        return;
      }
      setState({
        status: "ready",
        username: result.username,
        trackLabel: result.trackLabel,
        managedBy: result.managedBy,
      });
    });
  }, []);

  if (state.status === "loading") {
    return <p className="px-2 py-6 font-sans text-sm text-[#1E3A5F]">Loading…</p>;
  }
  if (state.status === "error") {
    return <p className="px-2 py-6 font-sans text-sm text-[#1E3A5F]">{state.message}</p>;
  }
  return (
    <MyInfoScreen
      username={state.username}
      trackLabel={state.trackLabel}
      managedBy={state.managedBy}
    />
  );
}
