import type { Metadata } from "next";
import { AcademyJourney } from "@/components/academy/academy-journey";
import { copyMatrix } from "@/constants/copyMatrix";
import { ACADEMY_PHASE_1_MILESTONES } from "@/lib/dashboard/academy-state";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.academy.title,
  description: copyMatrix.dashboard.academy.description,
};

export default function AcademyPage() {
  return (
    <div className="mx-auto min-h-0 w-full max-w-md flex-1 overflow-x-hidden bg-white">
      <AcademyJourney milestones={ACADEMY_PHASE_1_MILESTONES} />
    </div>
  );
}
