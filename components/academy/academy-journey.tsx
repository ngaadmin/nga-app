import { AcademyMomentumHeader } from "@/components/academy/academy-momentum-header";
import { AcademySkillTrack } from "@/components/academy/academy-skill-track";
import { ACADEMY_JOURNEY_PLACEHOLDER_STATE } from "@/lib/dashboard/academy-state";

export function AcademyJourney() {
  const { dayStreak, xp, nodes } = ACADEMY_JOURNEY_PLACEHOLDER_STATE;

  return (
    <section
      aria-label="Academy journey"
      className="mx-auto flex min-h-0 w-full flex-1 flex-col bg-white"
    >
      <AcademyMomentumHeader dayStreak={dayStreak} xp={xp} />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <AcademySkillTrack nodes={nodes} />
      </div>
    </section>
  );
}
