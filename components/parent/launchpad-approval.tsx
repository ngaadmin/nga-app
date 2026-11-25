"use client";

import { useState } from "react";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { WEBSITE_LEGAL_LINKS } from "@/lib/legal/paths";
import { PARENT_HUB_UNREAD_CHANGED_EVENT } from "@/lib/launchpad/parent-approval/config";
import { decideLaunchpadApproval } from "@/lib/launchpad/parent-approval/server";
import type { LaunchpadApprovalItem } from "@/lib/launchpad/parent-approval/list";

const copy = copyMatrix.launchpadParentApproval.parent;

const DISCLAIMER_HREF =
  WEBSITE_LEGAL_LINKS.find((link) => link.label === "Disclaimer")?.href ??
  "https://nextgenachievers.com/disclaimer";

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

function shortDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** One "Needs your OK" row for a learner at the Launchpad approval stop. */
export function LaunchpadApprovalRow({
  item,
  first,
  onReview,
}: {
  item: LaunchpadApprovalItem;
  first: boolean;
  onReview: () => void;
}) {
  const vars = { child: item.childUsername, venture: item.ventureName.toLowerCase() };
  return (
    <div
      data-parent-tab-ok-row="launchpad"
      data-launchpad-approval-status={item.status}
      className={`flex items-center gap-2.5 py-2.5 ${first ? "" : "border-t border-[#F6DFA8]"}`}
    >
      <div className="min-w-0 flex-1 font-sans text-[13.5px] font-bold leading-tight text-[#031F82]">
        <em className="mb-0.5 block font-sans text-[10.5px] font-semibold uppercase not-italic tracking-[0.3px] text-[#8A5300]">
          {copy.rowEyebrow}
        </em>
        {fill(copy.rowTitle, vars)}
        <span className="mt-0.5 block font-sans text-[11.5px] font-medium text-[#1E3A5F]">
          {item.status === "declined"
            ? copy.rowNotNow
            : fill(copy.rowPending, { date: shortDate(item.requestedAt) })}
        </span>
      </div>
      <button
        type="button"
        data-launchpad-approval-review
        data-parent-ok-pill
        onClick={onReview}
        className="parent-ok-pill"
      >
        {copy.review}
      </button>
    </div>
  );
}

/**
 * Review sheet: what the parent is saying yes to, our counsel, the disclaimer,
 * then Approve or Not now. One tap each. No second PIN: the Parent PIN was asked
 * when the parent opened the Parent Hub, and the server checks the parent link.
 */
export function LaunchpadApprovalSheet({
  item,
  pass,
  onClose,
  onDecided,
}: {
  item: LaunchpadApprovalItem | null;
  /** Parent Hub gate pass from the Parent PIN. The server refuses an answer without it. */
  pass: string;
  onClose: () => void;
  onDecided: (status: "approved" | "declined") => void;
}) {
  const [deciding, setDeciding] = useState<"yes" | "no" | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    if (busy) return;
    setDeciding(null);
    setError(null);
    onClose();
  }

  async function decide(answer: "yes" | "no") {
    if (!item || busy) return;
    setBusy(true);
    setDeciding(answer);
    setError(null);
    try {
      const result = await decideLaunchpadApproval(item.learnerId, item.ventureId, answer, pass);
      if (!result.ok) {
        setError(result.error || copy.saveError);
        return;
      }
      // The count drops at once (a waiting request was answered), then the
      // server count confirms it.
      window.dispatchEvent(
        new CustomEvent(PARENT_HUB_UNREAD_CHANGED_EVENT, {
          detail: { pendingDelta: item.status === "pending" ? -1 : 0 },
        }),
      );
      onDecided(result.status === "approved" ? "approved" : "declined");
    } catch {
      setError(copy.saveError);
    } finally {
      setBusy(false);
      setDeciding(null);
    }
  }

  const vars = item
    ? { child: item.childUsername, venture: item.ventureName.toLowerCase() }
    : { child: "", venture: "" };

  return (
    <ModalShell
      isOpen={Boolean(item)}
      onClose={close}
      layer="toast"
      liftAboveBottomNav
      labelledBy="parent-tab-launchpad-title"
      backdropClassName="bg-[#031F82]/55"
      panelClassName="max-h-full overflow-y-auto rounded-2xl border-0 bg-white p-5 shadow-md"
    >
      {item ? (
        <div data-launchpad-approval-sheet>
          <h2
            id="parent-tab-launchpad-title"
            className="font-heading text-lg font-extrabold text-[#031F82]"
          >
            {fill(copy.sheetTitle, vars)}
          </h2>
          <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">
            {fill(copy.sheetIntro, vars)}
          </p>
          <p className="mt-2 font-sans text-sm leading-relaxed text-[#1E3A5F]">
            {copy.sheetWhatYouApprove}
          </p>
          <p className="mt-2 font-sans text-sm font-semibold leading-relaxed text-[#031F82]">
            {copy.sheetCounsel}
          </p>
          <p className="mt-2 font-sans text-[12.5px] leading-relaxed text-[#1E3A5F]">
            {copy.sheetDisclaimer}{" "}
            <a
              href={DISCLAIMER_HREF}
              target="_blank"
              rel="noreferrer"
              className="font-semibold underline underline-offset-2"
            >
              {copy.disclaimerLink}
            </a>
          </p>
          {error ? (
            <p role="alert" className="mt-2 font-sans text-[12.5px] font-semibold text-[#B42318]">
              {error}
            </p>
          ) : null}
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              data-launchpad-approval-approve
              disabled={busy}
              onClick={() => void decide("yes")}
              className="rounded-full bg-[#FFA503] py-2.5 font-heading text-sm font-bold text-white shadow-[0_3px_0_#C88202] disabled:opacity-50"
            >
              {busy && deciding === "yes" ? copy.saving : copy.approve}
            </button>
            {item.status === "pending" ? (
              <button
                type="button"
                data-launchpad-approval-not-now
                disabled={busy}
                onClick={() => void decide("no")}
                className="rounded-full border-2 border-[#C9D6EA] py-2 font-heading text-sm font-bold text-[#031F82] disabled:opacity-50"
              >
                {busy && deciding === "no" ? copy.saving : copy.notNow}
              </button>
            ) : null}
            <button
              type="button"
              data-launchpad-approval-back
              disabled={busy}
              onClick={close}
              className="py-1 font-sans text-xs font-semibold text-[#1E3A5F] underline underline-offset-2"
            >
              {copy.back}
            </button>
          </div>
        </div>
      ) : null}
    </ModalShell>
  );
}
