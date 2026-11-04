"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { LaunchpadFloor, LaunchpadTask } from "@/lib/launchpad/content/types";
import type { LaunchpadVentureView } from "@/lib/launchpad/content/venture-view";
import {
  advanceAfterTask,
  applyVentureTestShortcut,
  bronzeStates,
  buildingCta,
  completeTask,
  currentLevel,
  firstOpenTaskIndex,
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
import { BronzeTaskList } from "@/components/launchpad/venture/bronze-task-list";
import { TaskWorkbook } from "@/components/launchpad/venture/task-workbook";
import { VentureUnavailable } from "@/components/launchpad/venture/venture-unavailable";
import { VentureLift } from "@/components/launchpad/venture-test/venture-lift";
import { VentureRooftopFinish } from "@/components/launchpad/venture-test/venture-rooftop-finish";
import { LaunchpadHome, type InProgressVenture } from "@/components/launchpad/venture-test/launchpad-home";
import { Handbook, HandbookButton } from "@/components/launchpad/venture/handbook/handbook";
import { handbookBusinessName, hasHandbook, withShortcutSampleAnswers } from "@/lib/launchpad/venture-test/handbook";
import { LAUNCHPAD_CATEGORIES, liveVentureIds } from "@/lib/launchpad/venture-test/launchpad-home-data";
import { BackCrumb, BTN_ORANGE, Heading } from "@/components/launchpad/venture-test/venture-test-ui";
import { identityChoices, isIdentityPicker, isTaskAnswered } from "@/lib/launchpad/content/identity-content";
import { LaunchpadAnswersProvider } from "@/components/launchpad/venture/identity/answers-context";
import { IdentityWrapUp } from "@/components/launchpad/venture/identity/identity-wrap-up";


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
  | { screen: "corridor"; level: number; entering: boolean }
  | { screen: "doors"; level: number; silverId: string }
  | { screen: "tasks"; level: number; silverId: string; bronzeId: string }
  | { screen: "workbook"; level: number; silverId: string; bronzeId: string; index: number }
  /** The silver's wrap-up screen (e.g. the identity logo), once its bronzes are done. */
  | { screen: "wrap-up"; level: number; silverId: string }
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
    const states = silverStates(p, floors, floor);
    return [
      {
        ventureId: id,
        name: tileName(id) ?? titles[id] ?? id,
        level: floor.level,
        floorName: floor.name,
        done: states.filter((s) => s === "done").length,
        total: floor.silvers.length,
        hasHandbook: hasHandbook(p, floors),
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
  const [handbook, setHandbook] = useState<{ ventureId: string; entry: "home" | "building" } | null>(null);
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
          <LaunchpadHome inProgress={inProgress} onOpenVenture={openVenture} onOpenHandbook={(id) => setHandbook({ ventureId: id, entry: "home" })} />
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
              className={`${BTN_ORANGE} min-w-0 flex-1`}
              onClick={() => go(cta.kind === "rooftop" ? { screen: "rooftop" } : { screen: "corridor", level: cta.level, entering: true })}
            >
              {cta.label}
            </button>
            {hasHandbook(progress, floors) && <HandbookButton onClick={() => setHandbook({ ventureId, entry: "building" })} />}
          </div>
          {handbook?.entry === "building" && handbook.ventureId === ventureId && (
            <Handbook
              entry="building"
              businessName={handbookBusinessName(progress, floors, tileName(ventureId) ?? ventureTitle)}
              floors={floors}
              progress={progress}
              iconVentureId={iconVentureId}
              setAnswer={setAnswer}
              onClose={closeHandbook}
            />
          )}
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
          silvers={floor.silvers.map((s, i) => ({ id: s.id, title: s.title, state: states[i] ?? "locked" }))}
          note={!done && floor.silvers.some((s) => s.placeholder) ? "Plaque titles TBC" : undefined}
          complete={
            done
              ? {
                  nextLabel: next ? `Level ${next.level} · ${next.name}` : null,
                  onLift: next ? () => go({ screen: "lift", from: floor.level }) : null,
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
      const open = silverStates(progress, floors, floor)[silverIndex] !== "locked";
      const states = bronzeStates(progress, silver, open);
      const wrapUp = silver.wrapUp;
      body = (
        <BronzeDoors
          level={floor.level}
          silverTitle={silver.title}
          bronzes={silver.bronzes.map((b, i) => ({ id: b.id, title: b.title, subtitle: b.subtitle, state: states[i] ?? "locked" }))}
          lockedNote={lockedDoorsNote(progress, floors, floor, silverIndex)}
          onBuilding={toBuilding}
          onCorridor={toCorridor(floor.level)}
          onOpenBronze={(bronzeId) => go({ screen: "tasks", level: floor.level, silverId: silver.id, bronzeId })}
          wrapUp={
            wrapUp && isSilverDone(progress, silver)
              ? {
                  label: wrapUp.type === "identity-wrap-up" ? "See your logo" : wrapUp.heading,
                  onOpen: () => go({ screen: "wrap-up", level: floor.level, silverId: silver.id }),
                }
              : undefined
          }
        />
      );
      break;
    }
    case "tasks":
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
      if (view.screen === "tasks") {
        body = (
          <BronzeTaskList
            level={floor.level}
            bronzeTitle={bronze.title}
            tasks={tasks}
            currentIndex={firstOpenTaskIndex(progress, bronze)}
            onBuilding={toBuilding}
            onCorridor={toCorridor(floor.level)}
            onStart={() => go({ screen: "workbook", ...where, index: firstOpenTaskIndex(progress, bronze) })}
          />
        );
      } else {
        const index = view.index;
        const current = bronze.tasks[index];
        const answered = current ? isTaskAnswered(current, progress.answers) : true;
        body = (
          <TaskWorkbook
            level={floor.level}
            tasks={tasks}
            index={index}
            onBuilding={toBuilding}
            onCorridor={toCorridor(floor.level)}
            onExit={() => go({ screen: "tasks", ...where })}
            onJump={(i) => go({ screen: "workbook", ...where, index: i })}
            onPrevious={() => go({ screen: "workbook", ...where, index: Math.max(0, index - 1) })}
            nextDisabled={!answered}
            nextHint={identityHint(current)}
            eyebrow={current && current.screens.some(isIdentityPicker) ? silver.title : undefined}
            onNext={() => {
              const task = bronze.tasks[index];
              if (!task) return;
              const updated = completeTask(progress, task.id);
              save(updated);
              const isLast = index === bronze.tasks.length - 1;
              if (!isLast) {
                go({ screen: "workbook", ...where, index: index + 1 });
                return;
              }
              const adv = advanceAfterTask(updated, floor, silver, bronze, index);
              if (adv.kind === "task") go({ screen: "workbook", ...where, index: adv.taskIndex });
              else if (adv.kind === "bronze-done") go({ screen: "doors", level: floor.level, silverId: silver.id });
              else if (silver.wrapUp) go({ screen: "wrap-up", level: floor.level, silverId: silver.id });
              else go({ screen: "corridor", level: floor.level, entering: false });
            }}
          />
        );
      }
      break;
    }
    case "wrap-up": {
      const floor = floorAt(floors, view.level);
      const silver = floor.silvers.find((s) => s.id === view.silverId)!;
      const wrapUp = silver.wrapUp;
      body = wrapUp ? (
        <IdentityWrapUp
          level={floor.level}
          silverTitle={silver.title}
          wrapUp={wrapUp}
          choices={identityChoices(silver, wrapUp.answerKey, iconVentureId)}
          onBuilding={toBuilding}
          onCorridor={toCorridor(floor.level)}
          onFinalize={toCorridor(floor.level)}
        />
      ) : null;
      break;
    }
    case "lift": {
      const to = floorAt(floors, view.from + 1);
      body = <VentureLift from={view.from} to={to.level} toName={to.name} />;
      break;
    }
  }

  return (
    <VentureTestShell>
      <div className="flex flex-1 flex-col bg-white" data-launchpad-source={content.source} data-launchpad-version={content.versionId}>
        <LaunchpadAnswersProvider value={{ iconVentureId, answers: progress.answers ?? {}, setAnswer }}>{body}</LaunchpadAnswersProvider>
      </div>
    </VentureTestShell>
  );
}
