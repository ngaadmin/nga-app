import Link from "next/link";
import { COHORT_EMOJI } from "@/lib/dashboard/cohort-emoji";
import {
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { PRIVACY_POLICY_PATH } from "@/lib/legal/paths";

type LearnerFamilyAccountProps = {
  username: string;
  cohort: MasteryCohort;
};

/** Open list for a signed-in learner. No cards, no track chip. */
export function LearnerFamilyAccount({ username, cohort }: LearnerFamilyAccountProps) {
  const initial = username.trim().charAt(0).toUpperCase() || "?";
  const track = masteryCohortLabel(cohort);

  return (
    <div>
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          className="grid size-14 shrink-0 place-items-center rounded-full bg-[#DDF2FB] font-heading text-[24px] font-extrabold text-[#031F82]"
          aria-hidden
        >
          {initial}
        </span>
        <div className="min-w-0">
          <p
            className="truncate font-heading text-[22px] font-extrabold leading-[1.2] text-[#031F82]"
            title={username}
            aria-label={username}
          >
            {username}
          </p>
          <p className="mt-0.5 font-sans text-sm font-semibold text-[#5A6A99]">
            Learner account
          </p>
        </div>
      </div>

      <div className="mt-6 flex min-w-0 items-center gap-3.5 border-y border-[#E3EEF6] py-3.5">
        <span
          className="grid w-14 shrink-0 place-items-center text-[30px] leading-none"
          aria-hidden
        >
          {COHORT_EMOJI[cohort]}
        </span>
        <div className="min-w-0">
          <p className="font-sans text-[13px] font-semibold text-[#5A6A99]">Learning track</p>
          <p className="min-w-0 break-normal text-balance font-heading text-[17px] font-extrabold leading-[1.3] text-[#031F82] hyphens-none">
            {track}
            <span className="font-sans text-[15px] font-medium text-[#1E3A5F]">
              {" "}
              · Ages {masteryCohortAgeRangeLabel(cohort)}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-10 flex justify-center">
        <Link
          href={PRIVACY_POLICY_PATH}
          className="inline-flex min-h-11 items-center justify-center px-4 py-3 font-sans text-sm font-semibold text-[#5A6A99] no-underline hover:underline focus-visible:underline"
        >
          🔒 Privacy Policy
        </Link>
      </div>
    </div>
  );
}
