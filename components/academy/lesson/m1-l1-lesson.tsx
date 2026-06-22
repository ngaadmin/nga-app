"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AcademyLessonShell,
  LessonScreenPane,
  lessonCardClass,
  lessonChoiceClass,
} from "@/components/academy/lesson/academy-lesson-shell";
import {
  completeAcademyMilestone,
  readAcademyMilestones,
  saveAcademyMilestones,
} from "@/lib/dashboard/academy-progress-storage";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import {
  M1_L1_ACHIEVEMENT_SKILL_ID,
  M1_L1_PERFECT_STREAK_BONUS,
  M1_L1_SKILL_ID,
  M1_L1_XP_REWARD,
} from "@/lib/academy/lessons/registry";
import { setVaultSkillTierOverride } from "@/lib/dashboard/vault-skill-progress-storage";
import { LessonCompletionPane } from "@/components/academy/lesson/lesson-completion-pane";
import {
  LESSON_CASH_IN_LABEL,
  lessonGoldClaimClass,
} from "@/components/academy/lesson/lesson-shared-styles";
import { cn } from "@/lib/utils/cn";

const TOTAL_SCREENS = 8;
const FREEZE_HOLD_MS = 2000;

const SORT_ITEMS = [
  { id: "pizza", emoji: "🍕", label: "Pizza slice", bucket: "short" as const },
  { id: "slushie", emoji: "🥤", label: "Giant slushie", bucket: "short" as const },
  {
    id: "controller",
    emoji: "🎮",
    label: "Gaming controller",
    bucket: "long" as const,
  },
  {
    id: "novel",
    emoji: "📚",
    label: "Graphic novel",
    bucket: "long" as const,
  },
];

const goldClaimClass = lessonGoldClaimClass;

function playSuccessPing(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = new window.AudioContext();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.18);
  } catch {
    /* Audio optional in sandboxed contexts */
  }
}

function triggerErrorVibration(): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(120);
  }
}

type ScreenFlash = "none" | "error" | "success";

type M1L1LessonProps = {
  milestoneId?: number;
};

