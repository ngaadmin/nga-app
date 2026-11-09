"use client";

import { useState } from "react";
import { customerOf, offerOf } from "@/lib/launchpad/content/answers";
import { chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";
import { availabilityPhrase, catalogFor, chipLabel, isAvailabilitySlot, WHEN_OPTIONS } from "@/lib/launchpad/content/planning/catalog";
import { CUSTOMER_ANSWER_KEY, OFFER_ANSWER_KEY } from "@/lib/launchpad/content/planning/screens";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { ChosenValue } from "@/components/launchpad/venture/handbook/chosen-value";
import { AccentLabel } from "@/components/launchpad/venture/handbook/paper-art";
import { ART, Sticker } from "@/components/launchpad/venture/handbook/workbook-frame";
import { FlatSticker } from "@/components/launchpad/venture/handbook/flat-stickers";
import { BTN_CYAN_COMPACT } from "@/components/launchpad/venture-test/venture-test-ui";
import { BlankSlot, useTemplateBlanks } from "@/components/launchpad/venture/handbook/template-blanks";

function RuledPick({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick} className="flex w-full items-center gap-2 border-b border-dashed border-[#E4D3B4] py-1.5 text-left text-[15px] text-[#19347D]">
      <span className={`flex size-5 flex-none items-center justify-center rounded-[4px] ${on ? "bg-[#FFA503]" : "border-2 border-[#D1D5DB] bg-white"}`}>
        {on ? (
          <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#fff" strokeWidth="3">
            <path d="M5 12.5l5 5L19 7" />
          </svg>
        ) : null}
      </span>
      {label}
    </button>
  );
}

function joinLabels(ids: readonly string[]): string {
  const labels = ids.map((id) => chipLabel(id));
  if (labels.length === 0) return "";
  if (ids.length > 0 && ids.every(isAvailabilitySlot)) {
    const phrase = availabilityPhrase(ids);
    return phrase === "…" ? "" : phrase;
  }
  if (labels.length === 1) return labels[0]!;
  return labels.length === 2 ? `${labels[0]} and ${labels[1]}` : `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
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
  const templates = useTemplateBlanks();
  if (!offer) {
    if (!templates) return <p className="text-[14px] text-[#9CA3AF]">Not answered yet</p>;
    return (
      <div data-module2-handbook="product">
        <AccentLabel as="h2">The product and its buyers</AccentLabel>
        <h3 className="mb-2 mt-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9AA3B5]">What I am selling</h3>
        <p className="text-[15px] text-[#19347D]"><BlankSlot /></p>
        <h3 className="mb-2 mt-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9AA3B5]">When and who might want it</h3>
        <p className="text-[15px] text-[#19347D]"><BlankSlot /></p>
      </div>
    );
  }
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
            <button type="button" className="border-b-2 border-[#3FB7DA] font-heading text-[15px] font-bold text-[#19347D]" disabled={!editable} onClick={() => editable && setEditing(open ? null : row.serviceId)}>
              {label === "dog walking" ? "Dog walking" : label === "dog training" ? "Dog Training" : label === "grooming" ? "Grooming" : label}
            </button>
            <p className="mt-1 text-[15px] leading-snug text-[#19347D]">
              <ChosenValue>{joinLabels(row.packages)}</ChosenValue>
              {row.addons.length > 0 ? (
                <>
                  {" "}
                  with <ChosenValue>{joinLabels(row.addons)}</ChosenValue>
                </>
              ) : null}
              .
            </p>
            {open && catalog && (
              <div className="mt-2" data-inline-editor={row.serviceId}>
                <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#9AA3B5]">Packages</p>
                {catalog.packages.map((item) => (
                  <RuledPick key={item.id} label={item.label} on={row.packages.includes(item.id)} onClick={() => {
                    const packages = row.packages.includes(item.id) ? row.packages.filter((id) => id !== item.id) : [...row.packages, item.id];
                    ctx?.setAnswer(OFFER_ANSWER_KEY, { ...offer, offerings: offer.offerings.map((entry) => entry.serviceId === row.serviceId ? { ...entry, packages } : entry) });
                  }} />
                ))}
                <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#9AA3B5]">Extras</p>
                {catalog.extras.map((item) => (
                  <RuledPick key={item.id} label={item.label} on={row.addons.includes(item.id)} onClick={() => {
                    const addons = row.addons.includes(item.id) ? row.addons.filter((id) => id !== item.id) : [...row.addons, item.id];
                    ctx?.setAnswer(OFFER_ANSWER_KEY, { ...offer, offerings: offer.offerings.map((entry) => entry.serviceId === row.serviceId ? { ...entry, addons } : entry) });
                  }} />
                ))}
                <p className="mt-2 text-[14px] font-semibold text-[#3FB7DA]">+ Add another</p>
                <button type="button" className="mt-2 text-[15px] font-semibold text-[#3FB7DA]" onClick={() => setEditing(null)}>Done</button>
              </div>
            )}
          </div>
        );
      })}
      <h3 className="mb-2 mt-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9AA3B5]">When</h3>
      <p className="text-[15px] leading-snug text-[#19347D]">
        <ChosenValue>{joinLabels(offer.availability)}</ChosenValue>.
      </p>
      <div className="mt-2 flex items-center gap-2 text-[14px] text-[#19347D]">
        {editable && (
          <button type="button" aria-label="Edit your own time" data-pencil="" onClick={() => setEditing(editing === "also" ? null : "also")} className="text-[#6B7280]">✎</button>
        )}
        <span>
          Also:{" "}
          {editing === "also" ? "" : offer.availabilityExtra ? <ChosenValue>{offer.availabilityExtra}</ChosenValue> : "…"}
        </span>
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
          <p className="text-[15px] leading-snug text-[#19347D]">
            I asked <ChosenValue>{customer.numberAsked}</ChosenValue> people. They said <ChosenValue>{customer.yesNo === "yes" ? "Yes" : "No"}</ChosenValue>. They were interested in <ChosenValue>{joinLabels(customer.interests.filter((id) => !WHEN_OPTIONS.some((time) => time.id === id)))}</ChosenValue>.
            {customer.times && customer.times.length > 0 ? <> They wanted walks <ChosenValue>{availabilityPhrase(customer.times)}</ChosenValue>.</> : null}
          </p>
        </>
      )}
      <p className="mt-3 text-[12px] text-[#9AA3B5]">Tap a line to change your picks.</p>
      <div className="mt-3 flex items-end gap-2">
        <Sticker src={ART.beagle} alt="" />
        <FlatSticker kind="paw" doodle />
        <FlatSticker kind="paw" doodle />
        <FlatSticker kind="paw" doodle />
        <FlatSticker kind="bone" doodle />
        <FlatSticker kind="heart" doodle />
      </div>
    </div>
  );
}
