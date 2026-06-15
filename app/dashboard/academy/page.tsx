import type { Metadata } from "next";
import { AcademyJourneyContainer } from "@/components/academy/academy-journey-container";
import { copyMatrix } from "@/constants/copyMatrix";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.academy.title,
  description: copyMatrix.dashboard.academy.description,
};

export default function AcademyPage() {
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col bg-white">
      <AcademyJourneyContainer />
    </div>
  );
}
