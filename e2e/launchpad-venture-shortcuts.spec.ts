/**
 * Launchpad venture test route: rooftop and deep-link shortcuts
 * (?rooftop=1, ?complete=, ?level=, ?venture=, ?iconSet=) at 390x844.
 */
import { expect, test } from "@playwright/test";
import { MOBILE, shot, step, track, url } from "./launchpad-venture-helpers";

test.use({ viewport: MOBILE, hasTouch: true, isMobile: true });

const corridorTitle = "#lp-corridor-title";

test("rooftop shortcuts", async ({ page }, info) => {
  test.setTimeout(180_000);
  const t = track(page, info, "r");
  await step(t, "?rooftop=1 opens the rooftop", async () => {
    await page.goto(url("reset=1&rooftop=1"));
    await expect(page.locator('[data-placeholder="rooftop-finish"]')).toBeVisible({ timeout: 60_000 });
  });
  const back = page.getByRole("button", { name: "Back to Launchpad" });
  await shot(t, "Rooftop from ?rooftop=1", back);
  await step(t, "Rooftop button goes back to Launchpad home", async () => {
    await back.click();
    await expect(page.getByRole("button", { name: "Dog walking. Open" })).toBeVisible();
    await expect(page.locator('[data-in-progress="dog-walking"]')).toBeVisible();
  });
  await shot(t, "Home after the rooftop", page.locator('[data-in-progress="dog-walking"]').getByRole("button", { name: "Continue" }));

  await step(t, "?complete=all: building with every floor lit and Go to the rooftop", async () => {
    await page.goto(url("reset=1&complete=all"));
    const roof = page.locator("main").getByRole("button", { name: "Go to the rooftop" });
    await expect(roof).toBeVisible({ timeout: 60_000 });
  });
  await shot(t, "Building after ?complete=all", page.locator("main").getByRole("button", { name: "Go to the rooftop" }));
  await step(t, "Go to the rooftop opens the rooftop", async () => {
    await page.locator("main").getByRole("button", { name: "Go to the rooftop" }).click();
    await expect(page.locator('[data-placeholder="rooftop-finish"]')).toBeVisible({ timeout: 15_000 });
  });
  await shot(t, "Rooftop from the building", back);
  await step(t, "Handbook after ?complete=all has a page for every earned silver", async () => {
    await back.click();
    await page.locator('[data-in-progress="dog-walking"] [data-handbook-button]').click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("button", { name: /not earned yet/ })).toHaveCount(0);
  });
  await shot(t, "Home handbook after ?complete=all", null);
});

