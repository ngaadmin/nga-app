import { describe, expect, it } from "vitest";
import {
  lessonAwardLedgerEvents,
  lessonCoinAward,
} from "@/lib/academy/lessons/completion-xp";
import { applyLessonCoinAward } from "@/lib/academy/lessons/lesson-coin-commit";
import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import {
  payloadCompletionMedalTier,
  resolvePayloadLesson,
} from "@/lib/academy/lessons/payload/map-payload-lesson";
import {
  appendWalletLedgerEvent,
  WALLET_SCHEMA_VERSION,
  type PersistedDashboardWallet,
} from "@/lib/dashboard/dashboard-wallet-storage";

const AT = "2026-10-20T00:00:00.000Z";

function freshWallet(): PersistedDashboardWallet {
  return {
    schemaVersion: WALLET_SCHEMA_VERSION,
    ownerUserId: null,
    totalPoints: 0,
    lifetimePointsEarned: 0,
    audSliderIndex: 0,
    xpExchangeRateSet: false,
  };
}

function lessonCashIn(lessonNumber: number) {
  const payload = loadBundledLessonPayload(1, lessonNumber);
  const content = resolvePayloadLesson(payload, "explorer", lessonNumber);
  const completion = content.screens.find((screen) => screen.type === "completion");
  const award = lessonCoinAward({ perfect: true, bonusCoins: 0 });
  return {
    payload,
    content,
    completion: completion?.type === "completion" ? completion : undefined,
    award,
    events: lessonAwardLedgerEvents(content.meta.milestoneId, award),
  };
}

describe("module 1 lesson 2 cash-in versus lesson 3", () => {
  const lesson2 = lessonCashIn(2);
  const lesson3 = lessonCashIn(3);

  it("uses the same bronze medal row and different ledger keys", () => {
    expect(lesson2.completion?.medalTier).toBe("bronze");
    expect(lesson2.completion?.medalId).toBe("medal-skill2-bronze");
    expect(lesson2.completion?.authoredMedal).toBe(true);
    expect(lesson2.payload.skillId).toBe("put-needs-first");

    expect(lesson3.completion?.medalTier).toBe("bronze");
    expect(lesson3.completion?.medalId).toBe("medal-skill3-bronze");
    expect(lesson3.completion?.authoredMedal).toBe(true);
    expect(lesson3.payload.skillId).toBe("keep-spare-cash");

    expect(payloadCompletionMedalTier(lesson2.content)).toBe("bronze");
    expect(payloadCompletionMedalTier(lesson3.content)).toBe("bronze");
    expect(lesson2.award.total).toBe(150);
    expect(lesson3.award.total).toBe(150);
    expect(lesson2.events.map((event) => event.id)).toEqual([
      "lesson:2:completion",
      "lesson:2:perfect",
    ]);
    expect(lesson3.events.map((event) => event.id)).toEqual([
      "lesson:3:completion",
      "lesson:3:perfect",
    ]);
  });

  it("adds lesson 2 coins on the first cash-in and does not pay them twice", () => {
    const first = applyLessonCoinAward(freshWallet(), lesson2.events, AT);
    const second = applyLessonCoinAward(first.wallet, lesson2.events, AT);

    expect(first.awarded).toBe(150);
    expect(first.wallet.totalPoints).toBe(150);
    expect(second.awarded).toBe(0);
    expect(second.wallet.totalPoints).toBe(150);
  });

  it("puts a stuck lesson 2 total back when that key was already stored", () => {
    const lesson1 = applyLessonCoinAward(
      freshWallet(),
      lessonAwardLedgerEvents(1, lessonCoinAward({ perfect: false, bonusCoins: 0 })),
      AT,
    ).wallet;
    const afterSpend = appendWalletLedgerEvent(lesson1, {
      id: "vault-cash-in",
      kind: "spend",
      points: 40,
      at: AT,
    });
    expect(afterSpend?.totalPoints).toBe(60);

    const recorded = applyLessonCoinAward(afterSpend!, lesson2.events, AT).wallet;
    expect(recorded.totalPoints).toBe(210);

    const stuck: PersistedDashboardWallet = { ...recorded, totalPoints: 60 };
    const retried = applyLessonCoinAward(stuck, lesson2.events, AT);

    expect(retried.awarded).toBe(0);
    expect(retried.wallet.totalPoints).toBe(210);
    expect(
      retried.wallet.ledger?.filter((event) => event.id === "lesson:2:completion"),
    ).toHaveLength(1);
  });

  it("lets a new lesson 3 key raise the total the same way", () => {
    const start = applyLessonCoinAward(freshWallet(), lesson2.events, AT).wallet;
    const lesson3Award = applyLessonCoinAward(start, lesson3.events, AT);

    expect(lesson3Award.awarded).toBe(150);
    expect(lesson3Award.wallet.totalPoints).toBe(300);
  });
});
