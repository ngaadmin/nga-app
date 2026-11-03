// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const server = vi.hoisted(() => ({
  getParentPinState: vi.fn(),
  createParentPin: vi.fn(),
  openParentTabGate: vi.fn(),
  resetParentPinWithPassword: vi.fn(),
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

describe("ParentPinGate forgotten PIN and lockout", () => {
  beforeEach(() => {
    server.getParentPinState.mockResolvedValue({ ok: true, hasPin: true, lockedUntil: null });
  });

  it("resets with the account password and a new PIN typed twice, then unlocks", async () => {
    server.resetParentPinWithPassword.mockResolvedValue({ ok: true, pass: "reset-pass" });
    const onUnlocked = vi.fn();
    render(<ParentPinGate parentName="Sam" onUnlocked={onUnlocked} />);
    fireEvent.click(await screen.findByText("Forgot your PIN?"));
    expect(screen.getByText("Reset your Parent PIN")).toBeTruthy();
    expect(screen.getByText("Confirm your account password, then pick a new PIN.")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Account password"), { target: { value: "secret-pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Pick a new Parent PIN")).toBeTruthy();
    typeAndContinue("1357");
    expect(await screen.findByText("Enter your new PIN again")).toBeTruthy();
    typeAndContinue("1357");
    await waitFor(() => expect(onUnlocked).toHaveBeenCalledWith("reset-pass"));
    expect(server.resetParentPinWithPassword).toHaveBeenCalledWith("secret-pass", "1357");
    expect(server.createParentPin).not.toHaveBeenCalled();
    expect(reset.requestParentPinReset).not.toHaveBeenCalled();
  });

  it("returns to the password step when the password is wrong", async () => {
    server.resetParentPinWithPassword.mockResolvedValue({
      ok: false,
      error: "That password didn't match. Try again.",
    });
    render(<ParentPinGate parentName="Sam" onUnlocked={vi.fn()} />);
    fireEvent.click(await screen.findByText("Forgot your PIN?"));
    fireEvent.change(screen.getByLabelText("Account password"), { target: { value: "nope" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    typeAndContinue("1357");
    typeAndContinue("1357");
    expect(await screen.findByText("That password didn't match. Try again.")).toBeTruthy();
    expect(screen.getByText("Reset your Parent PIN")).toBeTruthy();
  });

  it("shows the lockout countdown after the fifth wrong PIN, and the reset still works", async () => {
    server.openParentTabGate.mockResolvedValue({
      ok: false,
      reason: "locked",
      error: "Too many wrong tries.",
      triesLeft: 0,
      lockedUntil: Date.now() + 5 * 60 * 1000,
    });
    render(<ParentPinGate parentName="Sam" onUnlocked={vi.fn()} />);
    await screen.findByText("Enter your Parent PIN");
    typeAndContinue("0000");
    expect(await screen.findByText(/Too many wrong tries\. Try again in [45]:\d\d\./)).toBeTruthy();
    fireEvent.click(screen.getByText("Forgot your PIN?"));
    expect(screen.getByText("Reset your Parent PIN")).toBeTruthy();
  });
});
