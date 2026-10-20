import { expect, type Locator, type Page, test } from "@playwright/test";

const GUEST_SESSION_KEY = "nga_guest_session";

type Cohort = "explorer" | "pathfinder" | "maverick";

function guestSession(cohort: Cohort) {
  const username =
    cohort === "explorer" ? "lars" : cohort === "pathfinder" ? "holly" : "aiden";
  return {
    accessMode: "guest",
    username,
    ageTier: cohort,
    curriculumCohort: cohort,
    accountStatus: "GUEST",
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

async function openLesson(
  page: Page,
  cohort: Cohort,
  path: string,
): Promise<void> {
  await page.addInitScript(
    ([key, session]) => {
      const raw = JSON.stringify(session);
      window.localStorage.setItem(key, raw);
      window.sessionStorage.setItem(key, raw);
    },
    [GUEST_SESSION_KEY, guestSession(cohort)] as const,
  );
  await page.goto(path);
}

function dropZone(page: Page): Locator {
  return page.getByTestId("savings-drop-zone");
}

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const zone = document.querySelector("[data-testid='savings-drop-zone']");
    const scroller = zone?.closest(".overflow-y-auto");
    return {
      document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      scroller: scroller
        ? scroller.scrollWidth - scroller.clientWidth
        : 0,
    };
  });
  expect(overflow.document).toBeLessThanOrEqual(1);
  expect(overflow.scroller).toBeLessThanOrEqual(1);
}

