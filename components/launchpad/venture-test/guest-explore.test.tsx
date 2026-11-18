// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VentureFlow } from "@/components/launchpad/venture-test/venture-flow";
import { copyMatrix } from "@/constants/copyMatrix";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import type { LaunchpadVentureView } from "@/lib/launchpad/content/venture-view";
import { GUEST_SAVE_SIGN_UP_HREF } from "@/lib/onboarding/guest-save-prompt";
import { LAYER_ROOT_IDS } from "@/lib/ui/layers";
import { recordUsageEvent } from "@/lib/usage/record-usage-event";
import {
  markVentureTestOnboardingSeen,
  saveVentureTestProgress,
} from "@/lib/launchpad/venture-test/venture-test-storage";

vi.mock("@/lib/usage/record-usage-event", () => ({ recordUsageEvent: vi.fn() }));

beforeEach(() => {
  localStorage.clear();
  const root = document.createElement("div");
  root.id = LAYER_ROOT_IDS.modal;
  document.body.appendChild(root);
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  vi.mocked(recordUsageEvent).mockClear();
});
afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const payload = launchpadTestVentureSeed("dog-walking");
const content: LaunchpadVentureView = { ok: true, payload, versionId: "version-1", contentHash: "hash-1", source: "current" };
const titles = { "dog-walking": "Dog walking" };
const copy = copyMatrix.dashboard.launchpad.guestExplore;

function levelOneDone() {
  const first = payload.floors.find((f) => f.level === 1)!;
  const ids = first.silvers.flatMap((s) => s.bronzes.flatMap((b) => b.tasks.map((t) => t.id)));
  saveVentureTestProgress("dog-walking", { completedTaskIds: ids });
  markVentureTestOnboardingSeen("dog-walking");
}

function renderFlow(guest: boolean) {
  return render(
    <VentureFlow live guest={guest} initialVentureId={null} ventureTitles={titles} ventures={{ "dog-walking": content }} reset={false} />,
  );
}

describe("guest exploring the Launchpad", () => {
  it("shows the full shop front with only Dog walking open and records no learner visit", async () => {
    renderFlow(true);
    const open = await screen.findAllByRole("button", { name: /\. Open$/ });
    expect(open.map((b) => b.getAttribute("aria-label"))).toEqual(["Dog walking. Open"]);
    expect(screen.getAllByRole("button", { name: /\. Locked$/ }).length).toBeGreaterThan(1);
    expect(recordUsageEvent).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens Dog walking and Level 1 with no prompt", async () => {
    renderFlow(true);
    fireEvent.click(await screen.findByRole("button", { name: "Dog walking. Open" }));
    fireEvent.click(screen.getByRole("button", { name: "Start building" }));
    fireEvent.click(screen.getByRole("button", { name: "Go to Level 1" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector("[data-launchpad-frame]")).toBeTruthy();
  });

  it("asks for an account when the guest tries to enter Level 2", async () => {
    levelOneDone();
    renderFlow(true);
    fireEvent.click(await screen.findByRole("button", { name: "Dog walking. Open" }));
    fireEvent.click(screen.getByRole("button", { name: "Go to Level 2" }));
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain(copy.heading);
    expect(dialog.textContent).toContain(copy.body);
    const cta = screen.getByRole("link", { name: copy.cta });
    expect(cta.getAttribute("href")).toBe(GUEST_SAVE_SIGN_UP_HREF);
    // Still on the building: Level 2 did not open.
    expect(screen.getByRole("button", { name: "Go to Level 2" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: copy.notNow }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks once when the guest is back on a finished Level 1", async () => {
    levelOneDone();
    renderFlow(true);
    fireEvent.click(await screen.findByRole("button", { name: "Dog walking. Open" }));
    // Level 1 floor on the building.
    fireEvent.click(screen.getByRole("button", { name: /Level 1/ }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: copy.notNow }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("a signed-in learner is unchanged", () => {
  it("enters Level 2 with no prompt and counts the visit", async () => {
    levelOneDone();
    renderFlow(false);
    fireEvent.click(await screen.findByRole("button", { name: "Dog walking. Open" }));
    fireEvent.click(screen.getByRole("button", { name: "Go to Level 2" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText(copy.heading)).toBeNull();
    expect(recordUsageEvent).toHaveBeenCalledWith("launchpad_visit");
  });
});
