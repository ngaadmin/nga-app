/**
 * The full Launchpad venture journey on /test-launchpad-venture, shared by the
 * mobile and desktop specs: home tile, onboarding, building, every Level 1
 * and Level 2 bronze door (really answered), both wrap-ups, the silver
 * pages, the Level 1 gold, then the handbook.
 */
import { expect, type Page, type TestInfo } from "@playwright/test";
import { nextButton, passed, ROUTE, shot, step, track } from "./launchpad-venture-helpers";

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

  await step(t, "Open the Define the business plaque: 4 doors, first up next, rest locked", async () => {
    await page.getByRole("button", { name: /Define the business, up next/ }).click();
    await expect(page.getByText("Open a door to see its tasks.")).toBeVisible();
    await expect(btn(page, /Pick what your business will offer/)).toContainText("Up next");
    for (const title of ["Find the why", "Know your impact", "Set your goals"]) {
      await expect(btn(page, new RegExp(title))).toHaveCount(0);
      await expect(main(page).getByText(title, { exact: true })).toBeVisible();
    }
  });
  await shot(t, "Level 1 doors, first door up next", btn(page, /Pick what your business will offer/));

  // Offer (multi-select)
  await step(t, "Offer door: Finish stays off until at least one pick", async () => {
    await btn(page, /Pick what your business will offer/).click();
    await expect(next).toHaveText("Finish ›");
    await expect(next).toBeDisabled();
    await expect(hint).toHaveText("Pick at least one to keep going.");
  });
  await shot(t, "Offer door, nothing picked (Finish off)", next);
  await step(t, "Offer door: pick Dog walking and Training (multi-select), then un-pick and re-pick", async () => {
    await btn(page, "Dog walking").click();
    await btn(page, "Training").click();
    await expect(btn(page, "Dog walking")).toHaveAttribute("aria-pressed", "true");
    await expect(btn(page, "Training")).toHaveAttribute("aria-pressed", "true");
    await btn(page, "Training").click();
    await expect(btn(page, "Training")).toHaveAttribute("aria-pressed", "false");
    await btn(page, "Training").click();
    await expect(next).toBeEnabled();
  });
  await shot(t, "Offer door, two picked", next);
  await step(t, "Finish the offer door: back on the doors, it shows Done and Find the why is up next", async () => {
    await next.click();
    await expect(btn(page, /Pick what your business will offer/)).toContainText("Done");
    await expect(btn(page, /Find the why/)).toContainText("Up next");
  });
  await shot(t, "Level 1 doors after the offer door", btn(page, /Find the why/));

  // Why (rank-order)
  await step(t, "Find the why: exactly 4 items in order, no 'Prove I can do it' or 'Support a cause'", async () => {
    await btn(page, /Find the why/).click();
    await expect(page.locator("[data-rank-item]")).toHaveCount(4);
    await expect(main(page)).not.toContainText("Prove I can do it");
    await expect(main(page)).not.toContainText("Support a cause");
    const labels = await page.locator("[data-rank-item]").allInnerTexts();
    const order = ["Make money", "Help others", "Learn new skills", "Be my own boss"];
    order.forEach((l, i) => expect(labels[i]).toContain(l));
  });
  await shot(t, "Find the why, authored order", next);
  await step(t, "Find the why: move Help others to the top with the arrow", async () => {
    await main(page).getByRole("button", { name: "Move Help others up" }).click();
    await expect(page.locator("[data-rank-item]").first()).toContainText("Help others");
    await expect(page.locator("[data-rank-item]").nth(1)).toContainText("Make money");
  });
  await shot(t, "Find the why, Help others moved to number 1", next);
  const aboveTiles = page.locator('ol[aria-label="Your ranking"] [data-rank-item]');
  const zone = page.locator('[aria-labelledby="rank-below-title"]').first();
  await step(t, "Find the why: move Be my own boss below the line (Doesn't apply to me)", async () => {
    await main(page).getByRole("button", { name: "Move Be my own boss down", exact: true }).click();
    await expect(aboveTiles).toHaveCount(3);
    await expect(main(page)).toContainText("Doesn't apply to me");
    await expect(next).toBeEnabled();
  });
  await shot(t, "Find the why, one tile below the line", next);
  await step(t, "Find the why: all four below the line disables Next", async () => {
    // Above is now Help others, Make money, Learn new skills: the last one crosses each time.
    for (const l of ["Learn new skills", "Make money", "Help others"]) {
      await main(page).getByRole("button", { name: `Move ${l} down`, exact: true }).click();
    }
    await expect(aboveTiles).toHaveCount(0);
    await expect(next).toBeDisabled();
  });
  await shot(t, "Find the why, all four below the line (Next disabled)", next);
  await step(t, "Find the why: move all four back above the line", async () => {
    for (const l of ["Help others", "Make money", "Learn new skills", "Be my own boss"]) {
      await main(page).getByRole("button", { name: `Move ${l} up, doesn't apply to me`, exact: true }).click();
    }
    await expect(aboveTiles).toHaveCount(4);
    await expect(aboveTiles.first()).toContainText("Help others");
    void zone;
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
  await shot(t, "Know your impact, The environment picked", next);
  await step(t, "Finish Know your impact", async () => {
    await next.click();
    await expect(btn(page, /Set your goals/)).toContainText("Up next");
  });

  // Goals
  const goalPage = async (n: number, title: string) => {
    await expect(main(page)).toContainText(`Goal ${n} of 6`, { ignoreCase: true });
    await expect(main(page)).toContainText(title);
  };
  await step(t, "Set your goals: Step 1 of 6 shows the intro, the guidance and goal 1's input together", async () => {
    await btn(page, /Set your goals/).click();
    await expect(main(page)).toContainText("Step 1 of 6");
    await expect(main(page)).toContainText(
      "Finish the sentence for each reason you ranked above the line. Use a number and a timeframe so you can check your progress later. Reasons you moved below the line don't need a goal.",
    );
    await goalPage(1, "Help others");
    await expect(main(page).getByLabel("Benefit")).toBeVisible();
  });
  await shot(t, "Set your goals, step 1 with goal 1", next);

  await step(t, "Goal 1 (4a) follows my ranking: Help others, benefit only (no timeframe), starts empty, no Not applicable", async () => {
    await expect(main(page).getByRole("button", { name: "Not applicable" })).toHaveCount(0);
    await expect(main(page).getByLabel("Weeks or months")).toHaveCount(0);
    await expect(main(page).getByLabel("Number")).toHaveCount(0);
    await expect(main(page).getByLabel("Benefit")).toHaveValue("");
    await expect(next).toBeDisabled();
    await expect(hint).toHaveText("Fill in each blank to keep going.");
    // The full stop stays on the line with the benefit box.
    await expect(main(page).locator("[data-sentence] [data-glued-punct]")).toHaveText(".");
    await main(page).getByLabel("Benefit").fill("TEST benefit one");
    await expect(next).toBeEnabled();
  });
  await shot(t, "Goal 1 of 6, Help others, filled", next);

  await step(t, "Goal 2 (4b): Make money with amount, currency, timeframe", async () => {
    await next.click();
    await goalPage(2, "Make money");
    await expect(main(page)).toContainText(/I want to earn .* in /);
    await expect(next).toBeDisabled();
    await expect(main(page).getByLabel("Amount")).toHaveValue("");
    await expect(main(page).getByLabel("Number")).toHaveValue("");
    await expect(main(page).getByLabel("Weeks or months")).toHaveValue("");
    expect(await main(page).getByLabel("Weeks or months").locator("option").evaluateAll((o) => o.map((e) => (e as HTMLOptionElement).value).filter(Boolean))).toEqual(["weeks", "months"]);
    await main(page).getByLabel("Amount").fill("500");
    await main(page).getByLabel("Number").fill("6");
    await main(page).getByLabel("Weeks or months").selectOption("months");
    await expect(main(page).locator("[data-currency-chip]")).not.toHaveText("—");
    await expect(next).toBeEnabled();
  });
  await shot(t, "Goal 2 of 6, Make money, filled", next);

  await step(t, "Previous goes back to goal 1 with its answers kept", async () => {
    await main(page).getByRole("button", { name: "‹ Previous" }).click();
    await goalPage(1, "Help others");
    await expect(main(page).getByLabel("Benefit")).toHaveValue("TEST benefit one");
    await next.click();
    await goalPage(2, "Make money");
    await expect(main(page).getByLabel("Amount")).toHaveValue(/500/);
  });

  await step(t, "Goal 3 (4c): Learn new skills", async () => {
    await next.click();
    await goalPage(3, "Learn new skills");
    await main(page).getByLabel("Skill").fill("TEST skill");
    await main(page).getByLabel("Number").fill("3");
    await main(page).getByLabel("Weeks or months").selectOption("weeks");
    await expect(next).toBeEnabled();
  });
  await shot(t, "Goal 3 of 6, Learn new skills, filled", next);

  await step(t, "Goal 4 (4d): Be my own boss, one choice", async () => {
    await next.click();
    await goalPage(4, "own boss");
    await expect(next).toBeDisabled();
    await expect(hint).toHaveText("Make a choice to keep going.");
    await btn(page, "Choosing when I work (my own schedule and hours)").click();
    await expect(next).toBeEnabled();
  });
  await shot(t, "Goal 4 of 6, Be my own boss, Choosing when I work picked", next);

  await step(t, "Goal 5 (4e): Support a cause carries my cause, lower-cased mid-sentence (to support the environment)", async () => {
    await next.click();
    await goalPage(5, "Support a cause");
    await expect(main(page).locator("[data-sentence]")).toContainText("to support the environment");
    // Optional (Cath 4 Nov 10:07pm): Next works while empty; a bad value blocks.
    await expect(main(page).locator("[data-optional-tag]")).toHaveText("Optional");
    await expect(next).toBeEnabled();
  });
  await shot(t, "Goal 5 of 6, Support a cause, empty (optional)", next);
  await step(t, "Goal 5: a bad percent blocks, then fill 10", async () => {
    await main(page).getByLabel("Percent").fill("0");
    await expect(next).toBeDisabled();
    await main(page).getByLabel("Percent").fill("10");
    await expect(next).toBeEnabled();
  });
  await shot(t, "Goal 5 of 6, Support a cause, filled", next);

  await step(t, "Goal 6: Add another goal is optional (Finish on while empty), then fill it in", async () => {
    await next.click();
    await goalPage(6, "Add another goal");
    await expect(main(page).locator("[data-optional-tag]")).toHaveText("Optional");
    await expect(main(page)).not.toContainText("Optional. Add");
    await expect(next).toHaveText("Finish ›");
    await expect(next).toBeEnabled();
    // One inline sentence, everything empty at the start, no separate boxes and no Number field.
    const sentence = main(page).locator("[data-sentence]");
    await expect(main(page).locator("[data-extra-fields]")).toHaveCount(0);
    await expect(sentence).toContainText("My goal is to");
    await expect(sentence.getByLabel("My goal")).toHaveValue("");
    await expect(sentence.getByLabel("Number")).toHaveValue("");
    await expect(sentence.getByLabel("Weeks or months")).toHaveValue("");
    await expect(main(page).getByLabel("Timeframe")).toHaveCount(0);
    await expect(sentence.locator("[data-glued-punct]")).toHaveCount(0);
    await sentence.getByLabel("My goal").fill("TEST other goal");
    await expect(next).toBeEnabled();
    await sentence.getByLabel("Number").fill("6");
    await sentence.getByLabel("Weeks or months").selectOption("months");
  });
  await shot(t, "Goal 6 of 6, Add another goal, filled", next);

  // L1 wrap-up
  const wrap = page.locator('[data-wrap-up="workbook-summary"]');
  await step(t, "Finish the goals: Level 1 wrap-up shows every answer carried through", async () => {
    await next.click();
    await expect(wrap).toBeVisible();
    const offer = wrap.locator('[data-summary-section="what-my-business-will-offer"]');
    await expect(offer).toContainText("Dog walking");
    await expect(offer).toContainText("Training");
    const why = await wrap.locator('[data-summary-section="my-why"]').innerText();
    expect(why.replace(/\s+/g, " ")).toMatch(/1 ?Help others 2 ?Make money 3 ?Learn new skills 4 ?Be my own boss(?! ?5)/);
    await expect(wrap.locator('[data-summary-section="my-cause"]')).toContainText(/the environment/i);
    const goals = wrap.locator('[data-summary-section="my-goals"]');
    for (const s of ["TEST benefit one", "500", "TEST skill", "Choosing when I work", "10", "TEST other goal"])
      await expect(goals).toContainText(s, { ignoreCase: true });
    await expect(goals).toContainText("to support the environment");
    await expect(goals).toContainText("My goal is to TEST other goal in 6 months.");
  });
  await shot(t, "Level 1 wrap-up, all answers shown", btn(page, "Continue"));

  await step(t, "Wrap-up: binder page, sections on one paper card with no boxes, one pencil per section", async () => {
    await expect(wrap.locator("[data-binder-card] [data-spiral-binding]")).toHaveCount(1);
    for (const id of ["what-my-business-will-offer", "my-goals"]) await expect(wrap.locator(`[data-summary-section="${id}"] [data-pencil]`)).toHaveCount(1);
    await expect(wrap.getByRole("button", { name: "Edit Help others" })).toHaveCount(0);
  });

  await step(t, "Wrap-up: the ranking and the cause are read-only (no pencil)", async () => {
    await expect(wrap.locator('[data-summary-section="my-why"] [data-pencil]')).toHaveCount(0);
    await expect(wrap.locator('[data-summary-section="my-cause"] [data-pencil]')).toHaveCount(0);
    const pencils = await wrap.locator("[data-pencil]").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
    passed(t, "Wrap-up pencils present", `pencils: ${pencils.join(", ")}`);
  });

  await step(t, "Wrap-up: edit the Help others goal text with the pencil, Cancel leaves it, Save changes it", async () => {
    await wrap.getByRole("button", { name: "Edit My goals" }).click();
    await wrap.getByRole("button", { name: "Edit Help others" }).click();
    const ed = wrap.locator('[data-inline-editor="l1-goal-help-others"]');
    await expect(ed).toBeVisible();
    await ed.getByLabel("Benefit").fill("TEST benefit edit");
    await ed.getByRole("button", { name: "Cancel" }).click();
    await expect(wrap.locator('[data-summary-section="my-goals"]')).toContainText("TEST benefit one");
    await wrap.getByRole("button", { name: "Edit My goals" }).click();
    await wrap.getByRole("button", { name: "Edit Help others" }).click();
    await shot(t, "Level 1 wrap-up, inline editor open", ed.getByRole("button", { name: "Save" }));
    await ed.getByLabel("Benefit").fill("TEST benefit edit");
    await ed.getByRole("button", { name: "Save" }).click();
    await expect(wrap.locator('[data-summary-section="my-goals"]')).toContainText("TEST benefit edit");
    await expect(wrap.locator('[data-summary-section="my-goals"]')).not.toContainText("TEST benefit one");
  });
  await shot(t, "Level 1 wrap-up after the edit", btn(page, "Continue"));

  await step(t, "Continue: milestone wrap-up, done, steps done, what you built, next up", async () => {
    await btn(page, "Continue").click();
    const sc = page.locator('[data-silver-complete="l1-s1"]');
    await expect(sc).toBeVisible();
    await expect(sc.getByRole("heading", { name: "Define the business: done!" })).toBeVisible();
    await expect(sc.locator("[data-milestone-steps]")).toHaveText("1 of 15 steps done");
    await expect(sc.locator("[data-what-you-built] [data-tag-chip]")).toHaveCount(4);
    await expect(sc.locator("[data-next-up]")).toContainText("Build your identity");
    await expect(sc.locator("[data-binder-card] [data-spiral-binding]")).toHaveCount(1);
    expect(await sc.innerText()).not.toMatch(/\b(silver|bronze|gold|NGA)\b/i);
  });
  await shot(t, "Level 1 silver complete, handbook page", page.locator('[data-silver-complete="l1-s1"]').getByRole("button", { name: "Continue" }));

  await step(t, "Continue: back to the Level 1 corridor, Build your identity up next (D25), no Level 1 finish yet", async () => {
    await page.locator('[data-silver-complete="l1-s1"]').getByRole("button", { name: "Continue" }).click();
    await expect(page.locator("#lp-corridor-title")).toHaveText(/Level 1 · Vision and Goals/, { timeout: 15_000 });
    await expect(page.locator("[data-gold-completion]")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Build your identity, up next/ })).toBeVisible();
  });
  await shot(t, "Level 1 corridor, Build your identity up next", page.getByRole("button", { name: /Build your identity, up next/ }));

  await step(t, "Workbook cover (page 1) after Define the business: logo and name placeholders, the vision filled", async () => {
    await page.getByRole("button", { name: /Back to building/ }).click();
    await page.getByRole("button", { name: "Open handbook" }).first().click();
    const dlg = page.getByRole("dialog");
    await expect(dlg.locator('[data-handbook-page="l1-s1"]')).toBeVisible();
    await dlg.getByRole("button", { name: "Previous page" }).click();
    const cover = dlg.locator('[data-handbook-page="cover"]');
    await expect(cover).toBeVisible();
    await expect(cover.locator('[data-cover-logo="empty"]')).toContainText("Your logo goes here");
    await expect(cover.locator('[data-doodle="rocket"]')).toBeVisible();
    await expect(cover.locator('[data-cover-name="empty"]')).toHaveText("Your business name");
    await expect(cover.locator("[data-vision-sentence]")).toContainText(/^I am starting a dog walking business\./);
    await expect(cover.locator("[data-pencil], [data-edit-identity]")).toHaveCount(0);
    expect(await cover.innerText()).not.toMatch(/\b(silver|bronze|gold|NGA)\b/i);
    passed(t, "Cover vision after Define the business", await cover.locator("[data-vision-sentence]").innerText());
  });
  await shot(t, "Workbook cover, logo and name empty", null);
  await step(t, "Close the workbook and go back to the Level 1 corridor", async () => {
    await page.getByRole("button", { name: "Close handbook" }).click();
    await btn(page, "Go to Level 1").click();
    await expect(page.getByRole("button", { name: /Build your identity, up next/ })).toBeVisible();
  });

  await step(t, "Open Build your identity: logo door up next", async () => {
    await page.getByRole("button", { name: /Build your identity, up next/ }).click();
    await expect(btn(page, /Design your logo/)).toContainText("Up next");
  });
  await shot(t, "Build your identity doors", btn(page, /Design your logo/));

  await step(t, "Logo builder: Continue off until shape, color and icon are picked", async () => {
    await btn(page, /Design your logo/).click();
    await expect(next).toHaveText("Continue");
    await expect(next).toBeDisabled();
    await expect(hint).toHaveText("Pick a shape, a color and an icon to keep going.");
    for (const tab of ["Shape", "Color", "Icon"]) await expect(main(page).getByRole("tab", { name: tab })).toBeVisible();
  });
  await shot(t, "Logo builder, empty", next);
  await step(t, "Logo builder: pick Shield, Orange, Bone through the tabs", async () => {
    await main(page).getByRole("tab", { name: "Shape" }).click();
    await main(page).getByRole("radio", { name: "Shield" }).click();
    await main(page).getByRole("tab", { name: "Color" }).click();
    await main(page).getByRole("radio", { name: "Orange" }).click();
    await main(page).getByRole("tab", { name: "Icon" }).click();
    await expect(main(page).getByRole("radio")).toHaveCount(3);
    await expect(main(page).getByRole("radio", { name: "Paw" })).toBeVisible();
    await main(page).getByRole("radio", { name: "Bone" }).click();
    await expect(main(page).getByRole("radio", { name: "Bone" })).toHaveAttribute("aria-checked", "true");
    await main(page).getByRole("tab", { name: "Shape" }).click();
    await expect(main(page).getByRole("radio", { name: "Shield" })).toHaveAttribute("aria-checked", "true");
    await expect(next).toBeEnabled();
  });
  await shot(t, "Logo builder, Shield Orange Bone", next);
  await step(t, "Continue: back on the doors with Name your business up next", async () => {
    await next.click();
    await expect(btn(page, /Name your business/)).toContainText("Up next");
  });

  await step(t, "Name your business: Save off until name, font and font color", async () => {
    await btn(page, /Name your business/).click();
    await expect(next).toHaveText("Save to my workbook");
    await expect(next).toBeDisabled();
    await expect(hint).toHaveText("Add a name, a font and a font color to save.");
    const name = main(page).getByRole("textbox", { name: /Business name/ });
    await name.fill("TEST Business Name");
    await main(page).getByRole("radio", { name: "Rounded" }).click();
    await expect(next).toBeDisabled();
    await main(page).getByRole("radio", { name: "Dark ink" }).click();
    await expect(next).toBeEnabled();
    await expect(name).toHaveValue("TEST Business Name");
  });
  await shot(t, "Name your business, filled", next);

  const idWrap = page.locator('[data-wrap-up="identity"]');
  await step(t, "Save to my workbook: identity wrap-up shows the logo and name", async () => {
    await next.click();
    if (!(await idWrap.isVisible().catch(() => false)) && (await btn(page, "See your logo").count()))
      await btn(page, "See your logo").click();
    await expect(idWrap).toBeVisible();
    await expect(idWrap).toContainText("TEST Business Name");
  });
  await shot(t, "Identity wrap-up", btn(page, "Continue"));

  await step(t, "Identity wrap-up is a summary only: vision on top, then logo and name; no pick editor", async () => {
    await expect(idWrap.getByRole("tab")).toHaveCount(0);
    await expect(idWrap.getByRole("radio")).toHaveCount(0);
    await expect(idWrap.locator("[data-identity-lockup]")).toBeVisible();
    // The Vision line is now the compiled vision sentence (H19), same block as the cover.
    const v = idWrap.locator("[data-identity-vision] [data-vision-sentence]");
    await expect(v).toContainText(/^I am starting a dog walking business\. I will offer /);
    await expect(v).toContainText("As I grow, I'll give 10% of every sale to support the environment.");
    const fit = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("main button")).find((e) => e.textContent?.trim() === "Continue")!.getBoundingClientRect();
      return { scrollHeight: document.scrollingElement!.scrollHeight, viewport: window.innerHeight, continueBottom: Math.round(b.bottom) };
    });
    passed(t, "Screen three vision", await v.innerText());
    passed(t, "Screen three fit (no scroll when scrollHeight <= viewport)", JSON.stringify(fit));
    expect(fit.scrollHeight, "screen three fits at 390x844 with the long vision").toBeLessThanOrEqual(fit.viewport);
  });

  await step(t, "Continue (identity): silver-complete page, then the Level 1 finish", async () => {
    await btn(page, "Continue").click();
    const sc = page.locator('[data-silver-complete="l1-s2"]');
    await expect(sc).toBeVisible();
    await expect(sc.locator("[data-milestone-steps]")).toHaveText("2 of 15 steps done");
    await shot(t, "Level 1 identity complete, handbook page", sc.getByRole("button", { name: "Continue" }));
    await sc.getByRole("button", { name: "Continue" }).click();
    await expect(page.locator("[data-gold-completion]")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Gold unlocked: Vision and Goals!/ })).toBeVisible();
  });
  await shot(t, "Level 1 gold", btn(page, "Continue"));

  // ---------- 4. Level 2 ----------
  await step(t, "Continue: lift, then the Level 2 corridor (one section)", async () => {
    await btn(page, "Continue").click();
    await expect(page.locator("#lp-corridor-title")).toHaveText(/Level 2 · Planning/, { timeout: 15_000 });
    await expect(page.getByRole("button", { name: /Build your identity/ })).toHaveCount(0);
  });
  await shot(t, "Level 2 corridor", page.getByRole("button", { name: /Know the product and its buyers, up next/ }));


  await step(t, "Open Know the product and its buyers: 2 doors", async () => {
    await page.getByRole("button", { name: /Know the product and its buyers, up next/ }).click();
    await expect(btn(page, /Decide what to sell/)).toContainText("Up next");
    await expect(main(page).getByText("Find out if people want it", { exact: true })).toBeVisible();
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
    await expect(btn(page, /Find out if people want it/)).toContainText("Up next");
  });

  await step(t, "Find out if people want it: real-world task, number, yes/no, text", async () => {
    await btn(page, /Find out if people want it/).click();
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

  const wrap2 = page.locator('[data-wrap-up="workbook-summary"]');
  await step(t, "Finish: Level 2 silver 1 wrap-up shows the answers", async () => {
    await next.click();
    if (await btn(page, /See your|wrap|workbook/i).count()) await btn(page, /See your|wrap|workbook/i).first().click();
    await expect(wrap2).toBeVisible();
    await expect(wrap2).toContainText("TEST product");
    await expect(wrap2).toContainText("TEST availability");
    await expect(wrap2).toContainText("TEST interest");
  });
  await shot(t, "Level 2 silver 1 wrap-up", btn(page, "Continue"));

  await step(t, "Level 2 wrap-up: edit what I am selling with the pencil", async () => {
    const sec = wrap2.locator('[data-summary-section="what-i-am-selling"]');
    await sec.locator("[data-pencil]").first().click();
    const ed = wrap2.locator("[data-inline-editor]");
    await expect(ed).toBeVisible();
    await ed.locator("textarea, input[type=text]").first().fill("TEST product edit");
    await ed.getByRole("button", { name: "Save" }).click();
    await expect(sec).toContainText("TEST product edit");
  });
  await shot(t, "Level 2 silver 1 wrap-up after the edit", btn(page, "Continue"));

  await step(t, "Continue: silver-complete page, then back to the Level 2 corridor", async () => {
    await btn(page, "Continue").click();
    const sc = page.locator('[data-silver-complete="l2-s1"]');
    await expect(sc).toBeVisible();
    await expect(sc.getByRole("heading", { name: "Know the product and its buyers: done!" })).toBeVisible();
    await expect(sc.locator("[data-milestone-steps]")).toHaveText("3 of 15 steps done");
    await shot(t, "Level 2 silver 1 complete, handbook page", sc.getByRole("button", { name: "Continue" }));
    await sc.getByRole("button", { name: "Continue" }).click();
    await expect(page.locator("#lp-corridor-title")).toHaveText(/Level 2 · Planning/);
    await expect(btn(page, "Take the lift up")).toBeVisible();
    await expect(page.locator("[data-gold-completion]")).toHaveCount(0);
  });
  await shot(t, "Level 2 corridor, level done, lift up", btn(page, "Take the lift up"));

  // ---------- 5. Handbook ----------
  const hb = page.getByRole("dialog");
  await step(t, "Building: handbook button; open it, it shows my saved answers", async () => {
    await page.getByRole("button", { name: /Back to building/ }).click();
    await expect(btn(page, "Go to Level 3")).toBeVisible();
    await page.getByRole("button", { name: "Open handbook" }).first().click();
    await expect(hb).toBeVisible();
    await expect(hb.locator("[data-handbook-page]").first()).toBeVisible();
  });
  await shot(t, "Handbook from the building", null);

  await step(t, "Handbook tabs: Level 1 and Level 2 open their pages, Level 4 onward not earned", async () => {
    const tabs = hb.getByRole("navigation", { name: "Handbook floors" }).getByRole("button");
    const labels = await tabs.evaluateAll((els) => els.map((e) => `${e.getAttribute("aria-label")}${(e as HTMLButtonElement).disabled ? " [off]" : ""}`));
    passed(t, "Handbook tab labels", labels.join(" | "));
    await hb.getByRole("button", { name: "Level 1, Vision and Goals" }).click();
    await expect(hb.locator('[data-handbook-page="l1-s1"]')).toBeVisible();
    await expect(hb.locator('[data-handbook-page="l1-s1"]')).toContainText("TEST benefit edit");
    await expect(hb.locator('[data-handbook-page="l1-s1"]')).toContainText(/the environment/i);
    await hb.getByRole("button", { name: "Previous page" }).click();
    const cover = hb.locator('[data-handbook-page="cover"]');
    await expect(cover.locator('[data-cover-logo="filled"]')).toBeVisible();
    await expect(cover.locator('[data-cover-name="filled"]')).toHaveText("TEST Business Name");
    await expect(cover.locator("[data-vision-quote]")).toBeVisible();
    await expect(cover.locator("[data-vision-sentence]")).toContainText("As I grow, I'll give 10% of every sale to support the environment.");
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
    await expect(hb.getByRole("button", { name: /Level 4.*not earned yet/ })).toBeVisible();
  });
  await shot(t, "Handbook, Level 1 page with orange viewed ring", null);

  await step(t, "Handbook: Next page walks to the identity page, then the Level 2 page", async () => {
    await hb.getByRole("button", { name: "Next page" }).click();
    const idPage = hb.locator('[data-handbook-page="l1-s2"]');
    await expect(idPage).toBeVisible();
    await expect(idPage).toContainText("TEST Business Name");
    await expect(idPage.locator("[data-identity-page-vision] [data-vision-sentence]")).toContainText(/^I am starting a dog walking business\./);
    await shot(t, "Workbook identity page", null);
    await hb.getByRole("button", { name: "Next page" }).click();
    await expect(hb.locator('[data-handbook-page="l2-s1"]')).toBeVisible();
    await expect(hb.locator('[data-handbook-page="l2-s1"]')).toContainText("TEST product edit");
    await shot(t, "Handbook, Level 2 silver 1 page", null);
    const l2Tab = hb.getByRole("button", { name: "Level 2, Planning" });
    await expect(l2Tab).toHaveAttribute("data-viewed", /.*/);
    await hb.getByRole("button", { name: "Previous page" }).click();
    await expect(hb.locator('[data-handbook-page="l1-s2"]')).toBeVisible();
  });
  await shot(t, "Handbook, Level 2 pages", null);

  await step(t, "Close the handbook; home tile now shows Level 3 and a handbook button (read-only)", async () => {
    await page.getByRole("button", { name: "Close handbook" }).click();
    await expect(hb).toHaveCount(0);
    await page.getByRole("button", { name: /Launchpad/ }).first().click();
    const tile = page.locator('[data-in-progress="dog-walking"]');
    await expect(tile.locator("[data-tile-level-name]")).toContainText("Making");
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
    // The handbook opens on the latest earned page (by design: handbookOpenIndex), so it starts on Know the product and its buyers.
    await expect(home.locator('[data-handbook-page="l2-s1"]')).toBeVisible();
    await expect(home.locator('[data-handbook-page="l2-s1"]')).toContainText("TEST product edit");
    // The edited Level 1 answer is saved and shows on the Level 1 page.
    const saved = await page.evaluate(() => localStorage.getItem("lp-venture-test:v1:dog-walking") ?? "");
    expect(saved).toContain("TEST benefit edit");
    await home.getByRole("button", { name: "Level 1, Vision and Goals" }).click();
    await expect(home.locator('[data-handbook-page="l1-s1"]')).toContainText("TEST benefit edit");
    await expect(home.locator('[data-handbook-page="l1-s1"]')).toContainText(/the environment/i);
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
