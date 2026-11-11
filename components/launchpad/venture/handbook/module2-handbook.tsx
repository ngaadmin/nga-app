"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { customerOf, offerOf } from "@/lib/launchpad/content/answers";
import { chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";
import { availabilityPhrase, chipLabel, isAvailabilitySlot, WHEN_OPTIONS } from "@/lib/launchpad/content/planning/catalog";
import { CUSTOMER_ANSWER_KEY, OFFER_ANSWER_KEY } from "@/lib/launchpad/content/planning/screens";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { ChosenValue } from "@/components/launchpad/venture/handbook/chosen-value";
import { AccentLabel, WORKBOOK_ANSWER, WORKBOOK_BODY, WORKBOOK_HINT, WORKBOOK_SUB } from "@/components/launchpad/venture/handbook/paper-art";
import { LargeScribble } from "@/components/launchpad/venture/handbook/scribble-mark";
import { BlankSlot, useTemplateBlanks } from "@/components/launchpad/venture/handbook/template-blanks";

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
 * Playback only: saved picks and typed extras, with no inputs.
 */
export function ProductHandbook() {
  const s = useSurfaceCopy();
  const ctx = useLaunchpadAnswers();
  const offer = offerOf(ctx?.answers, OFFER_ANSWER_KEY);
  const customer = customerOf(ctx?.answers, CUSTOMER_ANSWER_KEY);
  const services = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  const templates = useTemplateBlanks();
  if (!offer) {
    if (!templates) return <p className={WORKBOOK_HINT}>{s.chrome.notAnswered}</p>;
    return (
      <div data-module2-handbook="product">
        <AccentLabel as="h2">{s.sheets.product}</AccentLabel>
        <h3 className={`mb-2 mt-3 ${WORKBOOK_SUB}`}>{s.sheets.selling}</h3>
        <p className={WORKBOOK_BODY}><BlankSlot /></p>
        <h3 className={`mb-2 mt-3 ${WORKBOOK_SUB}`}>{s.sheets.whenWho}</h3>
        <p className={WORKBOOK_BODY}><BlankSlot /></p>
      </div>
    );
  }
  return (
    <div data-module2-handbook="product">
      <AccentLabel as="h2">{s.sheets.product}</AccentLabel>
      <h3 className={`mb-2 mt-3 ${WORKBOOK_SUB}`}>{s.sheets.selling}</h3>
      {offer.offerings.map((row) => {
        const label = services.find((service) => service.id === row.serviceId)?.label ?? row.serviceId;
        return (
          <div key={row.serviceId} className="mb-3">
            <p className={WORKBOOK_ANSWER}>
              {label === "dog walking" ? s.sheets.dogWalking : label === "dog training" ? s.sheets.dogTraining : label}
            </p>
            <p className={`mt-1 ${WORKBOOK_BODY}`}>
              <ChosenValue>{joinLabels(row.packages)}</ChosenValue>
              {row.addons.length > 0 ? (
                <>
                  {" "}
                  with <ChosenValue>{joinLabels(row.addons)}</ChosenValue>
                </>
              ) : null}
              .
            </p>
            {row.packagesExtra?.trim() ? (
              <p className={WORKBOOK_BODY} data-packages-extra="">
                {s.offer.packagesExtraLine}: <ChosenValue>{row.packagesExtra}</ChosenValue>
              </p>
            ) : null}
            {row.addonsExtra?.trim() ? (
              <p className={WORKBOOK_BODY} data-addons-extra="">
                {s.offer.addonsExtraLine}: <ChosenValue>{row.addonsExtra}</ChosenValue>
              </p>
            ) : null}
          </div>
        );
      })}
      <h3 className={`mb-2 mt-2 ${WORKBOOK_SUB}`}>When</h3>
      <p className={`${WORKBOOK_BODY}`}>
        <ChosenValue>{joinLabels(offer.availability)}</ChosenValue>.
      </p>
      {offer.availabilityExtra?.trim() ? (
        <p className={`mt-1 ${WORKBOOK_BODY}`} data-availability-extra="">
          {s.sheets.ownTime}: <ChosenValue>{offer.availabilityExtra}</ChosenValue>
        </p>
      ) : null}
      {customer?.timesExtra?.trim() ? (
        <p className={`mt-1 ${WORKBOOK_BODY}`} data-times-extra="">
          {s.offer.timesExtraLine}: <ChosenValue>{customer.timesExtra}</ChosenValue>
        </p>
      ) : null}
      {customer && (
        <>
          <h3 className={`mb-2 mt-4 ${WORKBOOK_SUB}`}>{s.sheets.whoWants}</h3>
          <p className={`${WORKBOOK_BODY}`}>
            {s.sheets.iAsked} <ChosenValue>{customer.numberAsked}</ChosenValue> {s.sheets.peopleSaid} <ChosenValue>{customer.yesNo === "yes" ? "Yes" : "No"}</ChosenValue>{s.sheets.interestedIn} <ChosenValue>{joinLabels(customer.interests.filter((id) => !WHEN_OPTIONS.some((time) => time.id === id)))}</ChosenValue>.
            {customer.times && customer.times.length > 0 ? <> {s.sheets.wantedWalks} <ChosenValue>{availabilityPhrase(customer.times)}</ChosenValue>.</> : null}
          </p>
        </>
      )}
      <LargeScribble name="pawtrail" />
    </div>
  );
}
