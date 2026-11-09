"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { LaunchpadFloor, LaunchpadTask } from "@/lib/launchpad/content/types";
import type { LaunchpadVentureView } from "@/lib/launchpad/content/venture-view";
import {
  advanceAfterTask,
  applyVentureTestShortcut,
  bronzeStates,
  pricingBronzeStates,
  buildingCta,
  completeTask,
  currentLevel,
  bronzeHasOpenTask,
  deferTask,
  draftPageOf,
  isTaskOpen,
  openTasks,
  openTasksInSilver,
  restoreTaskDraft,
  bronzeEntryTaskIndex,
  floorState,
  isFloorDone,
  isSilverDone,
  lockedDoorsNote,
  setProgressAnswer,
  silverStates,
  type VentureTestProgress,
  type VentureTestShortcut,
} from "@/lib/launchpad/venture-test/venture-test-progress";
import {
  clearVentureTestProgress,
  hasSeenVentureTestOnboarding,
  loadVentureTestProgress,
  markVentureTestOnboardingSeen,
  saveVentureTestProgress,
} from "@/lib/launchpad/venture-test/venture-test-storage";
import { VentureTestShell } from "@/components/launchpad/venture-test/venture-test-shell";
import { VentureBuilding, type BuildingFloorView } from "@/components/launchpad/venture-test/venture-building";
import { VentureOnboarding } from "@/components/launchpad/venture-test/venture-onboarding";
import { FloorTemplate } from "@/components/launchpad/venture/floor-templates";
import { BronzeDoors } from "@/components/launchpad/venture/bronze-doors";
import { TaskWorkbook } from "@/components/launchpad/venture/task-workbook";
import { VentureUnavailable } from "@/components/launchpad/venture/venture-unavailable";
import { VentureLift } from "@/components/launchpad/venture-test/venture-lift";
import { VentureRooftopFinish } from "@/components/launchpad/venture-test/venture-rooftop-finish";
import { LaunchpadHome, type InProgressVenture } from "@/components/launchpad/venture-test/launchpad-home";
import { Handbook, HandbookButton } from "@/components/launchpad/venture/handbook/handbook";
import { handbookBusinessName, hasHandbook, withShortcutSampleAnswers } from "@/lib/launchpad/venture-test/handbook";
import { LAUNCHPAD_CATEGORIES, liveVentureIds } from "@/lib/launchpad/venture-test/launchpad-home-data";
import { BackCrumb, BTN_PRIMARY, Heading } from "@/components/launchpad/venture-test/venture-test-ui";
import { isIdentityPicker } from "@/lib/launchpad/content/identity-content";
import { isPageAnswered, isTaskAnswered, pageDefaultAnswer, taskPages, type TaskPage } from "@/lib/launchpad/content/task-pages";
import { LaunchpadAnswersProvider } from "@/components/launchpad/venture/identity/answers-context";
import { fieldsOf } from "@/lib/launchpad/content/answers";
import { findKnowYourCost, type CostEditorStep } from "@/lib/launchpad/content/know-your-cost/logic";
import { KnowYourCostFlow } from "@/components/launchpad/venture/screens/know-your-cost-flow";
import { SetPriceFlow } from "@/components/launchpad/venture/screens/set-price-flow";
import { JobsCoverFlow } from "@/components/launchpad/venture/screens/jobs-cover-flow";
import { CompetitorFlow, CustomerCheckFlow, OfferLoopFlow } from "@/components/launchpad/venture/screens/module2-flows";
import { FundingFlow } from "@/components/launchpad/venture/screens/funding-flow";
import { GettingReadyFlow } from "@/components/launchpad/venture/screens/getting-ready-flow";
import { identityAnswerOf } from "@/lib/launchpad/content/answers";
import { IDENTITY_ANSWER_KEY } from "@/lib/launchpad/content/seed/identity-silver";


/** What the forward button is waiting for on a capture page. */
function pageHint(page: TaskPage | undefined): string | undefined {
  const screen = page?.screen;
  if (!screen) return undefined;
  if (screen.type === "choice-capture") return screen.mode === "multi" ? "Pick at least one to keep going." : "Make a choice to keep going.";
  if (screen.type === "short-text") return "Fill in each blank to keep going.";
  if (screen.type === "rank-order") return "Keep at least one reason above the line to keep going.";
  return undefined;
}

