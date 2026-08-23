import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/** Matches the centered "Your Academy Journey" anchor header across all hubs. */
export const dashboardSectionHeadingClass =
  "text-center font-heading text-[18px] font-extrabold text-nga-primary sm:text-[20px]";

type DashboardSectionHeadingProps = {
  children: ReactNode;
  id?: string;
  className?: string;
};

export function DashboardSectionHeading({
  children,
  id,
  className,
}: DashboardSectionHeadingProps) {
  return (
    <h2 id={id} className={cn(dashboardSectionHeadingClass, className)}>
      {children}
    </h2>
  );
}
