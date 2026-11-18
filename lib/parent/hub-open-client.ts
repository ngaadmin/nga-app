import type { ParentTabPinCheck } from "@/lib/parent/parent-tab-pin";

/** Client side of POST /api/parent/hub-open: the Parent Hub's PIN check, with the Hub data on success. */
export async function openParentHubFromBrowser(pin: string): Promise<ParentTabPinCheck> {
  try {
    const response = await fetch("/api/parent/hub-open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
      cache: "no-store",
      credentials: "same-origin",
    });
    if (!response.ok) throw new Error(`hub-open ${response.status}`);
    return (await response.json()) as ParentTabPinCheck;
  } catch {
    return {
      ok: false,
      reason: "error",
      error: "Couldn't check your PIN. Try again.",
      triesLeft: 0,
      lockedUntil: null,
    };
  }
}