export function M1L1Lesson({ milestoneId = 1 }: M1L1LessonProps) {
  const router = useRouter();
  const { awardLessonXp } = useDashboardWallet();

  const [screenIndex, setScreenIndex] = useState(0);
  const [screenReady, setScreenReady] = useState<boolean[]>(
    () => Array.from({ length: TOTAL_SCREENS }, () => false),
  );
  const [screenFlash, setScreenFlash] = useState<ScreenFlash>("none");
  const [screenMistakes, setScreenMistakes] = useState(0);

  // Screen 1
  const [wordDropChoice, setWordDropChoice] = useState<string | null>(null);
  const [wordDropError, setWordDropError] = useState<string | null>(null);

  // Screen 2
  const [sentenceChoice, setSentenceChoice] = useState<"a" | "b" | null>(null);
  const [sentenceError, setSentenceError] = useState<string | null>(null);

  // Screen 3
  const [tappedItems, setTappedItems] = useState<Set<string>>(new Set());

  // Screen 4
  const [sortIndex, setSortIndex] = useState(0);
  const [sortedToBuckets, setSortedToBuckets] = useState<{
    short: string[];
    long: string[];
  }>({ short: [], long: [] });
  const [sortError, setSortError] = useState(false);

  const sortQueue = SORT_ITEMS;

  // Screen 5
  const [trapChoice, setTrapChoice] = useState<"a" | "b" | null>(null);
  const [trapError, setTrapError] = useState<string | null>(null);

  // Screen 6
  const [freezeProgress, setFreezeProgress] = useState(0);
  const [freezeComplete, setFreezeComplete] = useState(false);
  const [isHoldingFreeze, setIsHoldingFreeze] = useState(false);
  const [freezeHint, setFreezeHint] = useState<string | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const holdFrameRef = useRef<number | null>(null);

  // Screen 7
  const [lessonComplete, setLessonComplete] = useState(false);

  const markScreenReady = useCallback((index: number) => {
    setScreenReady((current) => {
      if (current[index]) return current;
      const next = [...current];
      next[index] = true;
      return next;
    });
  }, []);

  const incrementMistake = useCallback(() => {
    setScreenMistakes((count) => count + 1);
  }, []);

  const flashScreen = useCallback((kind: ScreenFlash) => {
    setScreenFlash(kind);
    window.setTimeout(() => setScreenFlash("none"), 450);
  }, []);

  const handleWordDrop = (choice: string) => {
    setWordDropChoice(choice);
    if (choice === "Spent") {
      setWordDropError(null);
      markScreenReady(0);
      return;
    }
    setWordDropError(
      "Not quite! Look how fast Lars is running - what is his brain telling him to do?",
    );
    incrementMistake();
  };

  const handleSentenceChoice = (choice: "a" | "b") => {
    setSentenceChoice(choice);
    if (choice === "a") {
      setSentenceError(null);
      markScreenReady(1);
      return;
    }
    setSentenceError(
      "If only! In the real world, once you trade your cash, it's gone. Try again.",
    );
    incrementMistake();
    flashScreen("error");
  };

  const handleItemTap = (itemId: string) => {
    setTappedItems((current) => {
      const next = new Set(current);
      next.add(itemId);
      if (next.size === 4) {
        markScreenReady(2);
      }
      return next;
    });
  };

  const handleSortChoice = (bucket: "short" | "long") => {
    const item = sortQueue[sortIndex];
    if (!item) return;

    if (item.bucket !== bucket) {
      setSortError(true);
      incrementMistake();
      triggerErrorVibration();
      flashScreen("error");
      window.setTimeout(() => setSortError(false), 500);
      return;
    }

    playSuccessPing();
    flashScreen("success");
    setSortedToBuckets((current) => ({
      ...current,
      [bucket]: [...current[bucket], item.id],
    }));
    const nextIndex = sortIndex + 1;
    setSortIndex(nextIndex);
    if (nextIndex >= sortQueue.length) {
      markScreenReady(3);
    }
  };

  const handleTrapChoice = (choice: "a" | "b") => {
    setTrapChoice(choice);
    if (choice === "a") {
      setTrapError(null);
      markScreenReady(4);
      return;
    }
    setTrapError(
      "Don't fall for the flashing countdown! They're giving Lars only 1 minute so he won't stop to think if he really wants to spend his money on it.",
    );
    incrementMistake();
  };

  const startFreezeHold = () => {
    if (freezeComplete) return;
    holdStartRef.current = performance.now();
    setIsHoldingFreeze(true);
    setFreezeHint(null);

    const tick = (now: number) => {
      const start = holdStartRef.current;
      if (start === null) return;

      const elapsed = now - start;
      const progress = Math.min(1, elapsed / FREEZE_HOLD_MS);
      setFreezeProgress(progress);

      if (progress >= 1) {
        setFreezeComplete(true);
        setIsHoldingFreeze(false);
        markScreenReady(5);
        holdStartRef.current = null;
        return;
      }

      holdFrameRef.current = requestAnimationFrame(tick);
    };

    holdFrameRef.current = requestAnimationFrame(tick);
  };

  const endFreezeHold = () => {
    if (freezeComplete) return;
    setIsHoldingFreeze(false);

    if (holdFrameRef.current !== null) {
      cancelAnimationFrame(holdFrameRef.current);
      holdFrameRef.current = null;
    }

    const start = holdStartRef.current;
    holdStartRef.current = null;

    if (start !== null && performance.now() - start < FREEZE_HOLD_MS) {
      setFreezeProgress(0);
      setFreezeHint("(Must hold down fully for 2 seconds to activate)");
    }
  };

  useEffect(() => {
    if (screenIndex === 6) {
      markScreenReady(6);
    }
  }, [screenIndex, markScreenReady]);

  useEffect(() => {
    return () => {
      if (holdFrameRef.current !== null) {
        cancelAnimationFrame(holdFrameRef.current);
      }
    };
  }, []);

  const perfectStreak = screenMistakes === 0;

  const handleCashInPoints = () => {
    if (lessonComplete) return;
    setLessonComplete(true);
    awardLessonXp(M1_L1_XP_REWARD);
    if (perfectStreak) {
      awardLessonXp(M1_L1_PERFECT_STREAK_BONUS);
    }

    const milestones = readAcademyMilestones();
    const alreadyCompleted = milestones.some(
      (node) => node.id === milestoneId && node.status === "completed",
    );

    if (!alreadyCompleted) {
      setVaultSkillTierOverride(M1_L1_SKILL_ID, "bronze");

      const updated = completeAcademyMilestone(milestoneId, milestones);
      saveAcademyMilestones(updated);
    }

    router.push("/dashboard/academy");
  };

  const handleNext = () => {
    if (!screenReady[screenIndex]) return;
    setScreenIndex((current) => Math.min(TOTAL_SCREENS - 1, current + 1));
  };

  const flashBorderClass =
    screenFlash === "error"
      ? "ring-4 ring-[#E11D48]/70"
      : screenFlash === "success"
        ? "ring-4 ring-[#22C55E]/70"
        : "";

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col transition-shadow duration-200",
        flashBorderClass,
        sortError && screenIndex === 3 && "ring-4 ring-[#E11D48]",
      )}
    >
      <AcademyLessonShell
        lessonLabel="Module 1 · Lesson 1 · Money In, Money Out"
        currentScreenIndex={screenIndex}
        totalScreens={TOTAL_SCREENS}
        canAdvance={Boolean(screenReady[screenIndex]) && screenIndex < TOTAL_SCREENS - 1}
        onNext={handleNext}
        footerSlot={
          screenIndex === TOTAL_SCREENS - 1 ? (
            <button
              type="button"
              onClick={handleCashInPoints}
              disabled={lessonComplete}
              className={goldClaimClass}
            >
              {lessonComplete ? "Cashing in..." : LESSON_CASH_IN_LABEL}
            </button>
          ) : undefined
        }
      >
        {/* Screen 1: The Hook */}
        <LessonScreenPane>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            Lars just got $20 for his birthday! He runs to the shop, but his
            brain tricks him into thinking cash must be{" "}
            <span className="inline-block min-w-[5rem] border-b-2 border-dashed border-[#0CC1E0] px-2 font-heading font-extrabold text-[#031F82]">
              {wordDropChoice ?? "______"}
            </span>{" "}
            right away!
          </p>
          <div className={cn(lessonCardClass, "mt-5 space-y-2")}>
            <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
              Word Drop
            </p>
            <div className="flex flex-wrap gap-2">
              {["Spent", "Saved", "Hidden"].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleWordDrop(option)}
                  className={cn(
                    lessonChoiceClass,
                    "w-auto px-5 py-2 text-xs",
                    wordDropChoice === option && "border-[#0CC1E0] bg-[#BDE9FB]/30",
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          {wordDropError ? (
            <p className="mt-4 rounded-xl bg-[#FFF7ED] px-3 py-2 font-sans text-xs text-[#031F82]">
              {wordDropError}
            </p>
          ) : null}
        </LessonScreenPane>

        {/* Screen 2: Physics A */}
        <LessonScreenPane>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            Lars buys a giant bag of sour worms and a plastic fidget spinner.
            He&apos;s super happy, but ten minutes later...
          </p>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => handleSentenceChoice("a")}
              className={cn(
                lessonChoiceClass,
                sentenceChoice === "a" && "border-[#22C55E] bg-[#DCFCE7]/60",
              )}
            >
              ...the candy is gone and the toy feels boring.
            </button>
            <button
              type="button"
              onClick={() => handleSentenceChoice("b")}
              className={cn(
                lessonChoiceClass,
                sentenceChoice === "b" && "border-[#E11D48] bg-[#FEE2E2]/50",
              )}
            >
              ...his $20 cash magically reappears.
            </button>
          </div>
          {sentenceError ? (
            <p className="mt-4 font-sans text-xs text-[#E11D48]">{sentenceError}</p>
          ) : null}
        </LessonScreenPane>

        {/* Screen 3: Physics B */}
        <LessonScreenPane>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            Lars&apos;s money is gone and he only had 10 minutes of fun. Tap these
            items to see the difference!
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {[
              { id: "worms", label: "🍬 Sour Worms", bucket: "short" as const },
              { id: "popcorn", label: "🍿 Cinema Popcorn", bucket: "short" as const },
              { id: "headphones", label: "🎧 Wireless Headphones", bucket: "long" as const },
              { id: "skateboard", label: "🛹 Skateboard", bucket: "long" as const },
            ].map((item) => {
              const tapped = tappedItems.has(item.id);
              const tappedShortClass =
                "pointer-events-none border-[#E11D48] bg-[#FEE2E2]/40 shadow-[inset_0_0_0_1px_#E11D48]";
              const tappedLongClass =
                "pointer-events-none border-[#22C55E] bg-[#DCFCE7]/50 shadow-[inset_0_0_0_1px_#22C55E]";
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-disabled={tapped}
                  onClick={() => handleItemTap(item.id)}
                  className={cn(
                    lessonChoiceClass,
                    "text-xs",
                    tapped &&
                      (item.bucket === "short" ? tappedShortClass : tappedLongClass),
                  )}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className={cn(lessonCardClass, "min-h-[4.5rem] text-center")}>
              <p className="font-heading text-[9px] font-bold uppercase text-[#E11D48]">
                Short Fun
              </p>
              <p className="mt-2 text-lg">
                {[..."🍬🍿"].filter((_, i) => i < [...tappedItems].filter((id) => id === "worms" || id === "popcorn").length).join("")}
                {tappedItems.has("worms") ? "🍬" : ""}
                {tappedItems.has("popcorn") ? "🍿" : ""}
              </p>
            </div>
            <div className={cn(lessonCardClass, "min-h-[4.5rem] text-center")}>
              <p className="font-heading text-[9px] font-bold uppercase text-[#22C55E]">
                More Fun for Longer
              </p>
              <p className="mt-2 text-lg">
                {tappedItems.has("headphones") ? "🎧" : ""}
                {tappedItems.has("skateboard") ? "🛹" : ""}
              </p>
            </div>
          </div>
        </LessonScreenPane>

        {/* Screen 4: Friction Check */}
        <LessonScreenPane>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            Your turn! Sort these items into the correct bucket.
          </p>
          {sortIndex < sortQueue.length ? (
            <div className={cn(lessonCardClass, "mt-5 text-center")}>
              <p className="text-3xl" aria-hidden>
                {sortQueue[sortIndex]?.emoji}
              </p>
              <p className="mt-2 font-heading text-sm font-extrabold text-[#031F82]">
                {sortQueue[sortIndex]?.label}
              </p>
            </div>
          ) : (
            <p className="mt-5 text-center font-heading text-sm font-bold text-[#22C55E]">
              All sorted!
            </p>
          )}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSortChoice("short")}
              disabled={sortIndex >= sortQueue.length}
              className={lessonChoiceClass}
            >
              Short Fun
              {sortedToBuckets.short.length > 0 ? (
                <span className="mt-1 block text-lg">
                  {sortedToBuckets.short
                    .map(
                      (itemId) =>
                        SORT_ITEMS.find((entry) => entry.id === itemId)?.emoji,
                    )
                    .join("")}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => handleSortChoice("long")}
              disabled={sortIndex >= sortQueue.length}
              className={lessonChoiceClass}
            >
              More Fun for Longer
              {sortedToBuckets.long.length > 0 ? (
                <span className="mt-1 block text-lg">
                  {sortedToBuckets.long
                    .map(
                      (itemId) =>
                        SORT_ITEMS.find((entry) => entry.id === itemId)?.emoji,
                    )
                    .join("")}
                </span>
              ) : null}
            </button>
          </div>
        </LessonScreenPane>

        {/* Screen 5: The Trap */}
        <LessonScreenPane>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            Next day, an alert flashes on Lars&apos;s tablet: 💥 RARE SKIN DEAL!
            ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?
          </p>
          <div className="mt-5 space-y-3">
            <button
              type="button"
              onClick={() => handleTrapChoice("a")}
              className={cn(
                lessonChoiceClass,
                trapChoice === "a" && "border-[#22C55E] bg-[#DCFCE7]/60",
              )}
            >
              To trick his brain into buying fast.
            </button>
            <button
              type="button"
              onClick={() => handleTrapChoice("b")}
              className={cn(
                lessonChoiceClass,
                trapChoice === "b" && "border-[#FFA503] bg-[#FFF7ED]",
              )}
            >
              Because the game creators love him.
            </button>
          </div>
          {trapError ? (
            <p className="mt-4 rounded-xl bg-[#FFF7ED] px-3 py-2 font-sans text-xs text-[#031F82]">
              {trapError}
            </p>
          ) : null}
        </LessonScreenPane>

        {/* Screen 6: The Escape */}
        <LessonScreenPane>
          <div className="relative flex flex-1 flex-col">
          <p
            className={cn(
              "font-sans text-sm leading-relaxed text-[#1E3A5F] transition-all",
              freezeComplete && "opacity-60 blur-[1px]",
            )}
          >
            Help Lars by giving him a &apos;buy freeze&apos; so his brain has time
            to think.
          </p>
          {freezeComplete ? (
            <div
              className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-[#BDE9FB]/40 via-transparent to-[#0CC1E0]/20"
              aria-hidden
            />
          ) : null}
          <div className="relative mt-8 flex flex-col items-center">
            <button
              type="button"
              onPointerDown={startFreezeHold}
              onPointerUp={endFreezeHold}
              onPointerLeave={endFreezeHold}
              onPointerCancel={endFreezeHold}
              style={{ touchAction: "none" }}
              className={cn(
                "select-none rounded-2xl border-b-4 border-[#099FB8] bg-[#0CC1E0] px-6 py-5 font-heading text-sm font-extrabold uppercase tracking-wide text-[#031F82] shadow-md transition-transform active:scale-[0.98]",
                freezeComplete && "border-[#6366F1] bg-[#6366F1] text-white",
              )}
            >
              {freezeComplete ? "❄️ FROZEN ❄️" : "❄️ HOLD TO FREEZE ❄️"}
            </button>
            <div className="mt-4 h-3 w-full max-w-xs overflow-hidden rounded-full border border-[#BDE9FB]/60 bg-[#E8F7FC]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0CC1E0] to-[#099FB8]"
                style={{
                  width: `${freezeProgress * 100}%`,
                  transition: isHoldingFreeze ? "none" : "width 150ms ease-out",
                }}
              />
            </div>
            {freezeComplete ? (
              <p className="mt-4 rounded-xl bg-[#DCFCE7] px-4 py-3 text-center font-heading text-sm font-extrabold text-[#031F82]">
                Success! Lars has to wait 24 hours.
              </p>
            ) : null}
            {freezeHint ? (
              <p className="mt-3 font-sans text-xs text-[#1E3A5F]/80">{freezeHint}</p>
            ) : null}
          </div>
          </div>
        </LessonScreenPane>

        {/* Screen 7: Narrative Resolution */}
        <LessonScreenPane>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            The freeze worked! The next morning, Lars realized he didn&apos;t
            even want that skin anymore. He kept his money safe to save for a
            new gaming headset. Congratulations for helping him avoid wasting
            his money.
          </p>
        </LessonScreenPane>

        {/* Screen 8: Milestone Splash */}
        <LessonScreenPane>
          <LessonCompletionPane
            xpReward={M1_L1_XP_REWARD}
            perfectStreakBonus={M1_L1_PERFECT_STREAK_BONUS}
            perfectStreak={perfectStreak}
            achievementSkillId={M1_L1_ACHIEVEMENT_SKILL_ID}
          />
        </LessonScreenPane>
      </AcademyLessonShell>
    </div>
  );
}
