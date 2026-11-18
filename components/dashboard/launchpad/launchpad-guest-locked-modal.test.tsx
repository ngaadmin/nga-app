// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LaunchpadGuestLockedModal } from "@/components/dashboard/launchpad/launchpad-guest-locked-modal";
import { copyMatrix } from "@/constants/copyMatrix";
import { GUEST_SAVE_SIGN_UP_HREF } from "@/lib/onboarding/guest-save-prompt";
import { LAYER_ROOT_IDS } from "@/lib/ui/layers";

beforeEach(() => {
  const root = document.createElement("div");
  root.id = LAYER_ROOT_IDS.modal;
  document.body.appendChild(root);
});

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("LaunchpadGuestLockedModal", () => {
  it("shows Storybird's guest line and a Create an account link to the save-progress signup start", () => {
    render(<LaunchpadGuestLockedModal isOpen onClose={() => {}} />);
    expect(
      screen.getByRole("heading", { name: copyMatrix.dashboard.launchpad.title }),
    ).toBeTruthy();
    expect(
      screen.getByText(copyMatrix.dashboard.launchpad.guestLocked.body),
    ).toBeTruthy();
    const cta = screen.getByRole("link", {
      name: copyMatrix.dashboard.launchpad.guestLocked.cta,
    });
    expect(cta.getAttribute("href")).toBe(GUEST_SAVE_SIGN_UP_HREF);
    expect(cta.getAttribute("href")).toBe("/onboarding/sign-up?as=learner");
  });
});

describe("Storybird Launchpad copy", () => {
  it("keeps the page description and guest lock strings exact", () => {
    expect(copyMatrix.dashboard.launchpad.description).toBe(
      "Launch your own business, step by step. Start with the Dog Walking business!",
    );
    expect(copyMatrix.dashboard.launchpad.guestLocked.body).toBe(
      "The Business Launchpad is only for signed-up learners. Create an account to start building your own business!",
    );
    expect(copyMatrix.dashboard.launchpad.guestLocked.cta).toBe("Create an account");
  });
});
