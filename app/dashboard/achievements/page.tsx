import type { Metadata } from "next";
import { DashboardSectionHeading } from "@/components/dashboard/dashboard-section-heading";
import { copyMatrix } from "@/constants/copyMatrix";

export const metadata: Metadata = {
  title: copyMatrix.dashboard.achievements.title,
  description: copyMatrix.dashboard.achievements.description,
};

export default function AchievementsPage() {
  const copy = copyMatrix.dashboard.achievements;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col overflow-x-hidden bg-white px-2 py-6">
      <DashboardSectionHeading className="mb-4">{copy.title}</DashboardSectionHeading>

      <section
        aria-label="Achievements coming soon"
        className="flex flex-1 flex-col items-center justify-center rounded-2xl border-0 bg-white p-8 text-center shadow-md"
      >
        <span className="text-4xl" aria-hidden>
          🏆
        </span>
        <h2 className="mt-4 font-heading text-lg font-extrabold text-[#031F82]">
          Badge cabinet loading
        </h2>
        <p className="mt-3 max-w-xs font-sans text-sm leading-relaxed text-[#1E3A5F]/80">
          {copy.description}
        </p>
        <p className="mt-4 font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
          Coming soon
        </p>
      </section>
    </div>
  );
}
