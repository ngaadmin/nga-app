import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TermsConsentCheckbox } from "@/components/legal/terms-consent-checkbox";
import { LearnerTermsArea } from "@/components/onboarding/learner-terms-area";
import {
  checkTermsAcceptance,
  isTermsAcceptanceEntry,
  TERMS_ACCEPTANCE_TITLE,
  TERMS_NOT_FOR_CHILD_ERROR,
  TERMS_REQUIRED_ERROR,
  TERMS_URL,
  TERMS_VERSION,
  termsAcceptanceHistoryRow,
} from "@/lib/legal/terms-consent";

function checkbox(props: { checked?: boolean; error?: string | null } = {}) {
  return renderToStaticMarkup(
    createElement(TermsConsentCheckbox, {
      id: "t",
      checked: props.checked ?? false,
      onChange: () => undefined,
      error: props.error,
    }),
  );
}

function learnerArea(needsParentApproval: boolean) {
  return renderToStaticMarkup(
    createElement(LearnerTermsArea, {
      needsParentApproval,
      termsAccepted: false,
      onTermsAcceptedChange: () => undefined,
    }),
  );
}

describe("checkTermsAcceptance", () => {
  it("requires a tick from anyone who can agree", () => {
    expect(checkTermsAcceptance({ audience: "can_agree", termsAccepted: true })).toEqual({
      ok: true,
      record: true,
    });
    for (const value of [undefined, null, false, "true", 1]) {
      expect(checkTermsAcceptance({ audience: "can_agree", termsAccepted: value })).toEqual({
        ok: false,
        error: TERMS_REQUIRED_ERROR,
      });
    }
  });

  it("rejects any Terms value from an under-16 learner", () => {
    for (const value of [true, false, "yes"]) {
      expect(
        checkTermsAcceptance({ audience: "under16_learner", termsAccepted: value }),
      ).toEqual({ ok: false, error: TERMS_NOT_FOR_CHILD_ERROR });
    }
    expect(
      checkTermsAcceptance({ audience: "under16_learner", termsAccepted: undefined }),
    ).toEqual({ ok: true, record: false });
  });

  it("rejects a Terms value for a child a parent adds", () => {
    expect(
      checkTermsAcceptance({ audience: "child_added_by_parent", termsAccepted: true }),
    ).toEqual({ ok: false, error: TERMS_NOT_FOR_CHILD_ERROR });
    expect(
      checkTermsAcceptance({ audience: "child_added_by_parent", termsAccepted: undefined }),
    ).toEqual({ ok: true, record: false });
  });
});

describe("terms acceptance record", () => {
  it("builds an account_history row with timestamp and version", () => {
    const row = termsAcceptanceHistoryRow({
      profileId: "p1",
      acceptedAt: "2026-10-30T03:00:00.000Z",
    });
    expect(row).toEqual({
      profile_id: "p1",
      occurred_at: "2026-10-30T03:00:00.000Z",
      title: TERMS_ACCEPTANCE_TITLE,
      detail: "Terms version 2026-10-30",
    });
    expect(TERMS_VERSION).toBe("2026-10-30");
    expect(isTermsAcceptanceEntry({ title: row.title })).toBe(true);
    expect(isTermsAcceptanceEntry({ title: "Leaderboard kept off" })).toBe(false);
  });
});

describe("TermsConsentCheckbox", () => {
  it("renders an unticked, labeled checkbox with both links in new tabs", () => {
    const html = checkbox();
    expect(html).toContain('type="checkbox"');
    expect(html).not.toMatch(/checked=""/);
    expect(html).toContain('<label for="t"');
    expect(html).toContain("I agree to the");
    expect(html).toContain(`href="${TERMS_URL}"`);
    expect(html).toContain('href="/privacy"');
    expect(html.match(/target="_blank"/g)).toHaveLength(2);
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(2);
    expect(html).toContain("Terms and Conditions");
    expect(html).toContain("Privacy Policy");
    expect(html).not.toContain("NGA");
    expect(html).not.toContain("aria-describedby");
  });

  it("shows a ticked state", () => {
    expect(checkbox({ checked: true })).toMatch(/checked=""/);
  });

  it("links an error to the checkbox", () => {
    const html = checkbox({ error: TERMS_REQUIRED_ERROR });
    expect(html).toContain('aria-describedby="t-error"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('id="t-error"');
    expect(html).toContain('role="alert"');
  });
});

describe("LearnerTermsArea", () => {
  it("shows the tick box to a 16+ learner", () => {
    const html = learnerArea(false);
    expect(html).toContain('type="checkbox"');
    expect(html).toContain("I agree to the");
  });

  it("shows no tick box and no agreement wording to an under-16 learner", () => {
    const html = learnerArea(true);
    expect(html).not.toContain('type="checkbox"');
    expect(html).not.toMatch(/I agree/i);
    expect(html).not.toContain("Terms");
    expect(html).toContain('data-slot="under16-terms-notice"');
  });
});
