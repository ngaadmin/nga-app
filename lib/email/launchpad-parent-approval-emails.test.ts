import { describe, expect, it } from "vitest";
import {
  buildLaunchpadParentApprovalEmail,
  buildLaunchpadParentApprovalReminderEmail,
  buildOnboardingEmail,
  type BuiltEmail,
} from "@/lib/email/templates";

const APP = "https://app.nextgenachievers.com";
const data = { childUsername: "KidOne", ventureName: "Dog walking" };

const requestEmail = buildLaunchpadParentApprovalEmail(data, APP);
const reminderEmail = buildLaunchpadParentApprovalReminderEmail(data, APP);
const emails: Array<[string, BuiltEmail]> = [
  ["request", requestEmail],
  ["reminder", reminderEmail],
];

describe.each(emails)("Launchpad approval %s email", (_name, email) => {
  it("deep-links to the Parent Hub and carries the disclaimer", () => {
    expect(email.html).toContain(`href="${APP}/dashboard/parent"`);
    expect(email.html).toContain("Open the Parent Hub");
    expect(email.text).toContain(`Open the Parent Hub: ${APP}/dashboard/parent`);
    expect(email.html).toContain("https://nextgenachievers.com/disclaimer");
    expect(email.text).toContain("We do not take on any risk");
    expect(email.text).toContain("The Team at NextGenAchiever$");
  });

  it("names the learner in the body only, never the subject or preheader", () => {
    expect(email.subject).not.toContain("KidOne");
    expect(email.preheader ?? "").not.toContain("KidOne");
    expect(email.text).toContain("KidOne");
    expect(email.text).toContain("dog walking business");
  });

  it("follows the copy rules", () => {
    const all = `${email.subject}\n${email.text}\n${email.html}`;
    expect(all).not.toMatch(/\u2014|\u2013/);
    expect(all).not.toMatch(/\bNGA\b/);
    expect(all).not.toMatch(/\b(silver|bronze|gold)\b/i);
    expect(all).not.toMatch(/lego|\bXP\b/i);
    expect(all).not.toMatch(/colour|favour|organis|centre|programme/i);
  });

  it("falls back to 'Your child' with no username", () => {
    const build = _name === "request" ? buildLaunchpadParentApprovalEmail : buildLaunchpadParentApprovalReminderEmail;
    const plain = build({}, APP);
    expect(plain.text).toContain("Your child ");
    expect(plain.text).toContain("their new business");
  });

  it("escapes a hostile username in the HTML", () => {
    const build = _name === "request" ? buildLaunchpadParentApprovalEmail : buildLaunchpadParentApprovalReminderEmail;
    const html = build({ childUsername: "<img src=x onerror=alert(1)>" }, APP).html;
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });
});

describe("Launchpad approval email wording", () => {
  it("the request asks for a yes or not now and the reminder says it is the only one", () => {
    expect(requestEmail.text).toContain("Approve or Not now");
    expect(requestEmail.text).not.toMatch(/only reminder/);
    expect(reminderEmail.text).toContain("This is the only reminder we will send.");
    expect(reminderEmail.subject).toMatch(/^Reminder:/);
  });

  it("is reachable through the shared builder by type", () => {
    expect(buildOnboardingEmail("LAUNCHPAD_PARENT_APPROVAL", data, APP).subject).toBe(requestEmail.subject);
    expect(buildOnboardingEmail("LAUNCHPAD_PARENT_APPROVAL_REMINDER", data, APP).subject).toBe(reminderEmail.subject);
  });
});
