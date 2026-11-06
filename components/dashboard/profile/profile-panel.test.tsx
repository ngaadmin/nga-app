// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfilePanel } from "@/components/dashboard/profile/profile-panel";
import {
  DEFAULT_PROFILE_AVATAR_BY_COHORT,
  profileAvatarOption,
} from "@/lib/dashboard/profile-avatar";
import { COHORT_AVATAR } from "@/lib/onboarding/cohort-avatars";
import type { HouseholdProfiles } from "@/lib/profile-switcher/household-profiles";

vi.mock("@/components/achievements/medals-intro", () => ({
  MedalsIntro: () => null,
}));
vi.mock("@/components/achievements/skills-collection-panel", () => ({
  SkillsCollectionPanel: () => null,
}));

beforeEach(() => {
  if (!document.getElementById("toast-root")) {
    const root = document.createElement("div");
    root.id = "toast-root";
    document.body.appendChild(root);
  }
});
afterEach(cleanup);

function renderPanel(overrides: Partial<Parameters<typeof ProfilePanel>[0]> = {}) {
  const onChooseAvatar = vi.fn();
  const utils = render(
    <ProfilePanel
      displayName="Guest"
      trackLabel="Explorer"
      avatarId="lars"
      onChooseAvatar={onChooseAvatar}
      {...overrides}
    />,
  );
  return { ...utils, onChooseAvatar };
}

describe("ProfilePanel header", () => {
  it("shows the avatar, the username and the track, with no open picker", () => {
    const { container } = renderPanel();
    const header = container.querySelector("[data-profile-header]");
    expect(header?.querySelector('[data-profile-avatar="lars"]')).toBeTruthy();
    expect(screen.getByText("Guest")).toBeTruthy();
    expect(screen.getByText("Explorer")).toBeTruthy();
    expect(screen.queryByText("Choose your avatar")).toBeNull();
    expect(container.querySelector("[data-avatar-option]")).toBeNull();
    expect(document.querySelector("[data-avatar-option]")).toBeNull();
  });

  it("opens the picker only from the pencil, and a pick saves and closes it", () => {
    const { onChooseAvatar } = renderPanel();
    const pencil = screen.getByRole("button", { name: "Change your avatar" });
    fireEvent.click(pencil);
    expect(screen.getByText("Choose your avatar")).toBeTruthy();
    expect(screen.getByRole("radio", { name: "Lars" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByRole("radio", { name: "Immi" }));
    expect(onChooseAvatar).toHaveBeenCalledWith("immi");
    expect(screen.queryByText("Choose your avatar")).toBeNull();
  });

  it("closes the picker with Escape without a pick", () => {
    const { onChooseAvatar } = renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Change your avatar" }));
    expect(screen.getByText("Choose your avatar")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByText("Choose your avatar")).toBeNull();
    expect(onChooseAvatar).not.toHaveBeenCalled();
  });

  it("parents keep the role line and their initial until they pick a picture", () => {
    const { container } = renderPanel({
      displayName: "Sam",
      trackLabel: null,
      roleLabel: "Parent",
      avatarId: null,
    });
    expect(container.querySelector('[data-profile-avatar="initial"]')).toBeTruthy();
    expect(screen.getByText("Parent")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Change your avatar" })).toBeTruthy();
  });

  it("never shows XP or the short brand name", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Change your avatar" }));
    expect(screen.getByText("Choose your avatar")).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/\bXP\b/);
    expect(document.body.textContent).not.toMatch(/\bNGA\b/);
  });
});

const household = (currentUserId: string): HouseholdProfiles => ({
  currentUserId,
  profiles: [
    { userId: "p1", name: "Sam", role: "parent", cohort: null, isCurrent: currentUserId === "p1" },
    { userId: "c1", name: "Amy", role: "child", cohort: "explorer", isCurrent: currentUserId === "c1" },
  ],
});

describe("ProfilePanel round 2 (pencil, centred picker, no parent switching)", () => {
  it("has a 44px tap area around a 28px circle with a 16px icon, at the avatar's top-right", () => {
    renderPanel();
    const pencil = screen.getByRole("button", { name: "Change your avatar" });
    expect(pencil.className).toContain("size-11");
    expect(pencil.className).toContain("-top-3");
    expect(pencil.className).toContain("left-[56px]");
    const circle = pencil.querySelector("[data-profile-avatar-edit-circle]");
    expect(circle?.className).toContain("size-7");
    expect(circle?.querySelector("svg")?.getAttribute("class")).toContain("size-4");
  });

  it("opens the picker as a centred modal with a close button", () => {
    renderPanel();
    fireEvent.click(screen.getByRole("button", { name: "Change your avatar" }));
    const picker = document.querySelector("[data-profile-avatar-picker]");
    expect(picker).toBeTruthy();
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("items-center");
    expect(dialog.className).not.toContain("items-end");
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(screen.queryByText("Choose your avatar")).toBeNull();
  });

  it("never shows a profile switcher or child rows to a parent", () => {
    const { container } = renderPanel({
      displayName: "Sam",
      trackLabel: null,
      roleLabel: "Parent",
      avatarId: null,
      isParent: true,
      household: household("p1"),
    });
    expect(container.querySelector("[data-profile-switcher-section]")).toBeNull();
    expect(container.querySelector("[data-profile-switcher-row]")).toBeNull();
    expect(document.body.textContent).not.toMatch(/switch profile/i);
    expect(document.body.textContent).not.toContain("Amy");
  });

  it("leaves the child's own profile list as it was", () => {
    const { container } = renderPanel({
      displayName: "Amy",
      household: household("c1"),
    });
    expect(container.querySelector("[data-profile-switcher-section]")).toBeTruthy();
    expect(container.querySelectorAll("[data-profile-switcher-row]").length).toBe(2);
  });
});

describe("cohort default avatars", () => {
  it("use the same pictures as the cohort picker and Add profile", () => {
    expect(profileAvatarOption(DEFAULT_PROFILE_AVATAR_BY_COHORT.explorer).src).toBe(
      COHORT_AVATAR.explorer.src,
    );
    expect(profileAvatarOption(DEFAULT_PROFILE_AVATAR_BY_COHORT.pathfinder).src).toBe(
      COHORT_AVATAR.pathfinder.src,
    );
    expect(profileAvatarOption(DEFAULT_PROFILE_AVATAR_BY_COHORT.maverick).src).toBe(
      COHORT_AVATAR.maverick.src,
    );
  });

  it("the profile source has no always-open avatar chooser", () => {
    const source = readFileSync("components/dashboard/profile/profile-panel.tsx", "utf8");
    expect(source).toContain("data-profile-avatar-edit");
    expect(source).toContain("TODO(role pill)");
  });
});
