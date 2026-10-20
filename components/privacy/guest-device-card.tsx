"use client";

import { useState } from "react";
import { DeviceIcon, TrashIcon } from "@/lib/dashboard/icons";
import { clearGuestDeviceProgress } from "@/lib/privacy/clear-guest-progress-browser";
import { RemovalConfirmSheet } from "@/components/privacy/removal-confirm-sheet";

const ITEMS = [
  { emoji: "🎓", title: "Lessons", detail: "Every lesson done on this device" },
  { emoji: "🪙", title: "Coins", detail: "The coins balance" },
  { emoji: "⭐", title: "Lifetime XP", detail: "The Lifetime XP total" },
  { emoji: "🏅", title: "Medals", detail: "Every medal earned" },
  { emoji: "🏦", title: "Vault", detail: "Jars, amounts and savings goals" },
];

export function GuestDeviceCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="rounded-2xl bg-white p-3.5 shadow-md">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#BDE9FB]/35 text-[#0CC1E0]">
            <DeviceIcon className="size-5" />
          </span>
          <div>
            <p className="font-heading text-base font-bold text-[#031F82]">This device</p>
            <p className="mt-0.5 font-sans text-[13px] font-medium leading-snug text-[#4A5675]">
              Your guest progress is kept on this phone or tablet, not in an account.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-b-4 border-[#031F82] bg-white font-heading text-[15px] font-bold text-[#031F82]"
        >
          <TrashIcon className="size-5" />
          Clear this device&apos;s progress
        </button>
      </section>
      <RemovalConfirmSheet
        open={open}
        title="Clear this device's progress?"
        body="Your guest progress on this device will be removed. This can't be undone."
        items={ITEMS}
        confirmLabel="Clear progress"
        onClose={() => setOpen(false)}
        onConfirm={() => {
          clearGuestDeviceProgress();
          setOpen(false);
        }}
      />
    </>
  );
}