/** What the forward button is waiting for on an identity task. */
function identityHint(task: LaunchpadTask | undefined): string {
  const pickers = task?.screens.filter(isIdentityPicker) ?? [];
  if (pickers.length > 1 && pickers.every((s) => s.type === "logo-picker")) return "Pick a shape, a color and an icon to keep going.";
  if (pickers.length > 1 && pickers.every((s) => s.type === "name-picker")) return "Add a name, a font and a font color to save.";
  return "Make a choice to keep going.";
}

type View =
  | { screen: "home" }
  | { screen: "onboarding" }
  | { screen: "building" }
  /**
   * `workbookCue`: reached by finishing a step (not the level's last), so the
   * corridor shows the workbook icon button; `popIn` only on the first arrival.
   */
  | { screen: "corridor"; level: number; entering: boolean; workbookCue?: { silverId: string; popIn: boolean } }
  | { screen: "doors"; level: number; silverId: string }
  /** `page`: the page inside a paged task (context, then the interaction; goal loops expand). */
  | { screen: "workbook"; level: number; silverId: string; bronzeId: string; index: number; page?: number; costStep?: CostEditorStep }
  | { screen: "lift"; from: number }
  /** PLACEHOLDER rooftop finish (pending Jasper's design), once every floor is done. */
  | { screen: "rooftop" };

/** Doors close, the indicator moves, then the next corridor opens. */
const LIFT_MS = 2400;

/** Building view from the content: one window per silver, lit once that silver is done. */
export function buildingFloors(progress: VentureTestProgress, floors: readonly LaunchpadFloor[]): BuildingFloorView[] {
  return floors.map((f) => ({
    level: f.level,
    name: f.name,
    windows: f.silvers.map((s) => ({ silverId: s.id, lit: isSilverDone(progress, s) })),
    state: floorState(progress, floors, f.level),
  }));
}

function floorAt(floors: readonly LaunchpadFloor[], level: number): LaunchpadFloor {
  const floor = floors.find((f) => f.level === level);
  if (!floor) throw new Error(`Unknown venture floor: ${level}`);
  return floor;
}

/** Display name on the landing page tile (for the In Progress card). */
function tileName(ventureId: string): string | null {
  for (const c of LAUNCHPAD_CATEGORIES)
    for (const t of c.tiles) if (t.kind === "idea" && t.ventureId === ventureId) return t.name;
  return null;
}

/** Ventures underway in this browser: intro seen or any task done. */
function loadInProgress(
  ids: string[],
  titles: Record<string, string>,
  ventures: Record<string, LaunchpadVentureView>,
): InProgressVenture[] {
  return ids.flatMap((id) => {
    const content = ventures[id];
    if (!content?.ok) return [];
    const floors = content.payload.floors;
    const p = loadVentureTestProgress(id);
    if (!hasSeenVentureTestOnboarding(id) && p.completedTaskIds.length === 0) return [];
    const floor = floorAt(floors, currentLevel(p, floors));
    // Progress through the whole business: silvers done out of every silver in the content.
    const silvers = floors.flatMap((f) => f.silvers);
    return [
      {
        ventureId: id,
        name: tileName(id) ?? titles[id] ?? id,
        level: floor.level,
        floorName: floor.name,
        done: silvers.filter((s) => isSilverDone(p, s)).length,
        total: silvers.length,
        hasHandbook: hasHandbook(p, floors),
        openTasks: openTasks(p, floors).map((t) => ({ taskId: t.taskId, title: t.title })),
      },
    ];
  });
}

/**
 * TEST-ONLY Launchpad flow. The landing page is the Business Ideas carousel;
 * tapping a live tile opens that venture. The building intro shows only the
 * first time a venture is opened, then the learner lands on its building.
 * `?venture=<id>` deep-links straight into a venture (test convenience).
 * Floors, plaques, doors, tasks and task screens all come from `ventures`
 * (one loaded content payload per venture, database or bundled seed).
 */