test.describe("savings-goal drop box", () => {
  test("L4 s7 reads prompt, cards, headed box, then the savings meter", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openLesson(
      page,
      "explorer",
      "/dashboard/academy/lesson/4?preview=1&screen=6",
    );

    const prompt = page.getByText(/Drag them into the box to reach his goal/i);
    const heading = page.getByRole("heading", { name: "Things Lars didn't buy" });
    const zone = dropZone(page);
    const meter = page.locator("[aria-live='polite']");
    const snacks = page.getByRole("button", { name: /Snacks at school/i });

    await expect(prompt).toBeVisible();
    await expect(heading).toBeVisible();
    await expect(zone).toBeVisible();
    await expect(meter).toHaveText("$0");
    await expect(snacks).toBeVisible();

    const tops = await page.evaluate(() => {
      const topOf = (el: Element | null | undefined) => el?.getBoundingClientRect().top ?? 0;
      const chip = [...document.querySelectorAll("button")].find((el) =>
        /Snacks at school/i.test(el.textContent ?? ""),
      );
      const prompt = [...document.querySelectorAll("p")].find((el) =>
        /wheelie workshop/i.test(el.textContent ?? ""),
      );
      return {
        prompt: topOf(prompt),
        chip: topOf(chip),
        heading: topOf(document.querySelector("h2")),
        zone: topOf(document.querySelector("[data-testid='savings-drop-zone']")),
        meter: topOf(document.querySelector("[aria-live='polite']")),
      };
    });
    expect(tops.prompt).toBeLessThan(tops.chip);
    expect(tops.chip).toBeLessThan(tops.heading);
    expect(tops.heading).toBeLessThan(tops.zone);
    expect(tops.zone).toBeLessThan(tops.meter);

    const zoneStyle = await zone.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        borderTopStyle: style.borderTopStyle,
        borderTopWidth: style.borderTopWidth,
        backgroundColor: style.backgroundColor,
        height: el.getBoundingClientRect().height,
        fontSize: "",
      };
    });
    expect(zoneStyle.borderTopStyle).toBe("dashed");
    expect(parseFloat(zoneStyle.borderTopWidth)).toBeGreaterThanOrEqual(2);
    expect(zoneStyle.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(zoneStyle.height).toBeGreaterThanOrEqual(96);

    const headingStyle = await heading.evaluate((el) => {
      const style = getComputedStyle(el);
      return { fontSize: style.fontSize, fontWeight: style.fontWeight, tag: el.tagName };
    });
    expect(headingStyle.tag).toBe("H2");
    expect(parseFloat(headingStyle.fontSize)).toBeGreaterThanOrEqual(20);
    expect(Number(headingStyle.fontWeight)).toBeGreaterThanOrEqual(700);

    const chipStyle = await snacks.evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        cursor: style.cursor,
        borderTopWidth: style.borderTopWidth,
        borderRadius: style.borderRadius,
        backgroundColor: style.backgroundColor,
      };
    });
    expect(chipStyle.cursor).toBe("grab");
    expect(parseFloat(chipStyle.borderTopWidth)).toBeGreaterThanOrEqual(2);
    expect(parseFloat(chipStyle.borderRadius)).toBeGreaterThan(8);
    expect(chipStyle.backgroundColor).toBe("rgb(255, 255, 255)");

    const from = await snacks.boundingBox();
    const to = await zone.boundingBox();
    if (!from || !to) throw new Error("Drag source or drop zone was not on screen.");
    await page.mouse.move(from.x + from.width / 2, from.y + 24);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + Math.min(to.height / 2, 80), {
      steps: 12,
    });
    await expect(zone).toHaveAttribute("data-drop-active", "true");
    await expect(zone).toHaveCSS("border-top-style", "solid");
    await expect(zone).toHaveCSS("background-color", "rgb(232, 246, 252)");
    await page.mouse.up();

    await expect(zone.getByRole("button", { name: /Snacks at school/i })).toBeVisible();
    await expect(meter).toHaveText("$5");
    await expect(page.getByRole("button", { name: /Extra lives bundle/i })).toBeVisible();
    await assertNoHorizontalOverflow(page);
  });

  test("Pathfinder and Maverick use the same box with their own heading", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openLesson(
      page,
      "pathfinder",
      "/dashboard/academy/lesson/4?preview=1&screen=6",
    );
    await expect(
      page.getByRole("heading", { name: "Things Holly didn't buy" }),
    ).toBeVisible();
    await expect(dropZone(page)).toBeVisible();
    await expect(page.getByText(/nail-art workshop/i)).toBeVisible();

    await openLesson(
      page,
      "maverick",
      "/dashboard/academy/lesson/4?preview=1&screen=6",
    );
    await expect(
      page.getByRole("heading", { name: "Things Aiden didn't buy" }),
    ).toBeVisible();
    await expect(dropZone(page)).toBeVisible();
  });

  test("fits a 375x667 phone and lesson 7 still drops into the box", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await openLesson(
      page,
      "explorer",
      "/dashboard/academy/lesson/4?preview=1&screen=6",
    );
    const zone = dropZone(page);
    await zone.scrollIntoViewIfNeeded();
    await expect(zone).toBeVisible();
    await expect(page.getByRole("heading", { name: "Things Lars didn't buy" })).toBeVisible();
    const height = await zone.evaluate((el) => el.getBoundingClientRect().height);
    expect(height).toBeGreaterThanOrEqual(96);
    await assertNoHorizontalOverflow(page);

    const scroller = await page.evaluate(() => {
      const node = document
        .querySelector("[data-testid='savings-drop-zone']")
        ?.closest(".overflow-y-auto");
      if (!node) return null;
      const overflows = node.scrollHeight > node.clientHeight + 1;
      const before = node.scrollTop;
      node.scrollTop = node.scrollHeight;
      const scrolled = !overflows || node.scrollTop > before;
      node.scrollTop = before;
      return { scrolled, overflows };
    });
    expect(scroller?.scrolled).toBe(true);

    await openLesson(
      page,
      "explorer",
      "/dashboard/academy/lesson/7?preview=1&screen=3",
    );
    await expect(page.getByRole("heading", { name: "Chosen" })).toBeVisible();
    const lesson7Zone = dropZone(page);
    await lesson7Zone.scrollIntoViewIfNeeded();
    await expect(lesson7Zone).toBeVisible();
    const headphones = page.getByRole("button", { name: /Headphones/i });
    await headphones.scrollIntoViewIfNeeded();
    const from = await headphones.boundingBox();
    const to = await lesson7Zone.boundingBox();
    if (!from || !to) throw new Error("Lesson 7 drag source or drop zone was not on screen.");
    await page.mouse.move(from.x + from.width / 2, from.y + 24);
    await page.mouse.down();
    await page.mouse.move(to.x + to.width / 2, to.y + Math.min(to.height / 2, 70), {
      steps: 14,
    });
    await page.mouse.up();
    await expect(lesson7Zone.getByRole("button", { name: /Headphones/i })).toBeVisible();
    await expect(page.locator("[aria-live='polite']")).toHaveText("$5");
  });
});
