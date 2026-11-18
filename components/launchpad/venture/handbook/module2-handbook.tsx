"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { customerOf, offerOf } from "@/lib/launchpad/content/answers";
import { chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";
import { chipLabel, joinMid, joinPhrase, playedBackTimes, WHEN_OPTIONS } from "@/lib/launchpad/content/planning/catalog";
import { CUSTOMER_ANSWER_KEY, OFFER_ANSWER_KEY } from "@/lib/launchpad/content/planning/screens";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { ChosenValue } from "@/components/launchpad/venture/handbook/chosen-value";
import { AccentLabel, WORKBOOK_ANSWER, WORKBOOK_BODY, WORKBOOK_HINT, WORKBOOK_SUB } from "@/components/launchpad/venture/handbook/paper-art";
import { LargeScribble } from "@/components/launchpad/venture/handbook/scribble-mark";
import { BlankSlot, useTemplateBlanks } from "@/components/launchpad/venture/handbook/template-blanks";

function listText(labels: readonly string[], extra: string | undefined, comma: string, andWord: string, mid = false): string {
  const items = [...labels, extra ?? ""];
  return mid ? joinMid(items, comma, andWord) : joinPhrase(items, comma, andWord);
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
  const walks = customer ? playedBackTimes(customer.times ?? [], customer.timesExtra, s.list.comma, s.list.and, true) : "";
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
        const packages = listText(row.packages.map(chipLabel), row.packagesExtra, s.list.comma, s.list.and);
        const extras = listText(row.addons.map(chipLabel), row.addonsExtra, s.list.comma, s.list.and, true);
        return (
          <div key={row.serviceId} className="mb-3">
            <p className={WORKBOOK_ANSWER}>
              {label === "dog walking" ? s.sheets.dogWalking : label === "dog training" ? s.sheets.dogTraining : label}
            </p>
            <p className={`mt-1 ${WORKBOOK_BODY}`} data-selling-line="">
              {packages ? <ChosenValue>{packages}</ChosenValue> : null}
              {extras ? (
                <>
                  {" "}
                  with <ChosenValue>{extras}</ChosenValue>
                </>
              ) : null}
              .
            </p>
          </div>
        );
      })}
      <h3 className={`mb-2 mt-2 ${WORKBOOK_SUB}`}>When</h3>
      <p className={WORKBOOK_BODY} data-when-line="">
        <ChosenValue>{playedBackTimes(offer.availability, offer.availabilityExtra, s.list.comma, s.list.and)}</ChosenValue>.
      </p>
      {customer && (
        <>
          <h3 className={`mb-2 mt-4 ${WORKBOOK_SUB}`}>{s.sheets.whoWants}</h3>
          <p className={WORKBOOK_BODY} data-who-line="">
            {s.sheets.iAsked} <ChosenValue>{customer.numberAsked}</ChosenValue> {s.sheets.peopleSaid} <ChosenValue>{customer.yesNo === "yes" ? "Yes" : "No"}</ChosenValue>{s.sheets.interestedIn} <ChosenValue>{listText(customer.interests.filter((id) => !WHEN_OPTIONS.some((time) => time.id === id)).map(chipLabel), customer.interestExtra, s.list.comma, s.list.and, true)}</ChosenValue>.
            {walks ? <> {s.sheets.wantedWalks} <ChosenValue>{walks}</ChosenValue>.</> : null}
          </p>
        </>
      )}
      <LargeScribble name="pawtrail" />
    </div>
  );
}
