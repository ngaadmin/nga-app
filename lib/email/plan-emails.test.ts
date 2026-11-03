import { describe, expect, it } from "vitest";
import {
  buildCancellationConfirmedEmail,
  buildPaymentReceiptEmail,
  buildTrialStartedEmail,
  type BuiltEmail,
} from "@/lib/email/templates";

const APP = "https://app.nextgenachievers.com";

const receiptEmail = buildPaymentReceiptEmail(
  {
    planName: "Family plan",
    amount: "US$9.99",
    paidOn: "December 3, 2026",
    receiptNumber: "R-0001",
    paymentMethod: "Visa ending 4242",
    nextPaymentOn: "January 3, 2027",
  },
  APP,
);

const emails: Array<[string, BuiltEmail]> = [
  ["trial started", buildTrialStartedEmail({ planName: "Family plan", trialEndsOn: "December 3, 2026" }, APP)],
  ["payment receipt", receiptEmail],
  [
    "cancellation confirmed",
    buildCancellationConfirmedEmail({ planName: "Family plan", accessEndsOn: "January 3, 2027" }, APP),
  ],
];

describe.each(emails)("%s email", (_name, email) => {
  it("uses the shared email card and links to the Parent Hub", () => {
    expect(email.html).toContain("<!DOCTYPE html>");
    expect(email.html).toContain("background:#F7F7F7");
    expect(email.html).toContain(`href="${APP}/dashboard/parent"`);
    expect(email.html).toContain("Open the Parent Hub");
    expect(email.text).toContain(`Open the Parent Hub: ${APP}/dashboard/parent`);
    expect(email.text).toContain("The Team at NextGenAchievers");
  });

  it("never says NGA, Parent dashboard, or UK spellings", () => {
    const all = `${email.subject}\n${email.preheader}\n${email.text}\n${email.html}`;
    expect(all).not.toMatch(/\bNGA\b/);
    expect(all).not.toMatch(/parent dashboard/i);
    expect(all).not.toMatch(/cancelled|organis|colour|authoris|favour|licence/i);
  });
});

it("receipt lists every payment detail", () => {
  const receipt = receiptEmail;
  for (const value of ["Family plan", "US$9.99", "December 3, 2026", "R-0001", "Visa ending 4242", "January 3, 2027"]) {
    expect(receipt.text).toContain(value);
    expect(receipt.html).toContain(value);
  }
});

it("escapes values so a plan name can't inject HTML", () => {
  const email = buildTrialStartedEmail({ planName: "<b>x</b>", trialEndsOn: "soon" }, APP);
  expect(email.html).not.toContain("<b>x</b>");
  expect(email.html).toContain("&lt;b&gt;x&lt;/b&gt;");
});

it("nothing in the app sends these yet", async () => {
  const { readFileSync, readdirSync, statSync } = await import("node:fs");
  const { join } = await import("node:path");
  const hits: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) {
        if (name !== "node_modules" && !name.startsWith(".")) walk(path);
      } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.tsx?$/.test(name) && path !== join("lib", "email", "templates.ts")) {
        if (/build(TrialStarted|PaymentReceipt|CancellationConfirmed)Email/.test(readFileSync(path, "utf8"))) hits.push(path);
      }
    }
  };
  for (const dir of ["app", "components", "lib"]) walk(dir);
  expect(hits).toEqual([]);
});