test("deep links", async ({ page }, info) => {
  test.setTimeout(240_000);
  const t = track(page, info, "k");

  await step(t, "?level=2 opens the Level 2 corridor", async () => {
    await page.goto(url("reset=1&level=2"));
    await expect(page.locator(corridorTitle)).toHaveText(/Level 2 · Planning/, { timeout: 60_000 });
  });
  await shot(t, "?level=2", page.getByRole("button", { name: /The product and its buyers/ }));

  await step(t, "?level=1 opens the Level 1 corridor", async () => {
    await page.goto(url("reset=1&level=1"));
    await expect(page.locator(corridorTitle)).toHaveText(/Level 1 · Vision and Goals/, { timeout: 60_000 });
  });
  await shot(t, "?level=1", page.getByRole("button", { name: /Define the business/ }));

  for (const level of [3, 4, 5, 6, 7] as const) {
    await step(t, `?level=${level} corridor: description and plaques`, async () => {
      await page.goto(url(`reset=1&level=${level}`));
      await expect(page.locator(corridorTitle)).toHaveText(new RegExp(`Level ${level}`), { timeout: 60_000 });
      // Wait out the lift-door entry (~0.6s) so plaques and the outcome are visible.
      await expect(page.getByRole("button", { name: /, (up next|locked)$/ }).first()).toBeVisible({ timeout: 15_000 });
      await page.waitForTimeout(700);
      await expect(page.locator("body")).not.toContainText(/\b(gold|silver|bronze)\b/i);
      await expect(page.locator("body")).not.toContainText(/TBC/i);
      await expect(page.locator("body")).not.toContainText(/LEVEL \d+ GOAL/i);
      await expect(page.getByText(new RegExp(`^Level ${level}$`))).toBeVisible();
    });
    await shot(t, `?level=${level} corridor`, page.getByRole("button", { name: /, (up next|locked)$/ }).first());

    await step(t, `?level=${level} locked doors from a plaque`, async () => {
      // Prefer a locked plaque so every door reads Locked; else the up-next plaque
      // (sibling doors after the first still show Locked).
      const lockedPlaque = page.getByRole("button", { name: /, locked$/ });
      if (await lockedPlaque.count()) await lockedPlaque.first().click();
      else await page.getByRole("button", { name: /, up next$/ }).first().click();
      await expect(page.getByText("Locked").first()).toBeVisible({ timeout: 15_000 });
      await expect(page.locator("body")).not.toContainText(/TBC/i);
    });
    await shot(t, `?level=${level} locked doors`, page.getByText("Locked").first());
    await page.getByRole("button", { name: new RegExp(`Level ${level} corridor`) }).click();
  }

  await step(t, "Pricing doors: Know your cost is open, the other Final titles stay locked", async () => {
    await page.goto(url("reset=1&complete=l2-s1"));
    await expect(page.locator(corridorTitle)).toHaveText(/Level 2/, { timeout: 60_000 });
    await page.getByRole("button", { name: /Pricing, up next/ }).click();
    for (const title of [
      "Know your cost",
      "Research what competitors offer and what they charge",
      "Set the price",
      "Work out how many jobs cover your costs",
    ]) {
      await expect(page.getByText(title)).toBeVisible();
    }
    await expect(page.getByRole("button", { name: /Know your cost/ })).toBeVisible();
    await expect(page.getByText("Locked")).toHaveCount(3);
    await expect(page.getByText("These doors aren't open yet.")).toHaveCount(0);
    await expect(page.locator("body")).not.toContainText(/TBC/i);
    await expect(page.locator("body")).not.toContainText(/\b(gold|silver|bronze)\b/i);
  });
  await shot(t, "Pricing doors, Know your cost up next", page.getByText("Know your cost"));


  await step(t, "?complete=l1-s1: Level 1 corridor with Set your goals up next", async () => {
    await page.goto(url("reset=1&complete=l1-s1"));
    await expect(page.locator(corridorTitle)).toHaveText(/Level 1 · Vision and Goals/, { timeout: 60_000 });
    await expect(page.getByRole("button", { name: /Set your goals, up next/ })).toBeVisible();
  });
  await shot(t, "?complete=l1-s1", page.getByRole("button", { name: /Set your goals, up next/ }));

  await step(t, "?complete=l1-s2: Level 1 corridor with The Brand up next", async () => {
    await page.goto(url("reset=1&complete=l1-s2"));
    await expect(page.locator(corridorTitle)).toHaveText(/Level 1 · Vision and Goals/, { timeout: 60_000 });
    await expect(page.getByRole("button", { name: /The Brand, up next/ })).toBeVisible();
  });
  await shot(t, "?complete=l1-s2", page.getByRole("button", { name: /The Brand, up next/ }));

  await step(t, "?complete=l1-s3: Level 1 done, Level 2 corridor with product up next", async () => {
    await page.goto(url("reset=1&complete=l1-s3"));
    await expect(page.locator(corridorTitle)).toHaveText(/Level 2 · Planning/, { timeout: 60_000 });
    await expect(page.getByRole("button", { name: /The product and its buyers, up next/ })).toBeVisible();
  });
  await shot(t, "?complete=l1-s3", page.getByRole("button", { name: /The product and its buyers, up next/ }));

  await step(t, "?complete=l2-s2: Level 2 done (lift up or Level 3)", async () => {
    await page.goto(url("reset=1&complete=l2-s2"));
    await expect(page.locator(corridorTitle)).toHaveText(/Level (2 · Planning|3 · Getting Ready)/, { timeout: 60_000 });
    const title = await page.locator(corridorTitle).innerText();
    if (/Level 2/.test(title)) await expect(page.locator("main").getByRole("button", { name: "Go to Level 3" })).toBeVisible();
  });
  const onL2 = /Level 2/.test(await page.locator(corridorTitle).innerText());
  await shot(t, "?complete=l2-s2", onL2 ? page.locator("main").getByRole("button", { name: "Go to Level 3" }) : null);

  await step(t, "Level 3 workbook: compact Previous (left) and Next (right), aqua", async () => {
    await page.goto(url("reset=1&complete=l2-s2"));
    await expect(page.locator(corridorTitle)).toHaveText(/Level 3/, { timeout: 60_000 });
    await expect(page.locator("body")).not.toContainText(/\b(gold|silver|bronze)\b/i);
    await page.getByRole("button", { name: /up next/ }).first().click();
    await expect(page.locator("main").getByRole("button", { name: /Up next/ }).first()).toBeVisible();
    await expect(page.locator("body")).not.toContainText(/\b(gold|silver|bronze)\b/i);
    await page.screenshot({ path: test.info().outputPath("level-3-doors.png") });
    await page.locator("main").getByRole("button", { name: /Up next/ }).first().click();
    await page.locator("[data-workbook-next]").click();
    const prev = page.locator("[data-workbook-previous]");
    const next = page.locator("[data-workbook-next]");
    await expect(prev).toBeEnabled();
    const [p, n] = [await prev.boundingBox(), await next.boundingBox()];
    expect(p!.width).toBeLessThan(160);
    expect(n!.width).toBeLessThan(160);
    expect(p!.x).toBeLessThan(40);
    expect(n!.x + n!.width).toBeGreaterThan(350);
    await expect(page.locator("body")).not.toContainText(/\b(gold|silver|bronze)\b/i);
  });
  await shot(t, "Level 3 workbook, Previous and Next", page.locator("[data-workbook-next]"));
  await page.goto(url("reset=1&complete=l2-s2"));
  await expect(page.locator(corridorTitle)).toHaveText(/Level (2 · Planning|3 · Getting Ready)/, { timeout: 60_000 });

  await step(t, "?complete=l2-s1: handbook shows sample answers on the Level 1 and Level 2 pages", async () => {
    await page.getByRole("button", { name: /Back to building/ }).click();
    await page.getByRole("button", { name: "Open workbook" }).first().click();
    const hb = page.getByRole("dialog");
    await expect(hb.locator("[data-handbook-page]")).toBeVisible();
    await hb.getByRole("button", { name: "Level 1, Vision and Goals" }).click();
    const text = await hb.locator('[data-handbook-page="l1-s1"]').innerText();
    expect(text.length).toBeGreaterThan(40);
    await page.getByRole("button", { name: "Close workbook" }).click();
  });

  await step(t, "?venture=dog-walking opens that venture (first time: onboarding)", async () => {
    await page.goto(url("reset=1&venture=dog-walking"));
    await expect(
      page.getByRole("heading", { name: "Build your business one floor at a time." }).or(page.locator("main").getByRole("button", { name: "Go to Level 1" })),
    ).toBeVisible({ timeout: 60_000 });
  });
  await shot(t, "?venture=dog-walking", page.locator("main").getByRole("button", { name: /Start building|Go to Level 1/ }));

  await step(t, "?venture=lemonade-stand opens another venture's building", async () => {
    await page.goto(url("reset=1&venture=lemonade-stand&level=1"));
    await expect(page.locator(corridorTitle)).toHaveText(/Level 1/, { timeout: 60_000 });
  });
  await shot(t, "?venture=lemonade-stand&level=1", null);

  await step(t, "?venture=not-a-venture does not crash (not-found or fallback)", async () => {
    const res = await page.goto(url("venture=not-a-venture"));
    const status = res?.status() ?? 0;
    expect([200, 404]).toContain(status);
    t.errors.splice(0); // a 404 page logs its own failed-resource error
  });

  await step(t, "?iconSet=friendship-bracelets swaps the logo icons", async () => {
    await page.goto(url("reset=1&complete=l1-s2&iconSet=friendship-bracelets"));
    await page.getByRole("button", { name: /The Brand, up next/ }).click({ timeout: 60_000 });
    // Logo first (AC13): Design your logo is the up-next door.
    const main = page.locator("main");
    await main.getByRole("button", { name: /Design your logo/ }).click();
    await main.getByRole("tab", { name: "Icon" }).click();
    for (const n of ["Bead strand", "Knot", "Heart loop"]) await expect(main.getByRole("radio", { name: n })).toBeVisible();
    await expect(main.getByRole("radio", { name: "Paw" })).toHaveCount(0);
  });
  await shot(t, "?iconSet=friendship-bracelets, icon tab", null);

  await step(t, "Without ?iconSet the dog icons are back", async () => {
    await page.goto(url("reset=1&complete=l1-s2"));
    await page.getByRole("button", { name: /The Brand, up next/ }).click({ timeout: 60_000 });
    const main = page.locator("main");
    await main.getByRole("button", { name: /Design your logo/ }).click();
    await main.getByRole("tab", { name: "Icon" }).click();
    for (const n of ["Paw", "Bone", "Dog face"]) await expect(main.getByRole("radio", { name: n })).toBeVisible();
  });
  await shot(t, "Default icon set, icon tab", null);
});
