import type { ParentHubSignals } from "@/lib/parent/hub-signals-type";

/**
 * One request for the Parent Hub top-bar signals (can the Hub open, how many
 * requests are waiting). Calls made while one is already in flight share it, so
 * the access check and the unread count cost a single round trip.
 */
let inFlight: Promise<ParentHubSignals> | null = null;

export function fetchParentHubSignals(): Promise<ParentHubSignals> {
  if (inFlight) return inFlight;
  const request = fetch("/api/parent/hub-signals", { cache: "no-store", credentials: "same-origin" })
    .then(async (response) => {
      if (!response.ok) throw new Error(`hub-signals ${response.status}`);
      return (await response.json()) as ParentHubSignals;
    })
    .finally(() => {
      inFlight = null;
    });
  inFlight = request;
  return request;
}
