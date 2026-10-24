"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  MASTERY_COHORT_ORDER,
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { wipeGuestDeviceProgress } from "@/lib/dev/guest-device-store";
import {
  COHORT_READY_BODY,
  COHORT_READY_ERROR,
  COHORT_READY_HEADING,
  COHORT_READY_RETRY,
  COHORT_READY_SLOW,
  cohortReadyPickedLine,
} from "@/lib/onboarding/cohort-ready-copy";
import { reserveGenericProfileId } from "@/lib/onboarding/generic-profile-id";
import {
  createGuestAccessSession,
  DASHBOARD_ACADEMY_PATH,
  saveGuestAccessSession,
} from "@/lib/onboarding/guest-session";
import { LAYER_CLASS } from "@/lib/ui/layers";
import { recordUsageEvent } from "@/lib/usage/record-usage-event";
import { cn } from "@/lib/utils/cn";

const COHORT_SLOW_MS = 8000;

type PendingCohort = {
  cohort: MasteryCohort;
  slow: boolean;
  error: boolean;
};

const TRACK_AVATAR_SRC: Record<
  MasteryCohort,
  { src: string; width: number; height: number; figureClassName: string }
> = {
  explorer: {
    src: "/assets/illustrations/characters/lars/lars-waving-512.webp",
    width: 191,
    height: 391,
    figureClassName: "h-[80px] min-[721px]:h-[200px]",
  },
  pathfinder: {
    src: "/assets/illustrations/characters/holly/holly-waving-512.webp",
    width: 199,
    height: 391,
    figureClassName: "h-[78px] min-[721px]:h-[194px]",
  },
  maverick: {
    src: "/assets/illustrations/characters/aiden/aiden-waving-512.webp",
    width: 207,
    height: 391,
    figureClassName: "h-[80px] min-[721px]:h-[200px]",
  },
};

const PENNY_AVATAR_SRC =
  "/assets/illustrations/characters/penny/penny-master-512.webp";

