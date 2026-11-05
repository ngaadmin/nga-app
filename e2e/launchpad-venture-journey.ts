/**
 * The full Launchpad venture journey on /test-launchpad-venture, shared by the
 * mobile and desktop specs: home tile, onboarding, building, every Level 1
 * and Level 2 bronze door (really answered), the after-step messages (AC14,
 * no wrap-ups), the Level 1 done lift, then the handbook.
 */
import { expect, type Page, type TestInfo } from "@playwright/test";
import { fits, nextButton, passed, ROUTE, shot, step, track } from "./launchpad-venture-helpers";

const main = (page: Page) => page.locator("main");
const btn = (page: Page, name: string | RegExp, exact = true) =>
  main(page).getByRole("button", typeof name === "string" ? { name, exact } : { name });

export async function runJourney(page: Page, info: TestInfo, group: string) {
  const t = track(page, info, group);
  const next = nextButton(page);
  const hint = page.locator("#workbook-next-hint");

  // ---------- 1. Home ----------
  await step(t, "Open the test route with ?reset=1", async () => {
    await page.goto(`${ROUTE}?reset=1`);
    await expect(page.getByRole("button", { name: "Dog walking. Open" })).toBeVisible({ timeout: 60_000 });
    await expect(page.locator("[data-in-progress]")).toHaveCount(0);
  });
  await shot(t, "Home, nothing in progress yet", page.getByRole("button", { name: "Dog walking. Open" }));

  // ---------- 2. Onboarding, building ----------
  await step(t, "Tap the Dog walking idea tile: first-time building screen shows", async () => {
    await page.getByRole("button", { name: "Dog walking. Open" }).click();
    await expect(page.getByRole("heading", { name: "Build your business one floor at a time." })).toBeVisible();
  });
  await shot(t, "First-time building screen (onboarding)", btn(page, "Start building"));

  await step(t, "Start building opens the building", async () => {
    await btn(page, "Start building").click();
    await expect(btn(page, "Go to Level 1")).toBeVisible();
    await expect(page.locator('[data-floor-hit="L1"]')).toHaveCount(1);
  });
  await shot(t, "Building, Level 1 next", btn(page, "Go to Level 1"));

  await step(t, "Back to home: In Progress tile shows level name, no handbook yet, Continue", async () => {
    await page.getByRole("button", { name: /Launchpad/ }).first().click();
    const tile = page.locator('[data-in-progress="dog-walking"]');
    await expect(tile).toBeVisible();
    await expect(tile.locator("[data-tile-level-name]")).toContainText("Vision and Goals");
    await expect(tile.getByRole("button", { name: "Continue" })).toBeVisible();
    // Workbook button always shown: an inactive placeholder until a step is done.
    await expect(tile.locator('[data-handbook-button="inactive"]')).toHaveAttribute("aria-disabled", "true");
  });
  await shot(t, "Home, In Progress tile (Level 1), workbook button inactive", page.locator('[data-in-progress="dog-walking"]').getByRole("button", { name: "Continue" }));

  await step(t, "Continue goes straight to the building (no onboarding a second time)", async () => {
    await page.locator('[data-in-progress="dog-walking"]').getByRole("button", { name: "Continue" }).click();
    await expect(btn(page, "Go to Level 1")).toBeVisible();
  });

  // ---------- 3. Level 1 ----------
  await step(t, "Go to Level 1 opens the Level 1 corridor", async () => {
    await btn(page, "Go to Level 1").click();
    await expect(page.locator("#lp-corridor-title")).toHaveText(/Level 1 · Vision and Goals/);
  });
  await shot(t, "Level 1 corridor", page.getByRole("button", { name: /Define the business, up next/ }));

  await step(t, "Open the Define the business plaque: 3 doors, first up next, rest locked", async () => {
    await page.getByRole("button", { name: /Define the business, up next/ }).click();
    await expect(page.getByText("Open a door to see its tasks.")).toBeVisible();
    await expect(btn(page, /Pick what kind of business you'll run/)).toContainText("Up next");
    for (const title of ["Find the why", "Know your impact"]) {
      await expect(btn(page, new RegExp(title))).toHaveCount(0);
      await expect(main(page).getByText(title, { exact: true })).toBeVisible();
    }
    await expect(main(page).getByText("Set your goals", { exact: true })).toHaveCount(0);
  });
  await shot(t, "Level 1 doors, first door up next", btn(page, /Pick what kind of business you'll run/));

  // Offer (multi-select)
  await step(t, "Offer door: Finish stays off until at least one pick", async () => {
    await btn(page, /Pick what kind of business you'll run/).click();
    await expect(next).toHaveText("Finish ›");
    await expect(next).toBeDisabled();
    await expect(hint).toHaveText("Pick at least one to keep going.");
  });
  await shot(t, "Offer door, nothing picked (Finish off)", next);
  await step(t, "Offer door: pick Dog walking and Dog Training (multi-select), then un-pick and re-pick", async () => {
    await btn(page, "Dog walking").click();
    await btn(page, "Dog Training").click();
    await expect(btn(page, "Dog walking")).toHaveAttribute("aria-pressed", "true");
    await expect(btn(page, "Dog Training")).toHaveAttribute("aria-pressed", "true");
    await btn(page, "Dog Training").click();
    await expect(btn(page, "Dog Training")).toHaveAttribute("aria-pressed", "false");
    await btn(page, "Dog Training").click();
    await expect(next).toBeEnabled();
  });
  await fits(t, "Offer door", next);
  await shot(t, "Offer door, two picked", next);
  await step(t, "Finish the offer door: back on the doors, it shows Done and Find the why is up next", async () => {
    await next.click();
    await expect(btn(page, /Pick what kind of business you'll run/)).toContainText("Done");
    await expect(btn(page, /Find the why/)).toContainText("Up next");
  });
  await shot(t, "Level 1 doors after the offer door", btn(page, /Find the why/));

  // Why (rank-order): AC3 drag and drop, with a keyboard fallback
  const tiles = page.locator('ol[aria-label="Your ranking"] [data-rank-item]');
  const below = page.locator("[data-below-line] [data-rank-item]");
  await step(t, "Find the why: exactly 4 items in order, no arrow buttons, no 'Prove I can do it' or 'Support a cause'", async () => {
    await btn(page, /Find the why/).click();
    await expect(page.locator("[data-rank-item]")).toHaveCount(4);
    await expect(main(page)).not.toContainText("Prove I can do it");
    await expect(main(page)).not.toContainText("Support a cause");
    await expect(main(page).getByRole("button", { name: /^Move .* (up|down)/ })).toHaveCount(0);
    const labels = await tiles.allInnerTexts();
    ["Make money", "Help others", "Learn new skills", "Be my own boss"].forEach((l, i) => expect(labels[i]).toContain(l));
    await expect(next).toBeEnabled();
  });
  await fits(t, "Find the why", next);
  await shot(t, "Find the why, authored order (drag to reorder)", next);
  await step(t, "Find the why: drag Help others to the top (pointer drag)", async () => {
    const from = (await tiles.filter({ hasText: "Help others" }).boundingBox())!;
    const to = (await tiles.first().boundingBox())!;
    await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
    await page.mouse.down();
    const y0 = from.y + from.height / 2;
    for (let i = 1; i <= 10; i++) await page.mouse.move(from.x + from.width / 2, y0 + ((to.y + 4 - y0) * i) / 10);
    await expect(page.locator("[data-rank-ghost]")).toHaveCount(1);
    await shot(t, "Find the why, mid-drag (ghost tile)", null);
    await page.mouse.up();
    await expect(tiles.first()).toContainText("Help others");
    await expect(tiles.nth(1)).toContainText("Make money");
  });
  await shot(t, "Find the why, Help others dragged to number 1", next);
  await step(t, "Find the why: keyboard fallback moves Be my own boss below the line and back", async () => {
    const boss = page.locator("[data-rank-item='be-my-own-boss']");
    await boss.focus();
    await page.keyboard.press("ArrowDown");
    await expect(tiles).toHaveCount(3);
    await expect(below).toHaveCount(1);
    await expect(page.locator("[data-rank-announce]")).toContainText(/Be my own boss/);
    await expect(next).toBeEnabled();
    await shot(t, "Find the why, Be my own boss below the line (keyboard)", next);
    await page.locator("[data-rank-item='be-my-own-boss']").focus();
    await page.keyboard.press("ArrowUp");
    await expect(tiles).toHaveCount(4);
    await expect(tiles.first()).toContainText("Help others");
    await expect(tiles.last()).toContainText("Be my own boss");
  });
  await step(t, "Finish Find the why", async () => {
    await next.click();
    await expect(btn(page, /Know your impact/)).toContainText("Up next");
  });

  // Impact (single choice)
  await step(t, "Know your impact: Finish off until a choice; single choice replaces the last one", async () => {
    await btn(page, /Know your impact/).click();
    await expect(next).toBeDisabled();
    await expect(hint).toHaveText("Make a choice to keep going.");
    await btn(page, "Animals").click();
    await btn(page, "The environment").click();
    await expect(btn(page, "Animals")).toHaveAttribute("aria-pressed", "false");
    for (const l of ["Animals", "The environment", "Kids in need", "People who are hungry", "Older people"]) await expect(btn(page, l)).toBeVisible();
    await expect(btn(page, "The environment")).toHaveAttribute("aria-pressed", "true");
    await expect(next).toBeEnabled();
  });
  await fits(t, "Know your impact", next);
  await shot(t, "Know your impact, The environment picked", next);
  const done1 = page.locator('[data-silver-done="l1-s1"]');
  await step(t, "Finish Know your impact: AC14 after-step message (no wrap-up), with handbook link and Back to the lift", async () => {
    await next.click();
    await expect(done1).toBeVisible();
    await expect(done1.getByRole("heading", { name: "Nice work! Define the business is done." })).toBeVisible();
    await expect(done1.locator("[data-silver-done-message]")).toHaveText(
      "See your progress in your workbook, or wait until you've completed all the steps in this level.",
    );
    await expect(done1.locator("[data-see-handbook]")).toHaveText("See my workbook");
    await expect(done1.locator("[data-keep-going]")).toHaveText("Keep going");
    await expect(done1.locator("[data-back-to-lift]")).toBeVisible();
    await expect(page.locator("[data-wrap-up]")).toHaveCount(0);
    expect(await done1.innerText()).not.toMatch(/\b(silver|bronze|gold|NGA)\b/i);
  });
  await fits(t, "After-step message l1-s1", done1.locator("[data-keep-going]"));
  await shot(t, "After-step message, Define the business done", done1.locator("[data-keep-going]"));

  await step(t, "Keep going: Level 1 corridor, Set your goals up next", async () => {
    await done1.locator("[data-keep-going]").click();
    await expect(page.locator("#lp-corridor-title")).toHaveText(/Level 1 · Vision and Goals/, { timeout: 15_000 });
    await expect(page.locator("[data-level-done]")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Set your goals, up next/ })).toBeVisible();
  });
  await shot(t, "Level 1 corridor, Set your goals up next", page.getByRole("button", { name: /Set your goals, up next/ }));

  // Goals (l1-s2)
  const goalPage = async (n: number, title: string) => {
    await expect(main(page)).toContainText(`Goal ${n} of 6`, { ignoreCase: true });
    await expect(main(page)).toContainText(title);
  };
  await step(t, "Set your goals: Step 1 of 6 shows the intro, the guidance and goal 1's input together", async () => {
    await page.getByRole("button", { name: /Set your goals, up next/ }).click();
    await expect(btn(page, /Set your goals/)).toContainText("Up next");
    await btn(page, /Set your goals/).click();
    await expect(main(page)).toContainText("Step 1 of 6");
    await goalPage(1, "Help others");
  });

  let benefitLabel = "";
  await step(t, "Goal 1 (row 7): Help others, 'I want [number] customers to [pick one]', four benefits, no timeframe", async () => {
    await expect(main(page).getByLabel("Weeks or months")).toHaveCount(0);
    await expect(main(page).locator("[data-sentence]")).toContainText("I want");
    await expect(main(page).locator("[data-sentence]")).toContainText("customers to");
    const benefit = main(page).getByLabel("What your customers get");
    const opts = await benefit.locator("option").evaluateAll((o) => o.map((e) => (e as HTMLOptionElement).value).filter(Boolean));
    expect(opts).toHaveLength(4);
    await expect(next).toBeDisabled();
    await main(page).getByLabel("Number of customers").fill("5");
    await benefit.selectOption({ index: 1 });
    benefitLabel = (await benefit.locator("option:checked").innerText()).trim();
    await expect(next).toBeEnabled();
    passed(t, "Help others goal sentence", await main(page).locator("[data-sentence]").innerText());
  });
  await fits(t, "Goal 1 Help others", next);
  await shot(t, "Goal 1 of 6, Help others, customers and benefit picked", next);

  await step(t, "Goal 2 (row 6): Make money, weeks preset, saving for", async () => {
    await next.click();
    await goalPage(2, "Make money");
    await expect(main(page).getByLabel("Weeks or months")).toHaveValue("weeks");
    await expect(main(page).locator("[data-sentence]")).toContainText("I'm saving for");
    await expect(next).toBeDisabled();
    await main(page).getByLabel("Amount").fill("500");
    await main(page).getByLabel("Number").fill("6");
    await main(page).getByLabel("Saving for").fill("TEST a new bike");
    await expect(main(page).locator("[data-currency-chip]")).not.toHaveText("—");
    await expect(next).toBeEnabled();
  });
  await fits(t, "Goal 2 Make money", next);
  await shot(t, "Goal 2 of 6, Make money, weeks preset, filled", next);

  await step(t, "Previous goes back to goal 1 with its answers kept", async () => {
    await main(page).getByRole("button", { name: "‹ Previous" }).click();
    await goalPage(1, "Help others");
    await expect(main(page).getByLabel("Number of customers")).toHaveValue("5");
    await next.click();
    await goalPage(2, "Make money");
    await expect(main(page).getByLabel("Amount")).toHaveValue(/500/);
  });

  await step(t, "Goal 3 (row 8): Skills dropdown prefills an editable success line, swapped until I type", async () => {
    await next.click();
    await goalPage(3, "Learn new skills");
    const skill = main(page).getByLabel("Skill");
    const line = main(page).getByLabel("I'll know I've done it when I can");
    await expect(main(page).getByLabel("Weeks or months")).toHaveValue("weeks");
    await skill.selectOption("talking-to-customers");
    await expect(line).toHaveValue("handle a new customer's questions from first contact to booking without help");
    await shot(t, "Goal 3 of 6, Skills prefill after the first pick", next);
    await skill.selectOption("managing-my-money");
    await expect(line).toHaveValue("track every dollar coming in and going out of my business");
    await shot(t, "Goal 3 of 6, Skills prefill swapped on a new pick", next);
    await line.fill("TEST run my own books");
    await skill.selectOption("planning-my-time");
    await expect(line).toHaveValue("TEST run my own books");
    await main(page).getByLabel("Number").fill("3");
    await expect(next).toBeEnabled();
  });
  await fits(t, "Goal 3 Learn new skills", next);
  await shot(t, "Goal 3 of 6, Skills, my own words kept after a new pick", next);

  await step(t, "Goal 4: Be my own boss, one choice", async () => {
    await next.click();
    await goalPage(4, "own boss");
    await expect(next).toBeDisabled();
    await expect(hint).toHaveText("Make a choice to keep going.");
    await btn(page, "Choosing when I work (my own schedule and hours)").click();
    await expect(next).toBeEnabled();
  });
  await fits(t, "Goal 4 Be my own boss", next);
  await shot(t, "Goal 4 of 6, Be my own boss, picked", next);

  await step(t, "Goal 5: Support a cause carries my cause (to support the environment), optional, fill 10", async () => {
    await next.click();
    await goalPage(5, "Support a cause");
    await expect(main(page).locator("[data-sentence]")).toContainText("to support the environment");
    await expect(main(page).locator("[data-optional-tag]")).toHaveText("Optional");
    await expect(next).toBeEnabled();
    await main(page).getByLabel("Percent").fill("0");
    await expect(next).toBeDisabled();
    await main(page).getByLabel("Percent").fill("10");
    await expect(next).toBeEnabled();
  });
  await fits(t, "Goal 5 Support a cause", next);
  await shot(t, "Goal 5 of 6, Support a cause, filled", next);

  await step(t, "Goal 6 (row 11): One more goal, weeks preset; Add this goal off until typed, Skip for now shown", async () => {
    await next.click();
    await goalPage(6, "One more goal?");
    await expect(main(page)).toContainText("This one's optional. You can skip it and keep going.");
    await expect(main(page).locator("[data-optional-tag]")).toHaveText("Optional");
    await expect(next).toHaveText("Add this goal");
    await expect(next).toBeDisabled();
    await expect(main(page).locator("[data-skip-for-now]")).toHaveText("Skip for now");
    const sentence = main(page).locator("[data-sentence]");
    await expect(sentence).toContainText("My goal is to");
    await expect(sentence.getByLabel("Weeks or months")).toHaveValue("weeks");
    await shot(t, "Goal 6 of 6, One more goal, empty (Add this goal off, Skip for now)", next);
    await sentence.getByLabel("My goal").fill("TEST other goal");
    await expect(next).toBeEnabled();
    await sentence.getByLabel("Number").fill("6");
  });
  await fits(t, "Goal 6 One more goal", next);
  await shot(t, "Goal 6 of 6, One more goal, filled", next);

  const done2 = page.locator('[data-silver-done="l1-s2"]');
  await step(t, "Add this goal: after-step message for Set your goals", async () => {
    await next.click();
    await expect(done2).toBeVisible();
    await expect(done2.getByRole("heading", { name: "Nice work! Set your goals is done." })).toBeVisible();
  });
  await fits(t, "After-step message l1-s2", done2.locator("[data-keep-going]"));
  await shot(t, "After-step message, Set your goals done", done2.locator("[data-keep-going]"));

  const hb1 = page.getByRole("dialog");
  await step(t, "See my workbook opens the handbook at the Set your goals page, goals editable inline (AA6 to AA8)", async () => {
    await done2.locator("[data-see-handbook]").click();
    const gp = hb1.locator('[data-handbook-page="l1-s2"]');
    await expect(gp).toBeVisible();
    await expect(gp).toContainText("TEST a new bike");
    await expect(gp).toContainText("TEST run my own books");
    await expect(hb1.locator("[data-back-to-lift]")).toBeVisible();
    await shot(t, "Handbook from the after-step message, Set your goals page", null);
    await gp.locator("[data-pencil]").first().click();
    await gp.locator("[data-summary-line='l1-goal-make-money'] [data-pencil]").click();
    const ed = gp.locator("[data-inline-editor='l1-goal-make-money']");
    await ed.getByLabel("Saving for").fill("TEST a used bike");
    await shot(t, "Handbook goals page, saving for editor open", null);
    await ed.getByRole("button", { name: "Save" }).click();
    await expect(gp).toContainText("TEST a used bike");
  });
  await step(t, "Handbook Back to the lift lands on the Level 1 corridor", async () => {
    await hb1.locator("[data-back-to-lift]").click();
    await expect(hb1).toHaveCount(0);
    await expect(page.locator("#lp-corridor-title")).toHaveText(/Level 1 · Vision and Goals/, { timeout: 15_000 });
    await expect(page.getByRole("button", { name: /The Brand, up next/ })).toBeVisible();
  });
  await shot(t, "Back to the lift from the handbook: Level 1 corridor, The Brand up next", page.getByRole("button", { name: /The Brand, up next/ }));

  await step(t, "Workbook cover after Set your goals: logo on top, then name placeholder, the vision filled", async () => {
    await page.getByRole("button", { name: /Back to building/ }).click();
    await page.getByRole("button", { name: "Open handbook" }).first().click();
    const dlg = page.getByRole("dialog");
    await expect(dlg.locator("[data-handbook-page]").first()).toBeVisible();
    const coverBtn = dlg.getByRole("button", { name: "Previous page" });
    for (let i = 0; i < 4; i++) {
      if (await dlg.locator('[data-handbook-page="cover"]').isVisible().catch(() => false)) break;
      await coverBtn.click();
    }
    const cover = dlg.locator('[data-handbook-page="cover"]');
    await expect(cover).toBeVisible();
    await expect(cover.locator('[data-cover-logo="empty"]')).toContainText("Your logo goes here");
    await expect(cover.locator('[data-cover-name="empty"]')).toHaveText("Your business name");
    const logoY = (await cover.locator("[data-cover-logo]").boundingBox())!.y;
    const nameY = (await cover.locator("[data-cover-name]").boundingBox())!.y;
    expect(logoY, "logo above the name").toBeLessThan(nameY);
    await expect(cover.locator("[data-vision-sentence]")).toContainText(/^I am starting a dog walking business\./);
    await expect(cover.locator("[data-pencil], [data-edit-identity]")).toHaveCount(0);
    expect(await cover.innerText()).not.toMatch(/\b(silver|bronze|gold|NGA)\b/i);
    passed(t, "Cover vision after Set your goals", await cover.locator("[data-vision-sentence]").innerText());
  });
  await shot(t, "Workbook cover, logo and name empty", null);
  await step(t, "Close the workbook and go back to the Level 1 corridor", async () => {
    await page.getByRole("button", { name: "Close handbook" }).click();
    await btn(page, "Go to Level 1").click();
    await expect(page.getByRole("button", { name: /The Brand, up next/ })).toBeVisible();
  });

  await step(t, "Open The Brand: Design your logo door up next (AC13 logo before name)", async () => {
    await page.getByRole("button", { name: /The Brand, up next/ }).click();
    await expect(btn(page, /Design your logo/)).toContainText("Up next");
    await expect(btn(page, /Name your business/)).toHaveCount(0);
    // The locked Name your business door sits below Design your logo.
    const logoBox = await page.locator("main").getByText("Design your logo", { exact: true }).boundingBox();
    const nameBox = await page.locator("main").getByText("Name your business", { exact: true }).boundingBox();
    expect(logoBox && nameBox && nameBox.y > logoBox.y, "Name your business is below Design your logo").toBeTruthy();
  });
  await shot(t, "The Brand doors, logo first", btn(page, /Design your logo/));

  await step(t, "Logo builder: Continue off until shape, color and icon are picked", async () => {
    await btn(page, /Design your logo/).click();
    await expect(next).toHaveText("Continue");
    await expect(next).toBeDisabled();
    await expect(hint).toHaveText("Pick a shape, a color and an icon to keep going.");
    for (const tab of ["Shape", "Color", "Icon"]) await expect(main(page).getByRole("tab", { name: tab })).toBeVisible();
  });
  await fits(t, "Logo builder", next);
  await shot(t, "Logo builder, empty", next);
  await step(t, "Logo builder: pick Shield, Orange, Bone through the tabs", async () => {
    await main(page).getByRole("tab", { name: "Shape" }).click();
    await main(page).getByRole("radio", { name: "Shield" }).click();
    await main(page).getByRole("tab", { name: "Color" }).click();
    await main(page).getByRole("radio", { name: "Orange" }).click();
    await main(page).getByRole("tab", { name: "Icon" }).click();
    await expect(main(page).getByRole("radio")).toHaveCount(3);
    await main(page).getByRole("radio", { name: "Bone" }).click();
    await expect(main(page).getByRole("radio", { name: "Bone" })).toHaveAttribute("aria-checked", "true");
    await expect(next).toBeEnabled();
  });
  await shot(t, "Logo builder, Shield Orange Bone", next);
  await step(t, "Save logo: back on the doors with Name your business up next", async () => {
    await next.click();
    if (await btn(page, "See your logo").count()) await btn(page, "See your logo").click();
    await expect(btn(page, /Name your business/)).toContainText("Up next");
  });

  await step(t, "Name your business: Save off until name, font and font color", async () => {
    await btn(page, /Name your business/).click();
    await expect(next).toHaveText("Save to my workbook");
    await expect(next).toBeDisabled();
    const name = main(page).getByRole("textbox", { name: /Business name/ });
    await name.fill("TEST Business Name");
    await main(page).getByRole("radio", { name: "Rounded" }).click();
    await main(page).getByRole("radio", { name: "Dark ink" }).click();
    await expect(next).toBeEnabled();
  });
  await fits(t, "Name your business", next);
  await shot(t, "Name your business, filled (logo already made)", next);

  await step(t, "Save name: last step of the level goes straight to Level 1 done (no wrap-up, no after-step message)", async () => {
    await next.click();
    await expect(page.locator("[data-wrap-up]")).toHaveCount(0);
    await expect(page.locator("[data-silver-done]")).toHaveCount(0);
    await expect(page.locator("#lp-corridor-title")).toHaveText(/Level 1 · Vision and Goals/, { timeout: 15_000 });
    await expect(page.locator("[data-level-done='1']")).toHaveText("Congratulations!You've completed Level 1");
    await expect(page.locator("[data-plaque-tick]")).toHaveCount(3);
    await expect(page.getByText(/Gold unlocked|move on/)).toHaveCount(0);
  });
  await shot(t, "Level 1 done on the lift", btn(page, "Go to Level 2"));

  // ---------- 4. Level 2 ----------
  await step(t, "Go to Level 2: lift, then the Level 2 corridor (one section)", async () => {
    await btn(page, "Go to Level 2").click();
    await expect(page.locator("#lp-corridor-title")).toHaveText(/Level 2 · Planning/, { timeout: 15_000 });
    await expect(page.getByRole("button", { name: /The Brand/ })).toHaveCount(0);
  });
  await shot(t, "Level 2 corridor", page.getByRole("button", { name: /The product and its buyers, up next/ }));


  await step(t, "Open The product and its buyers: 2 doors", async () => {
    await page.getByRole("button", { name: /The product and its buyers, up next/ }).click();
    await expect(btn(page, /Decide what to sell/)).toContainText("Up next");
    await expect(main(page).getByText("Know who your customers are", { exact: true })).toBeVisible();
  });
  await shot(t, "Level 2 silver 1 doors", btn(page, /Decide what to sell/));

  await step(t, "Decide what to sell: both boxes needed", async () => {
    await btn(page, /Decide what to sell/).click();
    await expect(next).toBeDisabled();
    const boxes = main(page).locator("textarea, input[type=text]");
    expect(await boxes.count()).toBeGreaterThanOrEqual(2);
    await boxes.nth(0).fill("TEST product");
    await expect(next).toBeDisabled();
    await boxes.nth(1).fill("TEST availability");
    await expect(next).toBeEnabled();
  });
  await shot(t, "Decide what to sell, filled", next);
  await step(t, "Finish Decide what to sell", async () => {
    await next.click();
    await expect(btn(page, /Know who your customers are/)).toContainText("Up next");
  });

  await step(t, "Know who your customers are (demand screens): real-world task, number, yes/no, text", async () => {
    await btn(page, /Know who your customers are/).click();
    await expect(main(page)).toContainText(/Real-world task/i);
    await expect(next).toBeDisabled();
    const texts = main(page).locator("input[type=text], textarea");
    // First input is the number asked.
    await texts.nth(0).fill("8");
    await main(page).locator("select").first().selectOption({ index: 1 });
    await texts.nth(1).fill("TEST interest");
    await expect(next).toBeEnabled();
  });
  await shot(t, "Find out if people want it, filled", next);

  const done21 = page.locator('[data-silver-done="l2-s1"]');
  await step(t, "Finish: Level 2 step 1 after-step message (no wrap-up)", async () => {
    await next.click();
    await expect(page.locator("[data-wrap-up]")).toHaveCount(0);
    await expect(done21).toBeVisible();
    await expect(done21.getByRole("heading", { name: "Nice work! The product and its buyers is done." })).toBeVisible();
  });
  await shot(t, "After-step message, The product and its buyers done", done21.locator("[data-keep-going]"));

  await step(t, "See my workbook: edit what I am selling with the pencil on the handbook page", async () => {
    await done21.locator("[data-see-handbook]").click();
    const pg = page.getByRole("dialog").locator('[data-handbook-page="l2-s1"]');
    await expect(pg).toContainText("TEST product");
    await expect(pg).toContainText("TEST availability");
    await expect(pg).toContainText("TEST interest");
    const sec = pg.locator('[data-summary-section="what-i-am-selling"]');
    await sec.locator("[data-pencil]").first().click();
    const ed = pg.locator("[data-inline-editor]");
    await expect(ed).toBeVisible();
    await ed.locator("textarea, input[type=text]").first().fill("TEST product edit");
    await ed.getByRole("button", { name: "Save" }).click();
    await expect(sec).toContainText("TEST product edit");
  });
  await shot(t, "Handbook, Level 2 step 1 page after the edit", null);

  await step(t, "Back to the lift: Level 2 corridor with Pricing up next", async () => {
    await page.getByRole("dialog").locator("[data-back-to-lift]").click();
    await expect(page.locator("#lp-corridor-title")).toHaveText(/Level 2 · Planning/);
    await expect(page.locator("[data-level-done='2']")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Pricing, up next/ })).toBeVisible();
  });
  await shot(t, "Level 2 corridor, Pricing up next", page.getByRole("button", { name: /Pricing, up next/ }));

  // ---------- 5. Handbook ----------
  const hb = page.getByRole("dialog");
  await step(t, "Building: handbook button; open it, it shows my saved answers", async () => {
    await page.getByRole("button", { name: /Back to building/ }).click();
    // Back to building lands on the building overview (lift), not the corridor.
    await expect(page.getByRole("button", { name: "Go to Level 2" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Open handbook" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Open handbook" }).first().click();
    await expect(hb).toBeVisible();
    await expect(hb.locator("[data-handbook-page]").first()).toBeVisible();
  });
  await shot(t, "Handbook from the building", null);

  await step(t, "Handbook tabs: Level 1 and Level 2 open their pages, Level 3 onward not earned", async () => {
    const tabs = hb.getByRole("navigation", { name: "Handbook floors" }).getByRole("button");
    const labels = await tabs.evaluateAll((els) => els.map((e) => `${e.getAttribute("aria-label")}${(e as HTMLButtonElement).disabled ? " [off]" : ""}`));
    passed(t, "Handbook tab labels", labels.join(" | "));
    await hb.getByRole("button", { name: "Level 1, Vision and Goals" }).click();
    await expect(hb.locator('[data-handbook-page="l1-s1"]')).toBeVisible();
    // Walk to cover
    const prev = hb.getByRole("button", { name: "Previous page" });
    for (let i = 0; i < 4; i++) {
      if (await hb.locator('[data-handbook-page="cover"]').isVisible().catch(() => false)) break;
      await prev.click();
    }
    const cover = hb.locator('[data-handbook-page="cover"]');
    await expect(cover.locator('[data-cover-logo="filled"]')).toBeVisible();
    await expect(cover.locator('[data-cover-name="filled"]')).toHaveText("TEST Business Name");
    await expect(cover.locator("[data-vision-quote]")).toBeVisible();
    await expect(cover.locator("[data-vision-sentence]")).toContainText("As I grow, I'll give 10% of every sale to support the environment.");
    await expect(cover.locator("[data-vision-sentence]")).toContainText(benefitLabel);
    await shot(t, "Workbook cover, filled", null);
    await hb.getByRole("button", { name: "Next page" }).click();
    await expect(hb.locator('[data-handbook-page="l1-s1"]')).toBeVisible();
    const l1Tab = hb.getByRole("button", { name: "Level 1, Vision and Goals" });
    await expect(l1Tab).toHaveAttribute("data-viewed", /.*/);
    const outline = await l1Tab.evaluate((e) => {
      const s = getComputedStyle(e);
      return `${s.outlineStyle} ${s.outlineColor} ${s.outlineWidth}`;
    });
    expect(outline, "viewed tab has the orange ring").toContain("rgb(255, 165, 3)");
    expect(outline).not.toMatch(/^none/);
    await expect(hb.getByRole("button", { name: /Level 3.*not earned yet/ })).toBeVisible();
  });
  await shot(t, "Handbook, Level 1 page with orange viewed ring", null);

  await step(t, "Handbook: Next page walks past goals to the identity page (l1-s3), then Level 2", async () => {
    await hb.getByRole("button", { name: "Next page" }).click(); // l1-s2 Set your goals
    await expect(hb.locator('[data-handbook-page="l1-s2"]')).toBeVisible();
    await hb.getByRole("button", { name: "Next page" }).click(); // l1-s3 The Brand
    const idPage = hb.locator('[data-handbook-page="l1-s3"]');
    await expect(idPage).toBeVisible();
    await expect(idPage).toContainText("TEST Business Name");
    // AC12: the workbook identity page shows the logo above the name.
    const pageLogo = await idPage.locator("svg").first().boundingBox();
    const pageName = await idPage.getByText("TEST Business Name", { exact: true }).first().boundingBox();
    expect(pageLogo && pageName && pageName.y > pageLogo.y, "logo above name on the identity page").toBeTruthy();
    await expect(idPage.locator("[data-identity-page-vision] [data-vision-sentence]")).toContainText(/^I am starting a dog walking business\./);
    await shot(t, "Workbook identity page", null);
    await idPage.getByRole("button", { name: /^Edit/ }).click();
    const done = idPage.locator("[data-inline-editor-done]");
    await expect(done).toBeVisible();
    expect((await done.boundingBox())!.width).toBeLessThan(140);
    const fit = await idPage.getByRole("radiogroup", { name: "Logo shape" }).evaluate((g) => {
      const card = g.closest(".bg-white")!.getBoundingClientRect();
      return [...g.querySelectorAll("button")].every((t) => {
        const r = t.getBoundingClientRect();
        return r.left >= card.left - 0.5 && r.right <= card.right + 0.5;
      });
    });
    expect(fit).toBe(true);
    await shot(t, "Workbook identity page, inline editor open", null);
    await done.click();
    await expect(done).toHaveCount(0);
    await hb.getByRole("button", { name: "Next page" }).click();
    await expect(hb.locator('[data-handbook-page="l2-s1"]')).toBeVisible();
    await expect(hb.locator('[data-handbook-page="l2-s1"]')).toContainText("TEST product edit");
    await shot(t, "Handbook, Level 2 silver 1 page", null);
    const l2Tab = hb.getByRole("button", { name: "Level 2, Planning" });
    await expect(l2Tab).toHaveAttribute("data-viewed", /.*/);
    await hb.getByRole("button", { name: "Previous page" }).click();
    await expect(hb.locator('[data-handbook-page="l1-s3"]')).toBeVisible();
  });
  await shot(t, "Handbook, Level 2 pages", null);

  await step(t, "Close the handbook; home tile still shows Planning (Pricing open) and a handbook button", async () => {
    await page.getByRole("button", { name: "Close handbook" }).click();
    await expect(hb).toHaveCount(0);
    await page.getByRole("button", { name: /Launchpad/ }).first().click();
    const tile = page.locator('[data-in-progress="dog-walking"]');
    await expect(tile.locator("[data-tile-level-name]")).toContainText("Planning");
    await expect(tile.locator('[data-handbook-button=""]')).toBeVisible();
    await expect(tile.getByRole("progressbar")).toBeVisible();
  });
  await shot(t, "Home, In Progress tile, workbook button active", page.locator('[data-in-progress="dog-walking"]').getByRole("button", { name: "Continue" }));

  await step(t, "Home handbook opens read-only with my answers", async () => {
    await page.locator('[data-in-progress="dog-walking"] [data-handbook-button]').click();
    await expect(page.locator('[data-handbook="home"]')).toBeVisible();
    await expect(page.locator('[data-handbook="home"]')).toContainText("Read only");
    await expect(page.locator('[data-handbook="home"] [data-handbook-page][data-editable="true"]')).toHaveCount(0);
    const home = page.locator('[data-handbook="home"]');
    // The handbook opens on the latest earned page (by design: handbookOpenIndex), so it starts on The product and its buyers.
    await expect(home.locator('[data-handbook-page="l2-s1"]')).toBeVisible();
    await expect(home.locator('[data-handbook-page="l2-s1"]')).toContainText("TEST product edit");
    // The edited Level 1 answer is saved and shows on the Level 1 page.
    const saved = await page.evaluate(() => localStorage.getItem("lp-venture-test:v1:dog-walking") ?? "");
    expect(saved).toContain("TEST a used bike");
    await home.getByRole("button", { name: "Level 1, Vision and Goals" }).click();
    // Goals live in the cover vision (D30: no Define wrap); walk to cover and check.
    const prevHome = home.getByRole("button", { name: "Previous page" });
    for (let i = 0; i < 4; i++) {
      if (await home.locator('[data-handbook-page="cover"]').isVisible().catch(() => false)) break;
      await prevHome.click();
    }
    await expect(home.locator('[data-handbook-page="cover"] [data-vision-sentence]')).toContainText(benefitLabel);
    await expect(home.locator('[data-handbook-page="cover"] [data-vision-sentence]')).toContainText(/the environment/i);
    await expect(page.locator('[data-handbook="home"] [data-pencil]')).toHaveCount(0);
  });
  await shot(t, "Handbook from home, read only", null);
  await page.getByRole("button", { name: "Close handbook" }).click();

  await step(t, "Cause skipped (Support a cause goal left empty): the cover drops the cause clause", async () => {
    // TEST-ONLY: clear the optional Support a cause goal in the saved test progress, as if it was left empty.
    await page.evaluate(() => {
      const k = "lp-venture-test:v1:dog-walking";
      const p = JSON.parse(localStorage.getItem(k) ?? "{}");
      if (p.answers) delete p.answers["l1-goal-support-a-cause"];
      localStorage.setItem(k, JSON.stringify(p));
    });
    await page.goto(ROUTE); // not reload: the URL still carries ?reset=1
    await page.locator('[data-in-progress="dog-walking"] [data-handbook-button]').click();
    const home = page.locator('[data-handbook="home"]');
    await home.getByRole("button", { name: "Level 1, Vision and Goals" }).click();
    await home.getByRole("button", { name: "Previous page" }).click();
    const s = home.locator('[data-handbook-page="cover"] [data-vision-sentence]');
    await expect(s).toBeVisible();
    await expect(s).not.toContainText("As I grow");
    await expect(s).toContainText("My goals: ");
    passed(t, "Cover vision, cause skipped", await s.innerText());
  });
  await shot(t, "Workbook cover, cause skipped", null);
  await page.getByRole("button", { name: "Close handbook" }).click();
  return t;
}
