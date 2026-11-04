import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Finding 4: the parent UPDATE policy on consent_requests is dropped. Every
// app write to consent_requests must therefore run on the service-role
// (admin) client, never on a user-session client.
const FILES = [
  "lib/onboarding/approve-consent-request.ts",
  "lib/onboarding/lookup-consent-request.ts",
  "lib/onboarding/issue-guardian-signup-email.ts",
  "lib/onboarding/resend-explorer-pending-approval.ts",
  "lib/onboarding/household-recovery.ts",
  "lib/onboarding/delete-household-master.ts",
  "lib/onboarding/sign-in-supabase.ts",
  "lib/privacy/run-privacy-maintenance.ts",
  "lib/privacy/account-data-server.ts",
  "app/api/account/delete-child/route.ts",
];

describe("consent_requests writes use the service role", () => {
  it.each(FILES)("%s queries consent_requests only through the admin client", (rel) => {
    const src = readFileSync(path.join(process.cwd(), rel), "utf8");
    const re = /(\w+)\s*(?:\n\s*)?\.from\("consent_requests"\)/g;
    const receivers = [...src.matchAll(re)].map((m) => m[1]);
    expect(receivers.length).toBeGreaterThan(0);
    for (const r of receivers) expect(["admin", "db"]).toContain(r);
  });
});
