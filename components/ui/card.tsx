import { cn } from "@/lib/utils/cn";
import type { HTMLAttributes } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-nga-xl bg-nga-surface p-6 shadow-nga-card sm:p-8",
        className,
      )}
      {...props}
    />
  );
}
