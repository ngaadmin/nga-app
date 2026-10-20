import { expect, type Page, test } from "@playwright/test";

const SESSION_KEY = "nga_guest_session";

const GUEST_SESSION = {
  accessMode: "guest",
  username: "Comet8259",
  ageTier: "explorer",
  curriculumCohort: "explorer",
  accountStatus: "GUEST",
  createdAt: "2026-10-15T00:00:00.000Z",
};

test.use({ viewport: { width: 390, height: 844 } });

async function installGuest(page: Page) {
  await page.addInitScript(
    ([key, value]) => {
      const raw = JSON.stringify(value);
      window.localStorage.setItem(key, raw);
      window.sessionStorage.setItem(key, raw);
    },
    [SESSION_KEY, GUEST_SESSION] as const,
  );
}

test("parent PIN opens the child record, download strips secrets, delete lists what goes", async ({
  page,
}) => {
  await page.goto("/dashboard/data-preview/parent-flow");
  await expect(page.getByRole("heading", { name: "Enter your parent PIN" })).toBeVisible();

  await page.getByLabel("Parent PIN").fill("0000");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("alert")).toContainText("Wrong PIN");

  await page.getByLabel("Parent PIN").fill("2580");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("heading", { name: "My child's data" })).toBeVisible();
  await expect(page.getByText("sam.parent@example.com")).toBeVisible();
  await expect(page.getByText("480 coins")).toBeVisible();
  await expect(page.getByText("1,250 XP")).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download data" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("delta4-data.json");
  const body = (await download.createReadStream()).setEncoding("utf8");
  let text = "";
  for await (const chunk of body) text += chunk;
  expect(text).toContain("delta4");
  expect(text).toContain("480");
  expect(text).not.toContain("nga2_parentpinhashvalue");
  expect(text).not.toContain("nga2_passwordhashvalue");
  expect(text).not.toContain("YellowSecret");
  expect(text).not.toContain("consenttokenvalue");
  expect(text).not.toContain("parent_pin_hash");
  expect(text).not.toContain("token_hash");

  await page.getByRole("button", { name: "Delete account" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByRole("heading", { name: "Delete delta4's account?" })).toBeVisible();
  await expect(dialog.getByText("Profile")).toBeVisible();
  await expect(dialog.getByText("Lifetime XP")).toBeVisible();
  await expect(dialog.getByText("Vault jars and goals")).toBeVisible();
  await expect(dialog.getByText("The recent activity history")).toBeVisible();
  const confirm = dialog.getByRole("button", { name: "Delete delta4's account" });
  await expect(confirm).toBeEnabled();
  await expect(confirm).toHaveCSS("background-color", "rgb(198, 40, 40)");
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeVisible();
});

test("guest clear removes device progress and keeps the guest session", async ({ page }) => {
  await installGuest(page);
  await page.goto("/dashboard/settings");
  await expect(page.getByRole("button", { name: "Clear this device's progress" })).toBeVisible();

  await page.evaluate(() => {
    const wallet = JSON.stringify({
      schemaVersion: 9,
      ownerUserId: "guest:comet8259",
      totalPoints: 150,
      lifetimePointsEarned: 400,
      audSliderIndex: 0,
      xpExchangeRateSet: false,
    });
    const extras: Record<string, string> = {
      nga_dashboard_wallet_v2: wallet,
      nga_vault_profile_v1: JSON.stringify({ jarBalances: { "save-jar": 12 } }),
      nga_vault_skill_progress_v1: JSON.stringify({ "stop-think": "bronze" }),
      nga_learning_streak_v1: JSON.stringify({ count: 3 }),
      nga_academy_progress_v1: JSON.stringify([{ id: "m1", status: "completed" }]),
    };
    for (const [key, value] of Object.entries(extras)) {
      window.localStorage.setItem(key, value);
      window.sessionStorage.setItem(key, value);
    }
  });

  await page.getByRole("button", { name: "Clear this device's progress" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByRole("heading", { name: "Clear this device's progress?" })).toBeVisible();
  await expect(dialog.getByText("Lessons")).toBeVisible();
  await expect(dialog.getByText("Coins")).toBeVisible();
  await expect(dialog.getByText("Lifetime XP")).toBeVisible();
  await expect(dialog.getByText("Medals")).toBeVisible();
  await expect(dialog.getByText("Jars, amounts and savings goals")).toBeVisible();
  const confirm = dialog.getByRole("button", { name: "Clear progress" });
  await expect(confirm).toHaveCSS("background-color", "rgb(198, 40, 40)");
  await confirm.click();

  const stored = await page.evaluate(() => {
    const walletRaw =
      window.localStorage.getItem("nga_dashboard_wallet_v2") ||
      window.sessionStorage.getItem("nga_dashboard_wallet_v2");
    const wallet = walletRaw ? (JSON.parse(walletRaw) as { totalPoints?: number }) : null;
    const sessionRaw =
      window.sessionStorage.getItem("nga_guest_session") ||
      window.localStorage.getItem("nga_guest_session");
    const session = sessionRaw ? (JSON.parse(sessionRaw) as { username?: string }) : null;
    return {
      username: session?.username ?? "",
      coins: wallet?.totalPoints ?? -1,
      vault: window.localStorage.getItem("nga_vault_profile_v1"),
      medals: window.localStorage.getItem("nga_vault_skill_progress_v1"),
      streak: window.localStorage.getItem("nga_learning_streak_v1"),
    };
  });

  expect(stored.username).toBe("Comet8259");
  expect(stored.coins).toBe(0);
  expect(stored.vault).toBeNull();
  expect(stored.medals).toBeNull();
  expect(stored.streak).toBeNull();
});
