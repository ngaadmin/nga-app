"use client";

import { useCallback, useRef, useState } from "react";

export type ParentDeclineOutcome = { ok: true } | { ok: false; error: string };

export type ParentDeclineFlow<T> = {
  /** The item waiting for the parent to confirm, if any. */
  pending: T | null;
  isConfirmOpen: boolean;
  isDeclinedOpen: boolean;
  busy: boolean;
  error: string | null;
  /** Step 1: open the "Are you sure?" dialog. Never declines on its own. */
  requestDecline: (target: T) => void;
  /** "Go back" or Escape: closes the dialog and changes nothing. */
  cancel: () => void;
  /** "Yes, decline and delete": runs the decline once. */
  confirm: () => Promise<void>;
  closeDeclined: () => void;
};

/**
 * Shared two-step decline for every parent decline entry point.
 * The decline (which also deletes the learner's records on the server) only
 * runs from `confirm`, and only once per confirmation.
 */
export function useParentDeclineFlow<T>(
  decline: (target: T) => Promise<ParentDeclineOutcome>,
): ParentDeclineFlow<T> {
  const [pending, setPending] = useState<{ value: T } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeclinedOpen, setDeclinedOpen] = useState(false);
  const inFlight = useRef(false);
  const pendingRef = useRef<{ value: T } | null>(null);
  pendingRef.current = pending;

  const requestDecline = useCallback((target: T) => {
    if (inFlight.current) return;
    setError(null);
    setPending({ value: target });
  }, []);

  const cancel = useCallback(() => {
    if (inFlight.current) return;
    setError(null);
    setPending(null);
  }, []);

  const confirm = useCallback(async () => {
    const current = pendingRef.current;
    if (!current || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await decline(current.value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPending(null);
      setDeclinedOpen(true);
    } catch {
      setError("We could not decline this learner. Try again.");
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }, [decline]);

  const closeDeclined = useCallback(() => setDeclinedOpen(false), []);

  return {
    pending: pending?.value ?? null,
    isConfirmOpen: pending !== null,
    isDeclinedOpen,
    busy,
    error,
    requestDecline,
    cancel,
    confirm,
    closeDeclined,
  };
}