export function VentureFlow({
  initialVentureId,
  ventureTitles,
  ventures,
  reset,
  shortcut = null,
  iconSetOverride = null,
}: {
  initialVentureId: string | null;
  ventureTitles: Record<string, string>;
  ventures: Record<string, LaunchpadVentureView>;
  reset: boolean;
  /** TEST-ONLY `?rooftop=1`, `?complete=all|<silver id>`, `?level=<n>`: set progress, then land there. */
  shortcut?: VentureTestShortcut | null;
  /** TEST-ONLY `?iconSet=<venture id>`: offer that business's logo icons instead of this venture's. */
  iconSetOverride?: string | null;
}) {
  const [ventureId, setVentureId] = useState<string | null>(initialVentureId);
  const [progress, setProgress] = useState<VentureTestProgress | null>(null);
  const [inProgress, setInProgress] = useState<InProgressVenture[] | null>(null);
  const [view, setView] = useState<View>({ screen: "home" });
  /** Open handbook: from home (read-only, any In Progress business) or the building (editable). */
  const [handbook, setHandbook] = useState<{
    ventureId: string;
    entry: "home" | "building";
    /** Opened from the corridor's workbook button (Back to the lift keeps the button); the workbook still opens on page 1. */
    openSilverId?: string;
    openSheet?: string;
    /** "Back to the lift" lands on this floor's corridor (defaults to the current floor). */
    level?: number;
  } | null>(null);
  const closeHandbook = useCallback(() => setHandbook(null), []);
  const ventureTitle = ventureId ? (ventureTitles[ventureId] ?? ventureId) : "";

  const go = useCallback((next: View) => {
    setHandbook(null);
    setView(next);
    window.scrollTo({ top: 0 });
  }, []);

  const openVenture = useCallback(
    (id: string) => {
      setVentureId(id);
      setProgress(loadVentureTestProgress(id));
      go({ screen: hasSeenVentureTestOnboarding(id) ? "building" : "onboarding" });
    },
    [go],
  );

  /** Go on an open task from the home tile: into the venture, the draft restored, on the page left. */
  const openTaskFromHome = useCallback(
    (id: string, taskId: string) => {
      const c = ventures[id];
      if (!c?.ok) return;
      const p = loadVentureTestProgress(id);
      const ref = openTasks(p, c.payload.floors).find((t) => t.taskId === taskId);
      if (!ref) return openVenture(id);
      const page = draftPageOf(p, taskId);
      const restored = restoreTaskDraft(p, taskId);
      saveVentureTestProgress(id, restored);
      setVentureId(id);
      setProgress(restored);
      go({ screen: "workbook", level: ref.level, silverId: ref.silverId, bronzeId: ref.bronzeId, index: ref.taskIndex, ...(page ? { page } : {}) });
    },
    [go, openVenture, ventures],
  );

  const toHome = useCallback(() => {
    setInProgress(loadInProgress(liveVentureIds(), ventureTitles, ventures));
    go({ screen: "home" });
  }, [go, ventureTitles, ventures]);

  useEffect(() => {
    if (reset) {
      for (const id of new Set([...liveVentureIds(), ...(initialVentureId ? [initialVentureId] : [])])) clearVentureTestProgress(id);
    }
    const shortcutContent = shortcut && initialVentureId ? ventures[initialVentureId] : undefined;
    const applied =
      shortcut && initialVentureId && shortcutContent?.ok
        ? applyVentureTestShortcut(shortcut, shortcutContent.payload.floors, loadVentureTestProgress(initialVentureId))
        : null;
    if (applied && initialVentureId && shortcutContent?.ok) {
      const shortcutProgress = withShortcutSampleAnswers(
        applied.progress,
        shortcutContent.payload.floors,
        iconSetOverride ?? initialVentureId,
        tileName(initialVentureId) ?? ventureTitles[initialVentureId] ?? initialVentureId,
      );
      saveVentureTestProgress(initialVentureId, shortcutProgress);
      markVentureTestOnboardingSeen(initialVentureId);
      setInProgress(loadInProgress(liveVentureIds(), ventureTitles, ventures));
      setVentureId(initialVentureId);
      setProgress(shortcutProgress);
      go(applied.land.screen === "corridor" ? { ...applied.land, entering: true } : applied.land);
      return;
    }
    setInProgress(loadInProgress(liveVentureIds(), ventureTitles, ventures));
    if (initialVentureId) openVenture(initialVentureId);
    // Run once per load; reset, the shortcuts and the deep link come from the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view.screen !== "lift") return;
    const t = window.setTimeout(() => go({ screen: "corridor", level: view.from + 1, entering: true }), LIFT_MS);
    return () => window.clearTimeout(t);
  }, [view, go]);

  if (view.screen === "home") {
    return (
      <VentureTestShell>
        {inProgress ? (
          <LaunchpadHome
            inProgress={inProgress}
            onOpenVenture={openVenture}
            onOpenHandbook={(id) => setHandbook({ ventureId: id, entry: "home" })}
            onOpenTask={openTaskFromHome}
          />
        ) : null}
        {handbook?.entry === "home" && ventures[handbook.ventureId]?.ok
          ? (() => {
              const id = handbook.ventureId;
              const c = ventures[id]!;
              if (!c.ok) return null;
              const p = loadVentureTestProgress(id);
              return (
                <Handbook
                  entry="home"
                  businessName={handbookBusinessName(p, c.payload.floors, tileName(id) ?? ventureTitles[id] ?? id)}
                  floors={c.payload.floors}
                  progress={p}
                  iconVentureId={iconSetOverride ?? id}
                  onClose={closeHandbook}
                />
              );
            })()
          : null}
      </VentureTestShell>
    );
  }

  const content = ventureId ? ventures[ventureId] : undefined;
  if (ventureId && !content?.ok) {
    return (
      <VentureTestShell>
        <VentureUnavailable onBack={toHome} />
      </VentureTestShell>
    );
  }

  if (!progress || !ventureId || !content?.ok) {
    // White frame while the local progress stub loads.
    return <VentureTestShell>{null}</VentureTestShell>;
  }
  const floors = content.payload.floors;

  const save = (next: VentureTestProgress) => {
    setProgress(next);
    saveVentureTestProgress(ventureId, next);
  };

  const iconVentureId = iconSetOverride ?? ventureId;
  const setAnswer = (answerKey: string, answer: Parameters<typeof setProgressAnswer>[2]) =>
    save(setProgressAnswer(progress, answerKey, answer));

  /**
   * Opens a task from a door, a Come back marker or a Finish this link. A task
   * left open gets its draft back and lands on the page the learner left.
   */
  const openTask = (where: { level: number; silverId: string; bronzeId: string }, index: number) => {
    const floor = floorAt(floors, where.level);
    const task = floor.silvers.find((s) => s.id === where.silverId)?.bronzes.find((b) => b.id === where.bronzeId)?.tasks[index];
    if (task && isTaskOpen(progress, task.id)) {
      const page = draftPageOf(progress, task.id);
      save(restoreTaskDraft(progress, task.id));
      go({ screen: "workbook", ...where, index, ...(page ? { page } : {}) });
      return;
    }
    go({ screen: "workbook", ...where, index });
  };

  const toBuilding = () => go({ screen: "building" });
  const toCorridor = (level: number) => () => go({ screen: "corridor", level, entering: false });

  let body: ReactNode;
  switch (view.screen) {
    case "onboarding":
      body = (
        <VentureOnboarding
          floors={buildingFloors(progress, floors)}
          onStart={() => {
            markVentureTestOnboardingSeen(ventureId);
            toBuilding();
          }}
        />
      );
      break;
    case "building": {
      const cta = buildingCta(progress, floors);
      const level = currentLevel(progress, floors);
      body = (
        <section className="flex flex-1 flex-col">
          <BackCrumb label="Launchpad" onClick={toHome} />
          <Heading>{ventureTitle}</Heading>
          <VentureBuilding
            floors={buildingFloors(progress, floors)}
            label={
              cta.kind === "rooftop"
                ? `${ventureTitle} building. Every floor is done. Tap a floor to look inside.`
                : `${ventureTitle} building. Level ${level} is open. Tap a floor to look inside.`
            }
            // Any floor can be tapped; floors above the current one open as a preview.
            onSelectFloor={(l) => go({ screen: "corridor", level: l, entering: true })}
          />
          <div className="mx-5 -mt-1.5 flex items-center gap-3 pb-4">
            <button
              type="button"
              className={`${BTN_PRIMARY} min-w-0`}
              onClick={() => go(cta.kind === "rooftop" ? { screen: "rooftop" } : { screen: "corridor", level: cta.level, entering: true })}
            >
              {cta.label}
            </button>
            {hasHandbook(progress, floors) && <HandbookButton onClick={() => setHandbook({ ventureId, entry: "building" })} />}
          </div>
        </section>
      );
      break;
    }
    case "rooftop":
      body = <VentureRooftopFinish onLaunchpadHome={toHome} />;
      break;
    case "corridor": {
      const floor = floorAt(floors, view.level);
      const states = silverStates(progress, floors, floor);
      const done = isFloorDone(progress, floor);
      const next = view.level < floors.length ? floorAt(floors, view.level + 1) : null;
      body = (
        <FloorTemplate
          key={`${view.level}-${view.entering}`}
          floorType={floor.floorType}
          level={floor.level}
          floorName={floor.name}
          goal={floor.gold.title}
          entering={view.entering}
          silvers={floor.silvers.map((s, i) => {
            const firstOpen = openTasksInSilver(progress, s, floor.level)[0];
            return {
              id: s.id,
              title: s.title,
              state: states[i] ?? "locked",
              onComeBack: firstOpen ? () => openTask(firstOpen, firstOpen.taskIndex) : undefined,
            };
          })}
          complete={
            done
              ? {
                  nextLevel: next ? next.level : null,
                  onLift: next ? () => go({ screen: "lift", from: floor.level }) : null,
                }
              : undefined
          }
          workbook={
            view.workbookCue && !done
              ? {
                  popIn: view.workbookCue.popIn,
                  onOpen: () =>
                    setHandbook({ ventureId, entry: "building", openSilverId: view.workbookCue!.silverId, level: floor.level }),
                }
              : undefined
          }
          onBack={toBuilding}
          onOpenSilver={(silverId) => go({ screen: "doors", level: floor.level, silverId })}
        />
      );
      break;
    }
    case "doors": {
      const floor = floorAt(floors, view.level);
      const silverIndex = floor.silvers.findIndex((s) => s.id === view.silverId);
      const silver = floor.silvers[silverIndex]!;
      // Pricing keeps Final door titles. Built doors follow progress.
      // A placeholder door stays locked and does not block the next built door.
      const pricing = silver.title === "Pricing";
      const pricingBuilt = pricing && silver.bronzes.some((b) => !b.placeholder);
      const open = (pricing && !pricingBuilt ? false : silverStates(progress, floors, floor)[silverIndex] !== "locked");
      const states = pricing ? pricingBronzeStates(progress, silver, open) : bronzeStates(progress, silver, open);
      body = (
        <BronzeDoors
          level={floor.level}
          silverTitle={silver.title}
          bronzes={silver.bronzes.map((b, i) => ({
            id: b.id,
            title: b.title,
            subtitle: b.subtitle,
            state: states[i] ?? "locked",
            comeBack: open && !b.placeholder && bronzeHasOpenTask(progress, b),
          }))}
          lockedNote={pricing && !pricingBuilt ? "These doors aren't open yet." : lockedDoorsNote(progress, floors, floor, silverIndex)}
          onBuilding={toBuilding}
          onCorridor={toCorridor(floor.level)}
          onOpenBronze={(bronzeId) => {
            const bronze = silver.bronzes.find((b) => b.id === bronzeId);
            if (!bronze) return;
            // No task list: the door opens the first unfinished task (or the first, to review).
            openTask({ level: floor.level, silverId: silver.id, bronzeId }, bronzeEntryTaskIndex(progress, bronze));
          }}
        />
      );
      break;
    }
    case "workbook": {
      const floor = floorAt(floors, view.level);
      const silver = floor.silvers.find((s) => s.id === view.silverId)!;
      const bronze = silver.bronzes.find((b) => b.id === view.bronzeId)!;
      const tasks = bronze.tasks.map((t) => ({
        id: t.id,
        title: t.title,
        done: progress.completedTaskIds.includes(t.id),
        screens: t.screens,
        ctaLabel: t.ctaLabel,
      }));
      const where = { level: floor.level, silverId: silver.id, bronzeId: bronze.id };
      const index = view.index;
      const current = bronze.tasks[index];
      const answers = progress.answers ?? {};
      const pages = current?.paged ? taskPages(current, answers, floors) : null;
      const pageIndex = pages ? Math.min(view.page ?? 0, Math.max(0, pages.length - 1)) : 0;
      const page = pages?.[pageIndex];
      const answered = page ? isPageAnswered(page.screen, answers) : current ? isTaskAnswered(current, answers, floors) : true;
      const goalPages = pages?.filter((p) => p.goal) ?? [];
      const eyebrow = page?.goal
        ? `Goal ${goalPages.indexOf(page) + 1} of ${goalPages.length}`
        : current?.kind === "real-world"
          ? "Real-world task"
          : current && current.screens.some(isIdentityPicker)
            ? silver.title
            : undefined;
      /** Pages of the task before `i` (Previous from a first page lands on its last page). */
      const lastPageOf = (i: number) => {
        const t = bronze.tasks[i];
        return t?.paged ? Math.max(0, taskPages(t, answers, floors).length - 1) : undefined;
      };
      /** Next / Finish (and Skip for now on the optional last goal): saves, then moves on. */
      const forward = (from: VentureTestProgress, withDefaults: boolean) => {
        const task = bronze.tasks[index];
        if (!task) return;
        // A rank order left as shown is saved as the learner's order.
        const fill = withDefaults && page ? pageDefaultAnswer(page.screen, answers) : null;
        let base = fill ? setProgressAnswer(from, fill.answerKey, fill.answer) : from;
        if (pages && pageIndex < pages.length - 1) {
          if (fill) save(base);
          go({ screen: "workbook", ...where, index, page: pageIndex + 1 });
          return;
        }
        base = completeTask(base, task.id);
        const updated = base;
        save(updated);
        const isLast = index === bronze.tasks.length - 1;
        if (!isLast) {
          go({ screen: "workbook", ...where, index: index + 1 });
          return;
        }
        const adv = advanceAfterTask(updated, floor, silver, bronze, index);
        // Finishing the step just now (not re-finishing finished work) goes straight back to the
        // corridor with the workbook button popping in,
        // unless it finished the level: then the corridor shows the level-done Congratulations.
        const justCompleted = !isSilverDone(progress, silver) && isSilverDone(updated, silver);
        const at = { level: floor.level, silverId: silver.id };
        if (adv.kind === "task") go({ screen: "workbook", ...where, index: adv.taskIndex });
        else if (adv.kind === "bronze-done") go({ screen: "doors", ...at });
        else if (justCompleted && !isFloorDone(updated, floor))
          go({ screen: "corridor", level: floor.level, entering: false, workbookCue: { silverId: silver.id, popIn: true } });
        else go({ screen: "corridor", level: floor.level, entering: false });
      };
      // Final J11: the optional last goal reads "Add this goal" (on once something is typed) with "Skip for now".
      const costScreen = current?.screens.find((s) => s.type === "know-your-cost");
      if (costScreen && costScreen.type === "know-your-cost" && current) {
        const taskId = current.id;
        body = (
          <KnowYourCostFlow
            key={`${costScreen.id}:${view.costStep?.name ?? "hub"}:${view.costStep?.name === "service" ? view.costStep.serviceId : ""}`}
            screen={costScreen}
            floors={floors}
            answers={answers}
            levelName={floor.name}
            silverTitle={silver.title}
            businessName={identityAnswerOf(answers, IDENTITY_ANSWER_KEY)?.name?.trim() ?? ""}
            initialStep={view.costStep}
            onBuilding={toBuilding}
            onCorridor={toCorridor(floor.level)}
            onExit={(answer) => {
              save(setProgressAnswer(progress, costScreen.answerKey, answer));
              go({ screen: "doors", level: floor.level, silverId: silver.id });
            }}
            onFinish={(answer) => {
              const updated = completeTask(setProgressAnswer(progress, costScreen.answerKey, answer), taskId);
              save(updated);
              go({ screen: "doors", level: floor.level, silverId: silver.id });
            }}
          />
        );
        break;
      }
      const priceScreen = current?.screens.find((s) => s.type === "set-price");
      if (priceScreen && priceScreen.type === "set-price" && current) {
        const taskId = current.id;
        body = (
          <SetPriceFlow
            screen={priceScreen}
            floors={floors}
            answers={answers}
            onExit={(answer) => {
              save(setProgressAnswer(progress, priceScreen.answerKey, answer));
              go({ screen: "doors", level: floor.level, silverId: silver.id });
            }}
            onFinish={(answer) => {
              const updated = completeTask(setProgressAnswer(progress, priceScreen.answerKey, answer), taskId);
              save(updated);
              go({ screen: "doors", level: floor.level, silverId: silver.id });
            }}
          />
        );
        break;
      }
      const jobsScreen = current?.screens.find((s) => s.type === "jobs-to-cover");
      if (jobsScreen && jobsScreen.type === "jobs-to-cover" && current) {
        const taskId = current.id;
        body = (
          <JobsCoverFlow
            screen={jobsScreen}
            floors={floors}
            answers={answers}
            onExit={() => go({ screen: "doors", level: floor.level, silverId: silver.id })}
            onFinish={(answer) => {
              const updated = completeTask(setProgressAnswer(progress, jobsScreen.answerKey, answer), taskId);
              save(updated);
              go({ screen: "doors", level: floor.level, silverId: silver.id });
              setHandbook({ ventureId, entry: "building", level: floor.level, openSheet: "plan-1" });
            }}
          />
        );
        break;
      }
      const offerScreen = current?.screens.find((s) => s.type === "offer-loop");
      if (offerScreen && offerScreen.type === "offer-loop" && current) {
        const taskId = current.id;
        body = (
          <OfferLoopFlow
            screen={offerScreen}
            floors={floors}
            answers={answers}
            onExit={() => go({ screen: "doors", level: floor.level, silverId: silver.id })}
            onFinish={(answer) => {
              save(completeTask(setProgressAnswer(progress, offerScreen.answerKey, answer), taskId));
              go({ screen: "doors", level: floor.level, silverId: silver.id });
            }}
          />
        );
        break;
      }
      const customerScreen = current?.screens.find((s) => s.type === "customer-check");
      if (customerScreen && customerScreen.type === "customer-check" && current) {
        const taskId = current.id;
        body = (
          <CustomerCheckFlow
            screen={customerScreen}
            answers={answers}
            onExit={() => go({ screen: "doors", level: floor.level, silverId: silver.id })}
            onFinish={(answer) => {
              save(completeTask(setProgressAnswer(progress, customerScreen.answerKey, answer), taskId));
              go({ screen: "doors", level: floor.level, silverId: silver.id });
            }}
          />
        );
        break;
      }
      const competitorScreen = current?.screens.find((s) => s.type === "competitor-check");
      if (competitorScreen && competitorScreen.type === "competitor-check" && current) {
        const taskId = current.id;
        body = (
          <CompetitorFlow
            screen={competitorScreen}
            answers={answers}
            onExit={() => go({ screen: "doors", level: floor.level, silverId: silver.id })}
            onFinish={(answer) => {
              save(completeTask(setProgressAnswer(progress, competitorScreen.answerKey, answer), taskId));
              go({ screen: "doors", level: floor.level, silverId: silver.id });
            }}
          />
        );
        break;
      }
      const fundingScreen = current?.screens.find((s) => s.type === "funding-start");
      if (fundingScreen && fundingScreen.type === "funding-start" && current) {
        const taskId = current.id;
        body = (
          <FundingFlow
            screen={fundingScreen}
            answers={answers}
            onExit={() => go({ screen: "doors", level: floor.level, silverId: silver.id })}
            onGoToCosts={() => {
              const found = findKnowYourCost(floors);
              if (!found) return;
              go({
                screen: "workbook",
                level: found.floor.level,
                silverId: found.silver.id,
                bronzeId: found.bronze.id,
                index: found.taskIndex,
              });
            }}
            onFinish={(answer) => {
              const updated = completeTask(setProgressAnswer(progress, fundingScreen.answerKey, answer), taskId);
              save(updated);
              go({ screen: "corridor", level: floor.level, entering: false });
              setHandbook({ ventureId, entry: "building", level: floor.level, openSilverId: "l2-s2" });
            }}
          />
        );
        break;
      }
      const readyScreen = current?.screens.find((s) => s.type === "getting-ready");
      if (readyScreen && readyScreen.type === "getting-ready" && current) {
        const taskId = current.id;
        body = (
          <GettingReadyFlow
            screen={readyScreen}
            answers={answers}
            floors={floors}
            businessName={handbookBusinessName(progress, floors, tileName(ventureId) ?? ventureTitle)}
            onExit={() => go({ screen: "doors", level: floor.level, silverId: silver.id })}
            onSave={(answer) => save(setProgressAnswer(progress, readyScreen.answerKey, answer))}
            onFinish={(answer) => {
              const updated = completeTask(setProgressAnswer(progress, readyScreen.answerKey, answer), taskId);
              save(updated);
              go({ screen: "doors", level: floor.level, silverId: silver.id });
            }}
          />
        );
        break;
      }
      const lastGoal =
        pages && page && pageIndex === pages.length - 1 && page.screen.type === "short-text" && page.screen.mode === "goal" && page.screen.optional
          ? page.screen
          : null;
      const optionalLastGoal = !!lastGoal;
      const typedSomething = lastGoal
        ? lastGoal.fields.some((f) => f.input === "text" && String(fieldsOf(answers, lastGoal.answerKey)?.values?.[f.name] ?? "").trim() !== "")
        : true;
      body = (
        <TaskWorkbook
          level={floor.level}
          tasks={tasks}
          index={index}
          page={pages && page ? { index: pageIndex, count: pages.length, screen: page.screen } : undefined}
          onBuilding={toBuilding}
          onCorridor={toCorridor(floor.level)}
          // There is no task list, so Exit goes back to the bronze doors.
          onExit={() => go({ screen: "doors", level: floor.level, silverId: silver.id })}
          onJump={(i) => openTask(where, i)}
          onPrevious={() =>
            pages && pageIndex > 0
              ? go({ screen: "workbook", ...where, index, page: pageIndex - 1 })
              : go({ screen: "workbook", ...where, index: Math.max(0, index - 1), page: lastPageOf(Math.max(0, index - 1)) })
          }
          nextDisabled={!answered || !typedSomething}
          nextHint={!typedSomething ? "Add your goal, or skip for now." : page ? pageHint(page) : identityHint(current)}
          eyebrow={eyebrow}
          onComeBackLater={
            current?.canComeBackLater && !progress.completedTaskIds.includes(current.id)
              ? () => {
                  // Partial answers go into the task's draft; the next step unlocks; back to the doors.
                  save(deferTask(progress, current, { page: pageIndex }));
                  go({ screen: "doors", level: floor.level, silverId: silver.id });
                }
              : undefined
          }
          forwardLabel={optionalLastGoal ? "Add this goal" : undefined}
          onSkip={
            lastGoal
              ? () => {
                  // Skip saves nothing: any half-typed answer for this goal is dropped.
                  const rest = { ...(progress.answers ?? {}) };
                  delete rest[lastGoal.answerKey];
                  forward({ ...progress, answers: rest }, false);
                }
              : undefined
          }
          onNext={() => forward(progress, true)}
        />
      );
      break;
    }
    case "lift": {
      const to = floorAt(floors, view.from + 1);
      body = <VentureLift from={view.from} to={to.level} toName={to.name} />;
      break;
    }
  }

  return (
    <VentureTestShell focus={view.screen === "workbook"}>
      <div className="flex min-h-0 flex-1 flex-col bg-white" data-launchpad-source={content.source} data-launchpad-version={content.versionId}>
        <LaunchpadAnswersProvider value={{ iconVentureId, answers: progress.answers ?? {}, setAnswer, floors }}>{body}</LaunchpadAnswersProvider>
        {handbook?.entry === "building" && handbook.ventureId === ventureId && (
          <Handbook
            entry="building"
            businessName={handbookBusinessName(progress, floors, tileName(ventureId) ?? ventureTitle)}
            floors={floors}
            progress={progress}
            iconVentureId={iconVentureId}
            setAnswer={setAnswer}
            onClose={closeHandbook}
            initialSheet={handbook.openSheet}
            onEditCosts={(step) => {
              const found = findKnowYourCost(floors);
              if (!found) return;
              closeHandbook();
              go({
                screen: "workbook",
                level: found.floor.level,
                silverId: found.silver.id,
                bronzeId: found.bronze.id,
                index: found.taskIndex,
                costStep: step,
              });
            }}
            onBackToLift={() => {
              const level = handbook.level ?? currentLevel(progress, floors);
              // Back from the workbook opened on the corridor: the same corridor, button still there (no pop-in).
              const cue = handbook.openSilverId && view.screen === "corridor" && view.workbookCue ? { silverId: view.workbookCue.silverId, popIn: false } : undefined;
              go({ screen: "corridor", level, entering: false, ...(cue ? { workbookCue: cue } : {}) });
            }}
          />
        )}
      </div>
    </VentureTestShell>
  );
}
