/**
 * The full Launchpad venture journey on /test-launchpad-venture, shared by the
 * mobile and desktop specs: home tile, onboarding, building, every Level 1
 * and Level 2 bronze door (really answered), the after-step messages (AC14,
 * no wrap-ups), the Level 1 done lift, then the handbook.
 */
import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import { fits, nextButton, passed, ROUTE, shot, step, track } from "./launchpad-venture-helpers";

const main = (page: Page) => page.locator("main");
const btn = (page: Page, name: string | RegExp, exact = true) =>
  main(page).getByRole("button", typeof name === "string" ? { name, exact } : { name });


/** The workbook opens on page 1 (the cover); Next page walks forward in order until this page shows. */
async function turnTo(dlg: Locator, pageId: string) {
  await expect(dlg.locator('[data-handbook-page="cover"]')).toBeVisible({ timeout: 15_000 });
  for (let i = 0; i < 12; i++) {
    if (await dlg.locator(`[data-handbook-page="${pageId}"]`).isVisible().catch(() => false)) return;
    await dlg.getByRole("button", { name: "Next page" }).click();
  }
  await expect(dlg.locator(`[data-handbook-page="${pageId}"]`)).toBeVisible();
}

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
  const cue = page.getByRole("button", { name: "Open my workbook" });
  await step(t, "Finish Know your impact: straight back to the Level 1 corridor, no end screen, the workbook button pops in", async () => {
    await next.click();
    await expect(page.locator("#lp-corridor-title")).toHaveText(/Level 1 · Vision and Goals/, { timeout: 15_000 });
    await expect(page.locator("[data-silver-done], [data-wrap-up]")).toHaveCount(0);
    await expect(page.locator("main")).not.toContainText(/Nice work!|Keep going|See my (handbook|workbook)/);
    await expect(page.locator("[data-level-done]")).toHaveCount(0);
    await expect(cue).toBeVisible();
    await expect(cue).toHaveAttribute("data-corridor-workbook", "pop-in");
    const look = await cue.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { bg: cs.backgroundColor, border: cs.borderTopWidth, anim: cs.animationDuration, icon: !!el.querySelector("svg") };
    });
    expect(look.bg).toBe("rgb(255, 255, 255)");
    expect(look.border).toBe("2px");
    expect(look.icon).toBe(true);
    expect(look.anim).toBe("0.2s");
    await expect(page.getByRole("button", { name: /Set your goals, up next/ })).toBeVisible();
  });
  await fits(t, "Corridor, after Define the business", cue, { pageScrollOk: true });
  await shot(t, "Lift with the workbook button after Define the business", cue);
  await step(t, "Open my workbook from the lift: Define the business page, then Back to the lift returns to the corridor", async () => {
    await cue.click();
    await turnTo(page.getByRole("dialog"), "l1-s1");
    await shot(t, "Workbook opened from the lift, Define the business", page.locator("[data-back-to-lift]"));
    await page.locator("[data-back-to-lift]").click();
    await expect(page.locator("#lp-corridor-title")).toHaveText(/Level 1 · Vision and Goals/, { timeout: 15_000 });
    await expect(cue).toHaveAttribute("data-corridor-workbook", "");
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
  await step(t, "Goal 1 (row 7): Help others, 'I want [number] customers to [pick one] in [number] [weeks|months]', four benefits, weeks preset", async () => {
    await expect(main(page).getByLabel("Weeks or months")).toHaveValue("weeks");
    await expect(main(page).locator("[data-sentence]")).toContainText(" in ");
    await expect(main(page).locator("[data-sentence]")).toContainText("I want");
    await expect(main(page).locator("[data-sentence]")).toContainText("customers to");
    const benefit = main(page).getByLabel("What your customers get");
    const opts = await benefit.locator("option").evaluateAll((o) => o.map((e) => (e as HTMLOptionElement).value).filter(Boolean));
    expect(opts).toHaveLength(4);
    await expect(next).toBeDisabled();
    await main(page).getByLabel("Number of customers").fill("5");
    await benefit.selectOption({ index: 1 });
    benefitLabel = (await benefit.locator("option:checked").innerText()).trim();
    await expect(next).toBeDisabled();
    await main(page).getByLabel("Number", { exact: true }).fill("3");
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

  await step(t, "Add this goal: Set your goals done, straight back to the corridor with the workbook button", async () => {
    await next.click();
    await expect(page.locator("#lp-corridor-title")).toHaveText(/Level 1 · Vision and Goals/, { timeout: 15_000 });
    await expect(page.locator("[data-silver-done]")).toHaveCount(0);
    await expect(cue).toHaveAttribute("data-corridor-workbook", "pop-in");
  });
  await fits(t, "Corridor, after Set your goals", cue, { pageScrollOk: true });
  await shot(t, "Lift with the workbook button after Set your goals", cue);

  const hb1 = page.getByRole("dialog");
  await step(t, "Open my workbook opens on page 1; Next page to the Set your goals page, goals editable inline (AA6 to AA8)", async () => {
    await cue.click();
    await turnTo(hb1, "l1-s2");
    const gp = hb1.locator('[data-handbook-page="l1-s2"]');
    await expect(gp).toBeVisible();
    await expect(gp).toContainText("TEST a new bike");
    await expect(gp).toContainText("TEST run my own books");
    await expect(hb1.locator("[data-back-to-lift]")).toBeVisible();
    await shot(t, "Workbook from the lift, Set your goals page", null);
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
    await page.getByRole("button", { name: "Open workbook" }).first().click();
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
    await page.getByRole("button", { name: "Close workbook" }).click();
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
    await expect(cue).toHaveCount(0);
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

  await step(t, "Decide what to sell: a package for each service, then when", async () => {
    await btn(page, /Decide what to sell/).click();
    await expect(next).toBeDisabled();
    await page.getByRole("button", { name: "30-minute walk" }).click();
    await expect(next).toBeEnabled();
    await next.click();
    await expect(next).toBeDisabled();
    await page.getByRole("button", { name: "Basic manners session" }).click();
    await next.click();
    await page.getByRole("checkbox", { name: "Afternoon, Weekdays" }).click();
    await expect(next).toBeEnabled();
  });
  await shot(t, "Decide what to sell, filled", next);
  await step(t, "Finish Decide what to sell", async () => {
    await next.click();
    await expect(btn(page, /Know who your customers are/)).toContainText("Up next");
  });

  await step(t, "Know who your customers are: number, yes/no, and an interest chip", async () => {
    await btn(page, /Know who your customers are/).click();
    await expect(next).toBeDisabled();
    await page.getByRole("button", { name: "30-minute walk" }).click();
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page.getByText("When did your customers want walks?")).toBeVisible();
    await page.getByRole("checkbox", { name: "Morning, Weekdays" }).click();
    await expect(next).toBeEnabled();
  });
  await shot(t, "Find out if people want it, filled", next);

  await step(t, "Finish: Level 2 step 1 goes straight back to the Level 2 corridor with the workbook button", async () => {
    await next.click();
    await expect(page.locator("[data-wrap-up], [data-silver-done]")).toHaveCount(0);
    await expect(page.locator("#lp-corridor-title")).toHaveText(/Level 2 · Planning/, { timeout: 15_000 });
    await expect(cue).toHaveAttribute("data-corridor-workbook", "pop-in");
  });
  await shot(t, "Lift with the workbook button after The product and its buyers", cue);

  await step(t, "Open my workbook: edit what I am selling with the pencil on the workbook page", async () => {
    await cue.click();
    await turnTo(page.getByRole("dialog"), "l2-s1");
    const pg = page.getByRole("dialog").locator('[data-handbook-page="l2-s1"]');
    await expect(pg).toContainText("30-minute walk");
    await expect(pg).toContainText("weekday afternoons");
    await pg.getByRole("button", { name: "Dog walking" }).click();
    const ed = pg.locator("[data-inline-editor]");
    await expect(ed).toBeVisible();
    await ed.getByRole("button", { name: "15-minute walk" }).click();
    await ed.getByRole("button", { name: "Done" }).click();
    await expect(pg).toContainText("15-minute walk");
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
    await expect(page.getByRole("button", { name: "Open workbook" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Open workbook" }).first().click();
    await expect(hb).toBeVisible();
    // The workbook opens on page 1 (the cover), with the first dot active.
    await expect(hb.locator('[data-handbook-page="cover"]')).toBeVisible();
    await expect(hb.getByRole("button", { name: "Previous page" })).toBeDisabled();
    await expect(hb.locator("[data-page-dots] > span").first()).toHaveClass(/w-\[18px\]/);
  });
  await shot(t, "Handbook from the building, opens on page 1", null);

  await step(t, "Handbook tabs: Level 1 and Level 2 open their pages, Level 3 onward not earned", async () => {
    const tabs = hb.getByRole("navigation", { name: "Workbook floors" }).getByRole("button");
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

  await step(t, "Workbook: cover, Define, Set your goals, then Level 2 (no separate identity page, no Done chips); logo and name edit on the cover", async () => {
    await hb.getByRole("button", { name: "Next page" }).click(); // l1-s2 Set your goals
    await expect(hb.locator('[data-handbook-page="l1-s2"]')).toBeVisible();
    await expect(hb.locator("[data-page-dots] > span").nth(2)).toHaveClass(/w-\[18px\]/);
    await expect(hb.locator("[data-done-chip]")).toHaveCount(0);
    await shot(t, "Workbook page 3, Set your goals", null);
    await hb.getByRole("button", { name: "Next page" }).click(); // Level 2: no The Brand page (Cath, 5 Nov 5:35pm)
    await expect(hb.locator('[data-handbook-page="l2-s1"]')).toBeVisible();
    await expect(hb.locator('[data-handbook-page="l1-s3"]')).toHaveCount(0);
    await expect(hb.locator('[data-handbook-page="l2-s1"]')).toContainText("15-minute walk");
    await expect(hb.locator("[data-done-chip]")).toHaveCount(0);
    await shot(t, "Handbook, Level 2 silver 1 page", null);
    const l2Tab = hb.getByRole("button", { name: "Level 2, Planning" });
    await expect(l2Tab).toHaveAttribute("data-viewed", /.*/);
    await hb.getByRole("button", { name: "Previous page" }).click();
    await expect(hb.locator('[data-handbook-page="l1-s2"]')).toBeVisible();
    // Back to page 1, the cover: 80px logo centered at the top, then the name, then the vision (shown once).
    await hb.getByRole("button", { name: "Previous page" }).click();
    await hb.getByRole("button", { name: "Previous page" }).click();
    const cover = hb.locator('[data-handbook-page="cover"]');
    await expect(cover).toBeVisible();
    await expect(hb.locator("[data-vision-sentence]")).toHaveCount(1);
    await expect(cover.locator("[data-vision-sentence]")).toContainText(/^I am starting a dog walking business\./);
    const logo = (await cover.locator("[data-cover-logo] svg").first().boundingBox())!;
    const name = (await cover.locator("[data-business-name]").boundingBox())!;
    const card = (await cover.boundingBox())!;
    expect(logo.width).toBe(80);
    expect(name.y, "logo above name").toBeGreaterThan(logo.y);
    expect(Math.abs(logo.x + logo.width / 2 - (card.x + card.width / 2))).toBeLessThan(4);
    const overflow = await cover.evaluate((el) => {
      const sc = el.closest<HTMLElement>("[data-paper-scroll]")!;
      return sc.scrollHeight - sc.clientHeight;
    });
    expect(overflow, "cover fits the page card with no scrolling").toBeLessThanOrEqual(1);
    await cover.getByRole("button", { name: /^Edit/ }).click();
    const done = cover.locator("[data-inline-editor-done]");
    await expect(done).toBeVisible();
    expect((await done.boundingBox())!.width).toBeLessThan(140);
    const fit = await cover.getByRole("radiogroup", { name: "Logo shape" }).evaluate((g) => {
      const c = g.closest(".bg-white")!.getBoundingClientRect();
      return [...g.querySelectorAll("button")].every((b) => {
        const r = b.getBoundingClientRect();
        return r.left >= c.left - 0.5 && r.right <= c.right + 0.5;
      });
    });
    expect(fit).toBe(true);
    await shot(t, "Workbook cover, logo and name editor open", null);
    await done.click();
    await expect(done).toHaveCount(0);
  });
  await shot(t, "Handbook, Level 2 pages", null);

  await step(t, "Close the handbook; home tile still shows Planning (Pricing open) and a handbook button", async () => {
    await page.getByRole("button", { name: "Close workbook" }).click();
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
    // The workbook opens on page 1; Next page walks forward to The product and its buyers.
    await turnTo(home, "l2-s1");
    await expect(home.locator('[data-handbook-page="l2-s1"]')).toContainText("15-minute walk");
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
  await page.getByRole("button", { name: "Close workbook" }).click();

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
  await page.getByRole("button", { name: "Close workbook" }).click();
  return t;
}
