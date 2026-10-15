import { expect, type Page, test } from "@playwright/test";

const SESSION_KEY = "nga_guest_session";
const WALLET_KEY = "nga_dashboard_wallet_v2";
const PROGRESS_KEY = "nga_academy_progress_v1";

const GUEST_PATHFINDER = {
  accessMode: "guest",
  username: "guestplayer",
  accountRole: "child",
  accountStatus: "GUEST",
  ageTier: "pathfinder",
  curriculumCohort: "pathfinder",
  createdAt: "2026-10-01T00:00:00.000Z",
};

const WALLET = { xp: 40, coins: 12 };
const PROGRESS = { lessonMilestones: { "m1-l1": "done" } };

const WIDTHS = [
  { name: "320", width: 320, height: 568 },
  { name: "375", width: 375, height: 667 },
  { name: "414", width: 414, height: 736 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

async function seedGuest(page: Page) {
  await page.addInitScript(
    ([sessionKey, session, walletKey, wallet, progressKey, progress]) => {
      window.localStorage.setItem(sessionKey, JSON.stringify(session));
      window.sessionStorage.setItem(sessionKey, JSON.stringify(session));
      window.localStorage.setItem(walletKey, JSON.stringify(wallet));
      window.sessionStorage.setItem(walletKey, JSON.stringify(wallet));
      window.localStorage.setItem(progressKey, JSON.stringify(progress));
      window.sessionStorage.setItem(progressKey, JSON.stringify(progress));
    },
    [SESSION_KEY, GUEST_PATHFINDER, WALLET_KEY, WALLET, PROGRESS_KEY, PROGRESS] as const,
  );
}

async function assertNoHorizontalOverflow(page: Page, label: string) {
  const overflow = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(overflow.scrollWidth, label).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

test("learner sign-up steps keep the guest track and guest progress", async ({ page }) => {
  await seedGuest(page);
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/onboarding/sign-up?as=learner");

  const pathfinder = page.getByRole("radio", { name: /Pathfinder/ });
  await expect(pathfinder).toBeVisible({ timeout: 15_000 });
  await expect(pathfinder).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeEnabled();
  await expect(page.getByText("You can switch this later.")).toHaveCount(0);
  await expect(page.getByText("This track is already chosen")).toHaveCount(0);

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Choose the year you were born.")).toBeVisible();

  await page.locator("#signup-birth-year").selectOption("2013");
  await expect(page.getByRole("status")).toHaveText(
    "Based on your age, Explorer is the right fit",
  );
  await expect(page.getByRole("radio", { name: /Explorer/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );

  const stored = await page.evaluate(
    ([sessionKey, walletKey, progressKey]) => ({
      session: window.localStorage.getItem(sessionKey),
      wallet: window.localStorage.getItem(walletKey),
      progress: window.localStorage.getItem(progressKey),
    }),
    [SESSION_KEY, WALLET_KEY, PROGRESS_KEY] as const,
  );
  expect(stored.session).toContain("pathfinder");
  expect(stored.wallet).toContain("40");
  expect(stored.progress).toContain("m1-l1");
  expect(stored.session).not.toContain("2013");
});

test("learner sign-up screenshots at phone and desktop widths", async ({ page }) => {
  await page.goto("/onboarding/sign-up?as=learner");
  await expect(page.getByRole("radio", { name: /Explorer/ })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("button", { name: "Next", exact: true })).toBeDisabled();

  for (const viewport of WIDTHS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await assertNoHorizontalOverflow(page, `step A empty ${viewport.name}`);
    await page.screenshot({
      path: `/opt/cursor/artifacts/signup-${viewport.name}-A-empty.png`,
      fullPage: true,
    });
  }

  await page.setViewportSize({ width: 375, height: 800 });
  await page.getByRole("radio", { name: /Pathfinder/ }).click();
  await expect(page.getByRole("radio", { name: /Pathfinder/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.getByRole("radio", { name: /Pathfinder/ }).click();
  await expect(page.getByRole("radio", { name: /Pathfinder/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.locator("#signup-birth-year").selectOption("2011");
  await expect(page.getByRole("status")).toHaveCount(0);

  for (const viewport of WIDTHS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await assertNoHorizontalOverflow(page, `step A selected ${viewport.name}`);
    await page.screenshot({
      path: `/opt/cursor/artifacts/signup-${viewport.name}-A-selected.png`,
      fullPage: true,
    });
  }

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByLabel("Username")).toBeVisible();
  await expect(page.getByText("Tip: don't use your real full name.")).toBeVisible();
  await expect(page.getByLabel("Confirm password")).toHaveCount(0);

  const password = page.getByLabel("Create your password");
  await password.fill("secret1");
  await expect(password).toHaveAttribute("type", "password");
  await page.getByRole("button", { name: "Show", exact: true }).click();
  await expect(password).toHaveAttribute("type", "text");
  await expect(page.getByRole("button", { name: "Hide", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Hide", exact: true }).click();
  await expect(password).toHaveAttribute("type", "password");

  await page.getByLabel("Username").fill("CashDragon88");

  for (const viewport of WIDTHS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await assertNoHorizontalOverflow(page, `step B ${viewport.name}`);
    await page.screenshot({
      path: `/opt/cursor/artifacts/signup-${viewport.name}-B.png`,
      fullPage: true,
    });
  }

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByLabel("Your Email Address")).toBeVisible();
  await expect(page.getByText("Enter your email so we can save your account.")).toHaveCount(0);
  await expect(page.getByText("Check the highlighted fields and try again.")).toHaveCount(0);
  await expect(page.getByText("For account updates only. You log in with your username.")).toBeVisible();
  await expect(page.getByLabel("Parent/guardian email address")).toBeVisible();
  await expect(
    page.getByText("Send me occasional updates about NextGenAchiever$"),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create My Free Account" }),
  ).toBeVisible();

  for (const viewport of WIDTHS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await assertNoHorizontalOverflow(page, `step C pathfinder ${viewport.name}`);
    await page.screenshot({
      path: `/opt/cursor/artifacts/signup-${viewport.name}-C-pathfinder.png`,
      fullPage: true,
    });
  }

  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByLabel("Username")).toBeVisible();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await expect(page.getByRole("radio", { name: /Maverick/ })).toBeVisible();

  await page.getByRole("radio", { name: /Maverick/ }).click();
  await page.locator("#signup-birth-year").selectOption("2008");
  await expect(page.getByRole("radio", { name: /Maverick/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.setViewportSize({ width: 375, height: 667 });
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByLabel("Your Email Address")).toBeVisible();
  await expect(page.getByText("Check the highlighted fields and try again.")).toHaveCount(0);
  await expect(page.getByLabel("Parent/guardian email address")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Create My Free Account" }),
  ).toBeVisible();
  await page.screenshot({
    path: "/opt/cursor/artifacts/signup-375-C-maverick.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("radio", { name: /Explorer/ }).click();
  await page.locator("#signup-birth-year").selectOption("2013");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByText("Approval saves your XP. You can keep playing while you wait."),
  ).toBeVisible();
  await expect(page.getByText("Check the highlighted fields and try again.")).toHaveCount(0);
  await expect(page.getByLabel("Your Email Address")).toHaveCount(0);
  await expect(
    page.getByText("Send me occasional updates about NextGenAchiever$"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Request Parent Approval" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({
    path: "/opt/cursor/artifacts/signup-375-C-explorer.png",
    fullPage: true,
  });
});

test("bottom tab uses the amber active pill", async ({ page }) => {
  await page.addInitScript(
    ([key, value]) => {
      const raw = JSON.stringify(value);
      window.localStorage.setItem(key, raw);
      window.sessionStorage.setItem(key, raw);
      window.localStorage.setItem(
        "nga_page_intro_seen_by_account_v1",
        JSON.stringify({ "22222222-2222-2222-2222-222222222222": ["academy"] }),
      );
    },
    [
      SESSION_KEY,
      {
        accessMode: "registered",
        username: "pennytest",
        ageTier: "pathfinder",
        curriculumCohort: "pathfinder",
        accountStatus: "ACTIVE",
        accountRole: "child",
        consentApprovedAt: "2026-01-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
        supabaseUserId: "22222222-2222-2222-2222-222222222222",
        learnerEmail: "pennytest@example.com",
      },
    ] as const,
  );

  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/dashboard/academy");
  const letsGo = page.getByRole("button", { name: "Let's go" });
  try {
    await letsGo.waitFor({ state: "visible", timeout: 8_000 });
    await letsGo.click({ force: true });
  } catch {
    // The academy intro is already dismissed for this session.
  }
  const academy = page.locator("[data-dashboard-nav] a[aria-current='page']");
  await expect(academy).toBeVisible({ timeout: 15_000 });
  const pill = academy.locator("span").first();
  await expect(pill).toHaveCSS("background-color", "rgb(255, 165, 3)");
  await expect(pill).toHaveCSS("color", "rgb(3, 31, 130)");
  await expect(page.locator("[data-dashboard-nav]")).not.toHaveCSS(
    "border-top-width",
    "1px",
  );

  for (const viewport of [
    { name: "320", width: 320, height: 568 },
    { name: "360", width: 360, height: 740 },
    { name: "390", width: 390, height: 844 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await assertNoHorizontalOverflow(page, `tabs ${viewport.name}`);
    const labels = page.locator("[data-dashboard-nav] a span:nth-child(2)");
    const count = await labels.count();
    for (let index = 0; index < count; index += 1) {
      const box = await labels.nth(index).boundingBox();
      const link = await labels.nth(index).locator("xpath=..").boundingBox();
      expect(box, `label ${index} at ${viewport.name}`).toBeTruthy();
      expect(link, `link ${index} at ${viewport.name}`).toBeTruthy();
      expect(box!.width).toBeLessThanOrEqual(link!.width + 1);
    }
    await page.screenshot({
      path: `/opt/cursor/artifacts/tabs-${viewport.name}-amber-pill.png`,
      fullPage: false,
    });
  }
});
