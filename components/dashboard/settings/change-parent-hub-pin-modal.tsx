"use client";

import { useState, type FormEvent } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { ParentPinGate } from "@/components/parent/parent-pin-gate";
import { isParentTabPin } from "@/lib/parent/parent-tab-pin";
import { changeParentHubPin } from "@/lib/parent/parent-tab-server";
import { cn } from "@/lib/utils/cn";

const pinInputClass =
  "w-full rounded-xl border-2 border-[#BDE9FB] bg-[#F7FBFF] px-4 py-2.5 text-center font-heading text-lg font-bold tracking-[0.35em] text-[#031F82] outline-none focus:border-[#0CC1E0]";

const ctaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] py-3 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] disabled:opacity-40";

export const PARENT_HUB_PIN_COPY = {
  rowLabel: "Change Parent Hub PIN",
  title: "Change Parent Hub PIN",
  verifyBody: "Enter your current Parent Hub PIN first.",
  newLabel: "New Parent Hub PIN",
  confirmLabel: "Confirm new PIN",
  mismatch: "Those PINs don't match.",
  format: "Enter 4 numbers.",
  save: "Save new PIN",
  saved: "Your Parent Hub PIN is changed.",
  done: "Done",
  cancel: "Cancel",
} as const;

function PinInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="font-heading text-sm font-bold text-[#031F82]">{label}</span>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={4}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 4))}
        className={cn("mt-1.5", pinInputClass)}
      />
    </label>
  );
}

/**
 * Settings: change the Parent Hub PIN (the one asked every time the Parent
 * Hub opens). Step 1 checks the current PIN on the server through the same
 * gate as the Hub ("Forgot your PIN?" works there too). Step 2 saves the new
 * one with that pass. The pass lives only in this modal and is dropped on
 * close.
 */
export function ChangeParentHubPinModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      layer="toast"
      labelledBy="change-parent-hub-pin-title"
      backdropClassName="bg-[#031F82]/55"
      panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md"
    >
      {isOpen ? <ChangeParentHubPinBody onClose={onClose} /> : null}
    </ModalShell>
  );
}

function ChangeParentHubPinBody({ onClose }: { onClose: () => void }) {
  const copy = PARENT_HUB_PIN_COPY;
  const [pass, setPass] = useState<string | null>(null);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!pass || busy) return;
    if (!isParentTabPin(newPin)) {
      setError(copy.format);
      return;
    }
    if (newPin !== confirmPin) {
      setError(copy.mismatch);
      return;
    }
    setBusy(true);
    setError(null);
    const result = await changeParentHubPin(pass, newPin);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPass(null);
    setNewPin("");
    setConfirmPin("");
    setSaved(true);
  }

  return (
    <div data-change-parent-hub-pin>
      <h2
        id="change-parent-hub-pin-title"
        className="font-heading text-lg font-extrabold text-[#031F82]"
      >
        {copy.title}
      </h2>
      {saved ? (
        <>
          <p role="status" className="mt-3 font-sans text-sm text-[#1E3A5F]">
            {copy.saved}
          </p>
          <button type="button" onClick={onClose} className={cn("mt-4 w-full", ctaClass)}>
            {copy.done}
          </button>
        </>
      ) : pass ? (
        <form onSubmit={save} className="mt-3 flex flex-col gap-3">
          <PinInput
            id="parent-hub-new-pin"
            label={copy.newLabel}
            value={newPin}
            onChange={setNewPin}
          />
          <PinInput
            id="parent-hub-confirm-pin"
            label={copy.confirmLabel}
            value={confirmPin}
            onChange={setConfirmPin}
          />
          {error ? (
            <p role="alert" className="font-sans text-[12.5px] font-semibold text-[#B42318]">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={busy || newPin.length !== 4 || confirmPin.length !== 4}
            className={ctaClass}
          >
            {busy ? "Saving…" : copy.save}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-1 font-sans text-xs font-semibold text-[#1E3A5F] underline underline-offset-2"
          >
            {copy.cancel}
          </button>
        </form>
      ) : (
        <>
          <ParentPinGate
            parentName=""
            className="mx-0 mt-3 shadow-none ring-1 ring-[#E3EAF5]"
            enterBody={copy.verifyBody}
            onUnlocked={(gatePass) => setPass(gatePass)}
          />
          <button
            type="button"
            onClick={onClose}
            className="mt-2 block w-full py-1 font-sans text-xs font-semibold text-[#1E3A5F] underline underline-offset-2"
          >
            {copy.cancel}
          </button>
        </>
      )}
    </div>
  );
}
