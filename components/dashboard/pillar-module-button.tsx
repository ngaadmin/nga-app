import Link from "next/link";
import type { DashboardCopyPillar } from "@/constants/copyMatrix";
import { copyMatrix } from "@/constants/copyMatrix";
import type { DashboardNavItem } from "@/lib/dashboard/navigation";

export type PillarModuleConfig = {
  pillar: DashboardCopyPillar;
  href: DashboardNavItem["href"];
  letter: string;
};

type PillarModuleButtonProps = {
  module: PillarModuleConfig;
};

export function PillarModuleButton({ module }: PillarModuleButtonProps) {
  const copy = copyMatrix.dashboard[module.pillar];

  return (
    <Link
      href={module.href}
      className="group flex flex-col items-center focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-nga-secondary"
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full border-b-4 border-b-[#C88202] bg-[#FFA503] font-heading text-xl font-bold text-white transition-all duration-75 group-active:translate-y-[2px] group-active:border-b-0 sm:h-24 sm:w-24 sm:text-3xl"
        aria-hidden
      >
        {module.letter}
      </div>

      <h2 className="mb-1 mt-2 text-center font-heading text-xs font-bold text-[#031F82] sm:text-xl">
        {copy.title}
      </h2>

      <p className="hidden max-w-[240px] text-center font-sans text-sm font-normal text-gray-600 md:block">
        {copy.description}
      </p>
    </Link>
  );
}
