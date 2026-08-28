"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DESIGN_SHELL_LESSON_DEFINITION } from "@/lib/academy/lessons/content/design-shell";
import { ACADEMY_DESIGN_SHELL_PATH } from "@/lib/academy/lessons/registry";
import { LAYER_CLASS } from "@/lib/ui/layers";
import { cn } from "@/lib/utils/cn";
import {
  isMultipleChoiceScreen,
  type ScreenConfig,
} from "@/lib/academy/lessons/types";

/** Living screen types shown as chips — one chip each, first matching screen. */
const LIVING_SCREEN_TYPES = [
  "word-drop",
  "multiple-choice",
  "true-false",
  "tap-reveal",
  "bucket-sort",
  "link-match",
  "rank-order",
  "spotlight-rounds",
  "hold-to-fill",
  "drag-to-target",
  "savings-goal",
  "allocation-slider",
  "budget-select",
  "completion",
] as const;

type LivingScreenType = (typeof LIVING_SCREEN_TYPES)[number];

type LivingTypeChip = {
  type: LivingScreenType;
  id: string;
  index: number;
};

function screenMatchesLivingType(
  screen: ScreenConfig,
  type: LivingScreenType,
): boolean {
  if (type === "multiple-choice") return isMultipleChoiceScreen(screen);
  return screen.type === type;
}

function livingTypeChips(screens: readonly ScreenConfig[]): LivingTypeChip[] {
  const chips: LivingTypeChip[] = [];
  for (const type of LIVING_SCREEN_TYPES) {
    const index = screens.findIndex((screen) =>
      screenMatchesLivingType(screen, type),
    );
    if (index < 0) continue;
    const screen = screens[index];
    if (!screen) continue;
    chips.push({ type, id: screen.id, index });
  }
  return chips;
}

type DesignShellJumpSyncProps = {
  screens: readonly ScreenConfig[];
  currentIndex: number;
  onJump: (index: number) => void;
};

/** Resolve a design-shell jump from ?type= and/or ?screen=. */
export function resolveDesignShellJumperIndex(
  screens: readonly ScreenConfig[],
  typeParam: string | null,
  screenParam: string | null,
): number | null {
  const screenKey = screenParam?.trim() ?? "";
  if (screenKey) {
    const byId = screens.findIndex((entry) => entry.id === screenKey);
    if (byId >= 0) return byId;

    const asNumber = Number.parseInt(screenKey, 10);
    if (Number.isFinite(asNumber) && asNumber >= 1 && asNumber <= screens.length) {
      return asNumber - 1;
    }
  }

  const typeKey = typeParam?.trim() ?? "";
  if (typeKey) {
    const resolvedType =
      typeKey === "binary-choice" ? "multiple-choice" : typeKey;
    const byType = screens.findIndex((entry) =>
      resolvedType === "multiple-choice"
        ? isMultipleChoiceScreen(entry)
        : entry.type === resolvedType,
    );
    if (byType >= 0) return byType;
  }

  return null;
}

/** Invisible URL → screenIndex bridge. Design-shell only; renders nothing. */
export function DesignShellJumpSync({
  screens,
  currentIndex,
  onJump,
}: DesignShellJumpSyncProps) {
  const searchParams = useSearchParams();
  const appliedQueryRef = useRef<string | null>(null);

  const typeParam = searchParams.get("type");
  const screenParam = searchParams.get("screen");
  const queryKey = `${typeParam ?? ""}|${screenParam ?? ""}`;

  useEffect(() => {
    if (appliedQueryRef.current === queryKey) return;
    const nextIndex = resolveDesignShellJumperIndex(
      screens,
      typeParam,
      screenParam,
    );
    if (nextIndex === null) return;
    appliedQueryRef.current = queryKey;
    if (nextIndex !== currentIndex) onJump(nextIndex);
  }, [currentIndex, onJump, queryKey, screenParam, screens, typeParam]);

  return null;
}

/** Dev/QA only — full-width chip strip above the design-shell lesson chrome. */
export function DesignShellScreenJumper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const screens = DESIGN_SHELL_LESSON_DEFINITION.baseScreens ?? [];
  const chips = livingTypeChips(screens);
  const activeType = searchParams.get("type");

  const jumpTo = (chip: LivingTypeChip) => {
    const params = new URLSearchParams();
    params.set("type", chip.type);
    params.set("screen", chip.id);
    router.replace(`${ACADEMY_DESIGN_SHELL_PATH}?${params.toString()}`, {
      scroll: false,
    });
  };

  return (
    <nav
      aria-label="Jump to screen type"
      className={cn(
        "sticky top-0 shrink-0 border-b border-[#031F82] bg-white px-3 py-2 text-[#031F82]",
        LAYER_CLASS.dev,
      )}
    >
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip) => {
          const isActive = activeType === chip.type;
          return (
            <button
              key={chip.type}
              type="button"
              aria-current={isActive ? "true" : undefined}
              onClick={() => jumpTo(chip)}
              className={cn(
                "rounded-full border border-[#031F82] px-2.5 py-1 font-sans text-[11px] font-semibold leading-tight",
                isActive
                  ? "bg-[#031F82] text-white"
                  : "bg-white text-[#031F82]",
              )}
            >
              {chip.type}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
