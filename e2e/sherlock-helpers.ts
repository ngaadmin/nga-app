/**
 * Shared helpers for Sherlock's first nga-test specs (e2e/sherlock-*.spec.ts).
 *
 * Logins are read at runtime from the nga-test accounts file, never copied into
 * code, logs or screenshots. The path can be overridden with
 * NGA_TEST_ACCOUNTS_FILE. These specs refuse to run unless the app is pointed at
 * the nga-test Supabase project.
 */
import fs from "node:fs";
import { expect, type Page } from "@playwright/test";

export { MOBILE, DESKTOP } from "./launchpad-venture-helpers";

const NGA_TEST_REF = "gullnudronyguhkwppta";
const ACCOUNTS_FILE =
  process.env.NGA_TEST_ACCOUNTS_FILE || "/workspace/supabase-test/test-accounts.json";

export type TestAccount = { username: string; password: string };

/** Throws unless the app under test uses the nga-test project (never prod). */
export function assertNgaTestProject(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (!url.includes(NGA_TEST_REF)) {
    throw new Error(
      "Refusing to run: NEXT_PUBLIC_SUPABASE_URL is not the nga-test project.",
    );
  }
}

export function testAccount(key: string): TestAccount {
  assertNgaTestProject();
  const file = JSON.parse(fs.readFileSync(ACCOUNTS_FILE, "utf8"));
  if (file.project_ref !== NGA_TEST_REF) {
    throw new Error("Accounts file is not for the nga-test project.");
  }
  const account = file.accounts?.[key];
  if (!account?.username || !account?.password) {
    throw new Error(`Account "${key}" is missing from the nga-test accounts file.`);
  }
  return { username: account.username, password: account.password };
}

/** Signs in through the real sign-in screen and waits for the Academy home. */
export async function signIn(page: Page, account: TestAccount): Promise<void> {
  await page.goto("/onboarding/sign-in");
  await expect(page.getByRole("heading", { name: "Log in" })).toBeVisible();
  await page.getByRole("textbox", { name: "Email or username" }).fill(account.username);
  await page.getByPlaceholder("Password").fill(account.password);
  await page.getByRole("button", { name: "LOG IN" }).click();
  await expect(page).toHaveURL(/\/dashboard\/academy\/?$/, { timeout: 20_000 });
}

/** Reads the coin count from the "N coins to cash in" button. */
export async function coinsToCashIn(page: Page): Promise<number> {
  const label = await page
    .getByRole("button", { name: /coins to cash in/i })
    .first()
    .getAttribute("aria-label");
  const match = label?.match(/(\d+)/);
  return match ? Number(match[1]) : 0;
}
