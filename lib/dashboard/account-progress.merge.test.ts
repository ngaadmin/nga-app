import { describe, expect, it } from "vitest";

import {
  hasPersistedPageIntros,
  isEmptyAccountProgress,
  mergeAccountProgress,
  mergeAcademyProgress,
  mergeWalletProgress,
  overlayAccountProgress,
  parseAccountProgressPayload,
  pickRestoredAccountProgress,
  type AccountProgressPayload,
} from "@/lib/dashboard/account-progress";
import {
  createMilestoneNode,
  createPhase1MilestoneScaffold,
} from "@/lib/dashboard/academy-state";
import type {
  PersistedDashboardWallet,
  WalletLedgerEvent,
} from "@/lib/dashboard/dashboard-wallet-storage";

function wallet(
  partial: Pick<PersistedDashboardWallet, "totalPoints" | "lifetimePointsEarned"> &
    Partial<PersistedDashboardWallet>,
): PersistedDashboardWallet {
  return {
    audSliderIndex: 0,
    xpExchangeRateSet: false,
    ...partial,
  };
}

function earn(id: string, points: number, at = "2026-01-02T00:00:00.000Z"): WalletLedgerEvent {
  return { id, kind: "earn", points, at };
}

function spend(id: string, points: number, at = "2026-01-03T00:00:00.000Z"): WalletLedgerEvent {
  return { id, kind: "spend", points, at };
}

function payload(
  partial: Partial<AccountProgressPayload>,
): AccountProgressPayload {
  return {
    schemaVersion: 1,
    academyProgress: null,
    wallet: null,
    skillProgress: null,
    vaultProfile: null,
    vaultSession: null,
    ...partial,
  };
}

describe("mergeAcademyProgress", () => {
  it("keeps the furthest lesson and never re-locks a finished one", () => {
    const merged = mergeAcademyProgress(
      createPhase1MilestoneScaffold(1),
      createPhase1MilestoneScaffold(3),
    );

    expect(merged?.find((node) => node.id === 1)?.status).toBe("completed");
    expect(merged?.find((node) => node.id === 2)?.status).toBe("completed");
    expect(merged?.find((node) => node.id === 3)?.status).toBe("active");
    expect(merged?.find((node) => node.id === 4)?.status).toBe("locked");
  });

  it("unions completions even when both sides have the same count", () => {
    const merged = mergeAcademyProgress(
      [
        createMilestoneNode(1, "completed"),
        createMilestoneNode(2, "active"),
        createMilestoneNode(3, "locked"),
      ],
      [
        createMilestoneNode(1, "completed"),
        createMilestoneNode(2, "locked"),
        createMilestoneNode(3, "completed"),
      ],
    );

    expect(merged?.map((node) => node.status)).toEqual([
      "completed",
      "completed",
      "completed",
    ]);
  });
});

