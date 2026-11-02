// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const server = vi.hoisted(() => ({
  getParentPinState: vi.fn(),
  createParentPin: vi.fn(),
  openParentTabGate: vi.fn(),
}));
const reset = vi.hoisted(() => ({ requestParentPinReset: vi.fn() }));

vi.mock("@/lib/parent/parent-tab-server", () => server);
vi.mock("@/lib/dashboard/parent-pin-reset", () => reset);

import { ParentPinGate } from "@/components/parent/parent-pin-gate";

function pinInput(): HTMLInputElement {
  return document.querySelector("input[type=password]") as HTMLInputElement;
}

function typeAndContinue(value: string) {
  fireEvent.change(pinInput(), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Continue" }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

describe("ParentPinGate with no Parent PIN saved (parent_pin_hash null)", () => {
  beforeEach(() => {
    server.getParentPinState.mockResolvedValue({ ok: true, hasPin: false, lockedUntil: null });
  });

  it("shows Create your Parent PIN, not a lockout or Forgot-PIN only", async () => {
    render(<ParentPinGate parentName="Sam" onUnlocked={vi.fn()} />);
    expect(await screen.findByText("Create your Parent PIN")).toBeTruthy();
    expect(document.querySelector('[data-parent-tab-gate="set"]')).toBeTruthy();
    expect(screen.queryByText("Forgot your PIN?")).toBeNull();
    expect(screen.queryByText(/Too many wrong tries/)).toBeNull();
    expect(server.openParentTabGate).not.toHaveBeenCalled();
  });

  it("asks twice, saves through createParentPin, then continues", async () => {
    server.createParentPin.mockResolvedValue({ ok: true, pass: "gate-pass" });
    const onUnlocked = vi.fn();
    render(<ParentPinGate parentName="Sam" onUnlocked={onUnlocked} />);
    await screen.findByText("Create your Parent PIN");

    typeAndContinue("4321");
    expect(await screen.findByText("Enter your new PIN again")).toBeTruthy();
    expect(server.createParentPin).not.toHaveBeenCalled();

    typeAndContinue("4321");
    await waitFor(() => expect(onUnlocked).toHaveBeenCalledWith("gate-pass"));
    expect(server.createParentPin).toHaveBeenCalledTimes(1);
    expect(server.createParentPin).toHaveBeenCalledWith("4321");
    expect(server.openParentTabGate).not.toHaveBeenCalled();
  });

  it("starts again when the two entries don't match, and saves nothing", async () => {
    const onUnlocked = vi.fn();
    render(<ParentPinGate parentName="Sam" onUnlocked={onUnlocked} />);
    await screen.findByText("Create your Parent PIN");
    typeAndContinue("4321");
    await screen.findByText("Enter your new PIN again");
    typeAndContinue("9999");
    expect(await screen.findByText("Those didn't match. Pick your PIN again.")).toBeTruthy();
    expect(screen.getByText("Create your Parent PIN")).toBeTruthy();
    expect(server.createParentPin).not.toHaveBeenCalled();
    expect(onUnlocked).not.toHaveBeenCalled();
  });
});

describe("ParentPinGate when the server reports the PIN as missing", () => {
  it("moves from Enter to Create instead of locking the parent out", async () => {
    server.getParentPinState.mockResolvedValue({ ok: true, hasPin: true, lockedUntil: null });
    server.openParentTabGate.mockResolvedValue({
      ok: false,
      reason: "missing",
      error: "Create your Parent PIN first.",
      triesLeft: 0,
      lockedUntil: null,
    });
    render(<ParentPinGate parentName="Sam" onUnlocked={vi.fn()} />);
    await screen.findByText("Enter your Parent PIN");
    typeAndContinue("4321");
    expect(await screen.findByText("Create your Parent PIN")).toBeTruthy();
  });
});

describe("ParentPinGate with a Parent PIN saved", () => {
  it("shows Enter your Parent PIN with Forgot your PIN?", async () => {
    server.getParentPinState.mockResolvedValue({ ok: true, hasPin: true, lockedUntil: null });
    render(<ParentPinGate parentName="Sam" onUnlocked={vi.fn()} />);
    expect(await screen.findByText("Enter your Parent PIN")).toBeTruthy();
    expect(screen.getByText("Forgot your PIN?")).toBeTruthy();
  });
});
