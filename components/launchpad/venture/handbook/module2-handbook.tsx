"use client";

import { useState } from "react";
import { customerOf, offerOf } from "@/lib/launchpad/content/answers";
import { chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";
import { catalogFor, chipLabel } from "@/lib/launchpad/content/planning/catalog";
import { CUSTOMER_ANSWER_KEY, OFFER_ANSWER_KEY } from "@/lib/launchpad/content/planning/screens";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { AccentLabel } from "@/components/launchpad/venture/handbook/paper-art";
import { BTN_CYAN_COMPACT } from "@/components/launchpad/venture-test/venture-test-ui";

function Pill({ label, tone }: { label: string; tone: "package" | "extra" | "time" }) {
  const cls = tone === "extra" ? "border-[#F5B942] text-[#19347D]" : "border-[#0CC1E0] text-[#19347D]";
  return <span className={`inline-flex h-7 items-center rounded-full border bg-white px-2.5 text-[13px] ${cls}`}>{label}</span>;
}

/**
 * Handbook page for Decide what to sell and Know who your customers are.
 * Chips open the same menu inline. The only pencil is the own-words time line.
 */
export function ProductHandbook({ editable }: { editable: boolean }) {
  const ctx = useLaunchpadAnswers();
  const offer = offerOf(ctx?.answers, OFFER_ANSWER_KEY);
  const customer = customerOf(ctx?.answers, CUSTOMER_ANSWER_KEY);
  const services = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  const [editing, setEditing] = useState<string | null>(null);
  const [also, setAlso] = useState(offer?.availabilityExtra ?? "");
  if (!offer) return <p className="text-[14px] text-[#9CA3AF]">Not answered yet</p>;
  const saveAlso = () => {
    ctx?.setAnswer(OFFER_ANSWER_KEY, { ...offer, availabilityExtra: also.trim() || undefined });
    setEditing(null);
  };
  return (
    <div data-module2-handbook="product">
      <AccentLabel as="h2">The product and its buyers</AccentLabel>
      <h3 className="mb-2 mt-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9AA3B5]">What I am selling</h3>
      {offer.offerings.map((row) => {
        const catalog = catalogFor(row.serviceId);
        const label = services.find((service) => service.id === row.serviceId)?.label ?? row.serviceId;
        const open = editing === row.serviceId;
        return (
          <div key={row.serviceId} className="mb-3">
            <button type="button" className="font-heading text-[15px] font-bold text-[#19347D]" disabled={!editable} onClick={() => editable && setEditing(open ? null : row.serviceId)}>
              {label === "dog walking" ? "Dog walking" : label === "dog training" ? "Dog Training" : label === "grooming" ? "Grooming" : label}
            </button>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[14px] text-[#19347D]">
              {row.packages.map((id) => <Pill key={id} tone="package" label={chipLabel(id)} />)}
              {row.addons.length > 0 && <span>with</span>}
              {row.addons.map((id) => <Pill key={id} tone="extra" label={chipLabel(id)} />)}
            </div>
            {open && catalog && (
              <div className="mt-2 rounded-2xl p-3 shadow-[inset_0_0_0_1.5px_#0CC1E0]" data-inline-editor={row.serviceId}>
                <div className="flex flex-wrap gap-2">
                  {catalog.packages.map((item) => (
                    <button key={item.id} type="button" aria-pressed={row.packages.includes(item.id)} className="rounded-full border border-[#0CC1E0] px-3 py-1 text-[13px]" onClick={() => {
                      const packages = row.packages.includes(item.id) ? row.packages.filter((id) => id !== item.id) : [...row.packages, item.id];
                      ctx?.setAnswer(OFFER_ANSWER_KEY, { ...offer, offerings: offer.offerings.map((entry) => entry.serviceId === row.serviceId ? { ...entry, packages } : entry) });
                    }}>{item.label}</button>
                  ))}
                </div>
                <button type="button" className={`${BTN_CYAN_COMPACT} mt-3`} onClick={() => setEditing(null)}>Done</button>
              </div>
            )}
          </div>
        );
      })}
      <h3 className="mb-2 mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9AA3B5]">When</h3>
      <div className="flex flex-wrap gap-1.5">
        {offer.availability.map((id) => <Pill key={id} tone="time" label={chipLabel(id)} />)}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[14px] text-[#19347D]">
        {editable && (
          <button type="button" aria-label="Edit your own time" data-pencil="" onClick={() => setEditing(editing === "also" ? null : "also")} className="text-[#6B7280]">✎</button>
        )}
        <span>Also: {editing === "also" ? "" : offer.availabilityExtra || "…"}</span>
      </div>
      {editing === "also" && (
        <div className="mt-2" data-inline-editor="also">
          <input aria-label="Your own time" maxLength={80} value={also} onChange={(event) => setAlso(event.target.value)} className="h-11 w-full rounded-xl px-3 shadow-[inset_0_0_0_1.5px_#0CC1E0] outline-none" />
          <button type="button" className={`${BTN_CYAN_COMPACT} mt-2`} onClick={saveAlso}>Done</button>
        </div>
      )}
      {customer && (
        <>
          <h3 className="mb-2 mt-4 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9AA3B5]">Who might want it</h3>
          <p className="text-[14px] leading-snug text-[#19347D]">
            I asked {customer.numberAsked} people. They said {customer.yesNo === "yes" ? "Yes" : "No"}. They were interested in
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {customer.interests.map((id) => <Pill key={id} tone="package" label={chipLabel(id)} />)}
          </div>
        </>
      )}
    </div>
  );
}
