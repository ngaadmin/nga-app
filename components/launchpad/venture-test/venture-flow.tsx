"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { VENTURE_TEST_FLOORS, getVentureTestFloor } from "@/lib/launchpad/venture-test/venture-test-structure";
import {
  advanceAfterTask,
  bronzeStates,
  completeTask,
  currentLevel,
  firstOpenTaskIndex,
  floorState,
  isFloorDone,
  silverStates,
  type VentureTestProgress,
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
import { VentureCorridor } from "@/components/launchpad/venture-test/venture-corridor";
import { VentureDoors } from "@/components/launchpad/venture-test/venture-doors";
import { VentureTaskList } from "@/components/launchpad/venture-test/venture-tasks";
import { VentureWorkbook } from "@/components/launchpad/venture-test/venture-workbook";
import { VentureLift } from "@/components/launchpad/venture-test/venture-lift";
import { LaunchpadHome, type InProgressVenture } from "@/components/launchpad/venture-test/launchpad-home";
import { LAUNCHPAD_CATEGORIES, liveVentureIds } from "@/lib/launchpad/venture-test/launchpad-home-data";
import { BackCrumb, BTN_ORANGE, Heading } from "@/components/launchpad/venture-test/venture-test-ui";

type View =
  | { screen: "home" }
  | { screen: "onboarding" }
  | { screen: "building" }
  | { screen: "corridor"; level: number; entering: boolean }
  | { screen: "doors"; level: number; silverId: string }
  | { screen: "tasks"; level: number; silverId: string; bronzeId: string }
  | { screen: "workbook"; level: number; silverId: string; bronzeId: string; index: number }
  | { screen: "lift"; from: number };

/** Doors close, the indicator moves, then the next corridor opens. */
const LIFT_MS = 2400;

function buildingFloors(progress: VentureTestProgress): BuildingFloorView[] {
  return VENTURE_TEST_FLOORS.map((f) => ({
    level: f.level,
    name: f.name,
    windows: f.silvers.length,
    state: floorState(progress, f.level),
  }));
}

/** Display name on the landing page tile (for the In Progress card). */
function tileName(ventureId: string): string | null {
  for (const c of LAUNCHPAD_CATEGORIES)
    for (const t of c.tiles) if (t.kind === "idea" && t.ventureId === ventureId) return t.name;
  return null;
}

/** Ventures underway in this browser: intro seen or any task done. */
function loadInProgress(ids: string[], titles: Record<string, string>): InProgressVenture[] {
  return ids.flatMap((id) => {
    const p = loadVentureTestProgress(id);
    if (!hasSeenVentureTestOnboarding(id) && p.completedTaskIds.length === 0) return [];
    const floor = getVentureTestFloor(currentLevel(p));
    const states = silverStates(p, floor);
    return [
      {
        ventureId: id,
        name: tileName(id) ?? titles[id] ?? id,
        level: floor.level,
        floorName: floor.name,
        done: states.filter((s) => s === "done").length,
        total: floor.silvers.length,
      },
    ];
  });
}

/**
 * TEST-ONLY Launchpad flow. The landing page is the Business Ideas carousel;
 * tapping a live tile opens that venture. The building intro shows only the
 * first time a venture is opened, then the learner lands on its building.
 * `?venture=<id>` deep-links straight into a venture (test convenience).
 */
export function VentureFlow({
  initialVentureId,
  ventureTitles,
  reset,
}: {
  initialVentureId: string | null;
  ventureTitles: Record<string, string>;
  reset: boolean;
}) {
  const [ventureId, setVentureId] = useState<string | null>(initialVentureId);
  const [progress, setProgress] = useState<VentureTestProgress | null>(null);
  const [inProgress, setInProgress] = useState<InProgressVenture[] | null>(null);
  const [view, setView] = useState<View>({ screen: "home" });
  const ventureTitle = ventureId ? (ventureTitles[ventureId] ?? ventureId) : "";

  const go = useCallback((next: View) => {
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
    setInProgress(loadInProgress(liveVentureIds(), ventureTitles));
    go({ screen: "home" });
  }, [go, ventureTitles]);

  useEffect(() => {
    if (reset) {
      for (const id of new Set([...liveVentureIds(), ...(initialVentureId ? [initialVentureId] : [])])) clearVentureTestProgress(id);
    }
    setInProgress(loadInProgress(liveVentureIds(), ventureTitles));
    if (initialVentureId) openVenture(initialVentureId);
    // Run once per load; reset and the deep link come from the URL.
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
        {inProgress ? <LaunchpadHome inProgress={inProgress} onOpenVenture={openVenture} /> : null}
      </VentureTestShell>
    );
  }

  if (!progress || !ventureId) {
    // White frame while the local progress stub loads.
    return <VentureTestShell>{null}</VentureTestShell>;
  }

  const save = (next: VentureTestProgress) => {
    setProgress(next);
    saveVentureTestProgress(ventureId, next);
  };

  const toBuilding = () => go({ screen: "building" });
  const toCorridor = (level: number) => () => go({ screen: "corridor", level, entering: false });

  let body: ReactNode;
  switch (view.screen) {
    case "onboarding":
      body = (
        <VentureOnboarding
          floors={buildingFloors(progress)}
          onStart={() => {
            markVentureTestOnboardingSeen(ventureId);
            toBuilding();
          }}
        />
      );
      break;
    case "building": {
      const level = currentLevel(progress);
      const allDone = isFloorDone(progress, getVentureTestFloor(VENTURE_TEST_FLOORS.length));
      body = (
        <section className="flex flex-1 flex-col">
          <BackCrumb label="Launchpad" onClick={toHome} />
          <Heading>{ventureTitle}</Heading>
          <VentureBuilding
            floors={buildingFloors(progress)}
            label={`${ventureTitle} building. Level ${level} is open.`}
          />
          <div className="mx-5 -mt-1.5 pb-4">
            <button type="button" className={`${BTN_ORANGE} w-full`} onClick={() => go({ screen: "corridor", level, entering: true })}>
              {allDone ? `Revisit Level ${level}` : `Enter Level ${level}`}
            </button>
          </div>
        </section>
      );
      break;
    }
    case "corridor": {
      const floor = getVentureTestFloor(view.level);
      const states = silverStates(progress, floor);
      const done = isFloorDone(progress, floor);
      const next = view.level < VENTURE_TEST_FLOORS.length ? getVentureTestFloor(view.level + 1) : null;
      body = (
        <VentureCorridor
          key={`${view.level}-${view.entering}`}
          level={floor.level}
          floorName={floor.name}
          goal={floor.goal}
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
      const floor = getVentureTestFloor(view.level);
      const silverIndex = floor.silvers.findIndex((s) => s.id === view.silverId);
      const silver = floor.silvers[silverIndex]!;
      const open = silverStates(progress, floor)[silverIndex] !== "locked";
      const states = bronzeStates(progress, silver, open);
      const prevTitle = floor.silvers[silverIndex - 1]?.title;
      body = (
        <VentureDoors
          level={floor.level}
          silverTitle={silver.title}
          bronzes={silver.bronzes.map((b, i) => ({ id: b.id, title: b.title, subtitle: b.subtitle, state: states[i] ?? "locked" }))}
          lockedNote={
            open ? undefined : prevTitle ? `Finish "${prevTitle}" to unlock these doors.` : `Finish Level ${floor.level - 1} to unlock these doors.`
          }
          onBuilding={toBuilding}
          onCorridor={toCorridor(floor.level)}
          onOpenBronze={(bronzeId) => go({ screen: "tasks", level: floor.level, silverId: silver.id, bronzeId })}
        />
      );
      break;
    }
    case "tasks":
    case "workbook": {
      const floor = getVentureTestFloor(view.level);
      const silver = floor.silvers.find((s) => s.id === view.silverId)!;
      const bronze = silver.bronzes.find((b) => b.id === view.bronzeId)!;
      const tasks = bronze.tasks.map((t) => ({ id: t.id, title: t.title, done: progress.completedTaskIds.includes(t.id) }));
      const where = { level: floor.level, silverId: silver.id, bronzeId: bronze.id };
      if (view.screen === "tasks") {
        body = (
          <VentureTaskList
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
        body = (
          <VentureWorkbook
            level={floor.level}
            tasks={tasks}
            index={index}
            onBuilding={toBuilding}
            onCorridor={toCorridor(floor.level)}
            onExit={() => go({ screen: "tasks", ...where })}
            onJump={(i) => go({ screen: "workbook", ...where, index: i })}
            onPrevious={() => go({ screen: "workbook", ...where, index: Math.max(0, index - 1) })}
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
              else go({ screen: "corridor", level: floor.level, entering: false });
            }}
          />
        );
      }
      break;
    }
    case "lift": {
      const to = getVentureTestFloor(view.from + 1);
      body = <VentureLift from={view.from} to={to.level} toName={to.name} />;
      break;
    }
  }

  return (
    <VentureTestShell>
      {body}
    </VentureTestShell>
  );
}