export function CohortTrackPicker() {
  const router = useRouter();
  const busyRef = useRef(false);
  const [pending, setPending] = useState<PendingCohort | null>(null);
  const pendingCohort = pending?.cohort ?? null;
  const pendingError = pending?.error ?? false;

  useEffect(() => {
    router.prefetch(DASHBOARD_ACADEMY_PATH);
  }, [router]);

  useEffect(() => {
    if (!pendingCohort || pendingError) return;
    const timer = window.setTimeout(() => {
      setPending((current) =>
        current && current.cohort === pendingCohort && !current.error
          ? { ...current, slow: true }
          : current,
      );
    }, COHORT_SLOW_MS);
    return () => window.clearTimeout(timer);
  }, [pendingCohort, pendingError]);

  function handleSelect(cohort: MasteryCohort) {
    if (busyRef.current) return;
    busyRef.current = true;
    flushSync(() => {
      setPending({ cohort, slow: false, error: false });
    });
    window.setTimeout(() => {
      try {
        const reserved = reserveGenericProfileId();
        const session = createGuestAccessSession({
          username: reserved.username,
          genericProfileId: reserved.id,
          curriculumCohort: cohort,
        });
        wipeGuestDeviceProgress();
        saveGuestAccessSession(session);
        router.push(DASHBOARD_ACADEMY_PATH);
        recordUsageEvent("login");
      } catch {
        busyRef.current = false;
        setPending({ cohort, slow: false, error: true });
      }
    }, 0);
  }

  return (
    <>
    <section
      aria-hidden={pending !== null}
      className="nga-preapp-screen -mx-6 flex min-h-0 w-[calc(100%+3rem)] flex-1 flex-col bg-white px-5 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] min-[721px]:justify-center min-[721px]:pt-[calc(env(safe-area-inset-top,0px)+4.25rem)]"
    >
      <style>{`
        body:has(.nga-preapp-screen) footer {
          margin-top: 36px;
          text-align: center;
        }
      `}</style>
      <div className="mx-auto flex w-full max-w-[960px] flex-col min-[721px]:translate-y-6">
        <div className="flex flex-col items-center text-center">
          <Image
            src={PENNY_AVATAR_SRC}
            alt=""
            width={508}
            height={512}
            className="h-auto w-[72px] object-contain object-center min-[721px]:w-[96px]"
            priority
            unoptimized
          />
          <h1 className="mt-3 font-heading text-[30px] font-bold leading-[1.15] tracking-[-0.01em] text-[#031F82] min-[721px]:text-[40px]">
            Pick the path that matches your age.
          </h1>
        </div>

        <div className="mt-6 flex flex-col gap-3 min-[721px]:mt-8 min-[721px]:grid min-[721px]:grid-cols-3 min-[721px]:gap-6">
          {MASTERY_COHORT_ORDER.map((cohort) => {
            const label = masteryCohortLabel(cohort);
            const ageSupport = `For ages ${masteryCohortAgeRangeLabel(cohort)}`;
            const avatar = TRACK_AVATAR_SRC[cohort];

            return (
              <button
                key={cohort}
                type="button"
                onClick={() => handleSelect(cohort)}
                disabled={pending !== null}
                className="flex min-h-[104px] w-full flex-row items-center gap-[18px] rounded-[16px] border-0 bg-[#FFF8EC] py-3 pl-5 pr-4 text-left shadow-none hover:shadow-[0_0_0_2px_#031F82] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[#031F82] active:shadow-[0_0_0_2px_#031F82] disabled:pointer-events-none min-[721px]:flex-col min-[721px]:items-center min-[721px]:gap-0 min-[721px]:rounded-[20px] min-[721px]:px-5 min-[721px]:pb-[26px] min-[721px]:pt-7 min-[721px]:text-center"
              >
                <span className="flex h-[80px] w-[52px] shrink-0 items-end justify-center min-[721px]:h-[200px] min-[721px]:w-full">
                  <Image
                    src={avatar.src}
                    alt=""
                    width={avatar.width}
                    height={avatar.height}
                    className={`${avatar.figureClassName} w-auto max-w-full object-contain object-bottom`}
                    style={{ width: "auto" }}
                    unoptimized
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col justify-center min-[721px]:mt-[18px] min-[721px]:w-full min-[721px]:items-center">
                  <span className="font-heading text-[20px] font-bold leading-tight tracking-[-0.01em] text-[#031F82] min-[721px]:text-[22px]">
                    {label}
                  </span>
                  <span className="mt-[2px] font-sans text-[15px] font-normal leading-snug text-[#3a4570] min-[721px]:mt-1 min-[721px]:text-[17px]">
                    {ageSupport}
                  </span>
                </span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-6 shrink-0 text-[#031F82] min-[721px]:hidden"
                  aria-hidden
                >
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </button>
            );
          })}
        </div>
      </div>
    </section>
      {pending ? (
        <div
          className={cn(
            "fixed inset-0 flex items-center justify-center bg-white px-6",
            LAYER_CLASS.overlay,
          )}
          role="status"
          aria-live="polite"
          aria-busy={pending.error ? undefined : true}
        >
          <div className="w-full max-w-sm text-center">
            <h2 className="font-heading text-[30px] font-bold leading-tight text-[#031F82]">
              {COHORT_READY_HEADING}
            </h2>
            <p className="mt-3 font-heading text-[22px] font-bold text-[#031F82]">
              {cohortReadyPickedLine(pending.cohort)}
            </p>
            {pending.error ? (
              <>
                <p className="mt-3 font-sans text-base leading-relaxed text-[#3a4570]">
                  {COHORT_READY_ERROR}
                </p>
                <button
                  type="button"
                  onClick={() => handleSelect(pending.cohort)}
                  className="mt-6 inline-flex h-[52px] min-h-[52px] items-center justify-center rounded-[12px] bg-[#FFC93C] px-7 font-heading text-[16px] font-bold text-[#031F82] shadow-[0_2px_0_#d9a12a]"
                >
                  {COHORT_READY_RETRY}
                </button>
              </>
            ) : (
              <>
                <p className="mt-3 font-sans text-base leading-relaxed text-[#3a4570]">
                  {COHORT_READY_BODY}
                </p>
                {pending.slow ? (
                  <p className="mt-2 font-sans text-base leading-relaxed text-[#3a4570]">
                    {COHORT_READY_SLOW}
                  </p>
                ) : null}
                <span
                  className="mx-auto mt-6 block size-8 rounded-full border-4 border-[#D6E4FF] border-t-[#031F82] motion-safe:animate-spin"
                  aria-hidden
                />
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