describe("mergeWalletProgress", () => {
  it("keeps the higher lifetime XP", () => {
    const merged = mergeWalletProgress(
      wallet({ totalPoints: 40, lifetimePointsEarned: 40 }),
      wallet({ totalPoints: 100, lifetimePointsEarned: 100 }),
    );

    expect(merged?.lifetimePointsEarned).toBe(100);
    expect(merged?.totalPoints).toBe(100);
  });

  it("does not let a stale balance undo a cash-in", () => {
    const merged = mergeWalletProgress(
      wallet({
        totalPoints: 60,
        lifetimePointsEarned: 100,
        ledger: [spend("cash-in-a", 40)],
        updatedAt: "2026-02-02T00:00:00.000Z",
      }),
      wallet({
        totalPoints: 100,
        lifetimePointsEarned: 100,
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
    );

    expect(merged?.lifetimePointsEarned).toBe(100);
    expect(merged?.totalPoints).toBe(60);
  });

  it("does not let a stale device erase XP earned on another device", () => {
    const merged = mergeWalletProgress(
      wallet({
        totalPoints: 50,
        lifetimePointsEarned: 50,
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
      wallet({
        totalPoints: 150,
        lifetimePointsEarned: 150,
        ledger: [earn("lesson:2:completion", 100)],
        updatedAt: "2026-02-02T00:00:00.000Z",
      }),
    );

    expect(merged?.lifetimePointsEarned).toBe(150);
    expect(merged?.totalPoints).toBe(150);
  });

  it("keeps cash-ins from both devices and does not pay the same lesson twice", () => {
    const sharedEarn = earn("lesson:1:completion", 100, "2026-01-01T00:00:00.000Z");
    const merged = mergeWalletProgress(
      wallet({
        totalPoints: 60,
        lifetimePointsEarned: 100,
        ledger: [sharedEarn, spend("cash-in-a", 40, "2026-01-02T00:00:00.000Z")],
      }),
      wallet({
        totalPoints: 70,
        lifetimePointsEarned: 100,
        ledger: [sharedEarn, spend("cash-in-b", 30, "2026-01-02T00:00:00.000Z")],
      }),
    );

    expect(merged?.lifetimePointsEarned).toBe(100);
    expect(merged?.totalPoints).toBe(30);
    expect(merged?.ledger?.map((event) => event.id)).toEqual([
      "lesson:1:completion",
      "cash-in-a",
      "cash-in-b",
    ]);
  });

  it("follows the newer exchange-rate setting", () => {
    const merged = mergeWalletProgress(
      wallet({
        totalPoints: 10,
        lifetimePointsEarned: 10,
        audSliderIndex: 1,
        xpExchangeRateSet: true,
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
      wallet({
        totalPoints: 10,
        lifetimePointsEarned: 10,
        audSliderIndex: 4,
        xpExchangeRateSet: true,
        updatedAt: "2026-03-01T00:00:00.000Z",
      }),
    );

    expect(merged?.audSliderIndex).toBe(4);
  });
});

describe("overlayAccountProgress", () => {
  it("merges lessons and the wallet instead of replacing the cloud copy", () => {
    const merged = overlayAccountProgress(
      payload({
        academyProgress: createPhase1MilestoneScaffold(3),
        wallet: wallet({
          totalPoints: 60,
          lifetimePointsEarned: 100,
          ledger: [spend("cash-in-a", 40)],
        }),
      }),
      payload({
        academyProgress: createPhase1MilestoneScaffold(1),
        wallet: wallet({ totalPoints: 100, lifetimePointsEarned: 100 }),
      }),
    );

    expect(merged?.academyProgress?.find((node) => node.id === 2)?.status).toBe(
      "completed",
    );
    expect(merged?.academyProgress?.find((node) => node.id === 3)?.status).toBe(
      "active",
    );
    expect(merged?.wallet?.lifetimePointsEarned).toBe(100);
    expect(merged?.wallet?.totalPoints).toBe(60);
  });
});

describe("pickRestoredAccountProgress", () => {
  it("keeps a lesson just saved on this device when the cloud copy is older", () => {
    const restored = pickRestoredAccountProgress({
      remote: payload({
        academyProgress: createPhase1MilestoneScaffold(1),
        wallet: wallet({ totalPoints: 20, lifetimePointsEarned: 20 }),
      }),
      live: payload({
        academyProgress: createPhase1MilestoneScaffold(3),
        wallet: wallet({ totalPoints: 40, lifetimePointsEarned: 40 }),
      }),
    });

    expect(restored?.academyProgress?.find((node) => node.id === 1)?.status).toBe(
      "completed",
    );
    expect(restored?.academyProgress?.find((node) => node.id === 2)?.status).toBe(
      "completed",
    );
    expect(restored?.academyProgress?.find((node) => node.id === 3)?.status).toBe(
      "active",
    );
    expect(restored?.wallet?.lifetimePointsEarned).toBe(40);
  });
});

describe("page intro flags in learner progress", () => {
  it("keeps an intro-only payload and ignores unknown hubs", () => {
    const parsed = parseAccountProgressPayload({
      pageIntros: {
        hubs: { academy: true, mystery: true, vault: false },
        medals: true,
        skillsCup: false,
      },
    });

    expect(parsed?.pageIntros).toEqual({
      hubs: { academy: true },
      medals: true,
    });
    expect(isEmptyAccountProgress(parsed)).toBe(true);
    expect(hasPersistedPageIntros(parsed)).toBe(true);
  });

  it("unions seen intros and never clears one", () => {
    const merged = mergeAccountProgress(
      payload({
        pageIntros: { hubs: { academy: true }, medals: true },
      }),
      payload({
        pageIntros: { hubs: { vault: true }, vaultAddMoney: true },
      }),
    );

    expect(merged?.pageIntros).toEqual({
      hubs: { academy: true, vault: true },
      medals: true,
      vaultAddMoney: true,
    });

    const overlaid = overlayAccountProgress(
      payload({ pageIntros: { hubs: { academy: true } } }),
      payload({ wallet: wallet({ totalPoints: 10, lifetimePointsEarned: 10 }) }),
    );
    expect(overlaid?.pageIntros).toEqual({ hubs: { academy: true } });
    expect(overlaid?.wallet?.lifetimePointsEarned).toBe(10);
  });
});

describe("parseAccountProgressPayload wallet migration", () => {
  it("treats a missing lifetime total as the current balance", () => {
    const parsed = parseAccountProgressPayload({
      wallet: { totalPoints: 40, audSliderIndex: 2 },
    });

    expect(parsed?.wallet?.lifetimePointsEarned).toBe(40);
    expect(parsed?.wallet?.totalPoints).toBe(40);
  });

  it("raises a lifetime total that sits below the spendable balance", () => {
    const parsed = parseAccountProgressPayload({
      wallet: {
        totalPoints: 80,
        lifetimePointsEarned: 10,
        audSliderIndex: 0,
      },
    });

    expect(parsed?.wallet?.lifetimePointsEarned).toBe(80);
  });
});
