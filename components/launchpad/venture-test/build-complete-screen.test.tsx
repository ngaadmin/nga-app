// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BuildCompleteScreen } from "@/components/launchpad/venture-test/build-complete-screen";
import { checkLaunchpadVenturePayload } from "@/lib/launchpad/content/check-payload";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { LAUNCHPAD_SURFACE_COPY, surfaceCopyFrom } from "@/lib/launchpad/content/surface-copy";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const copy = LAUNCHPAD_SURFACE_COPY.buildComplete;

function renderScreen(levelCount: number) {
  const onWorkbook = vi.fn();
  const onLaunchpad = vi.fn();
  render(
    <BuildCompleteScreen
      copy={copy}
      terraceLabel={copy.terrace}
      levelCount={levelCount}
      onWorkbook={onWorkbook}
      onLaunchpad={onLaunchpad}
    />,
  );
  return { onWorkbook, onLaunchpad };
}

describe("business build complete", () => {
  it("draws one filled dot per level and keeps the placeholder sentences", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { onWorkbook, onLaunchpad } = renderScreen(7);
    expect(screen.getByText(copy.greeting)).toBeTruthy();
    expect(screen.getByRole("heading", { name: copy.headline })).toBeTruthy();
    expect(screen.getByText(copy.businessLine)).toBeTruthy();
    expect(screen.getByText(copy.summary)).toBeTruthy();
    expect(document.querySelector("[data-level-dots]")?.getAttribute("data-level-dots")).toBe("7");
    expect(document.querySelectorAll("[data-level-dots] span")).toHaveLength(7);
    fireEvent.click(screen.getByRole("button", { name: copy.workbook }));
    fireEvent.click(screen.getByRole("button", { name: copy.back }));
    expect(onWorkbook).toHaveBeenCalledOnce();
    expect(onLaunchpad).toHaveBeenCalledOnce();
    cleanup();
    renderScreen(3);
    expect(document.querySelectorAll("[data-level-dots] span")).toHaveLength(3);
    expect(screen.getByText(copy.summary)).toBeTruthy();
  });

  it("skips confetti when the learner prefers reduced motion", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    renderScreen(7);
    expect(document.querySelector("canvas")).toBeNull();
  });

  it("keeps an older published payload valid and fills the new sections from the bundle", () => {
    const payload = structuredClone(launchpadTestVentureSeed());
    const surface = payload.surface as { buildComplete?: unknown };
    delete surface.buildComplete;
    expect(checkLaunchpadVenturePayload(payload, "dog-walking").ok).toBe(true);
    const merged = surfaceCopyFrom(payload.surface);
    expect(merged.buildComplete).toEqual(copy);
    expect(merged.chrome.back).toBe(payload.surface?.chrome.back);
  });
});
