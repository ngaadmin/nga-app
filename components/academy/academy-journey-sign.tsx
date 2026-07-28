import { cn } from "@/lib/utils/cn";

type AcademyJourneySignProps = {
  /** Which side of the anchor the sign sits on (keeps copy on-screen). */
  side: "left" | "right";
  className?: string;
};

export function AcademyJourneyDirectionSign({
  side,
  className,
}: AcademyJourneySignProps) {
  return (
    <div
      className={cn(
        "pointer-events-none flex w-[5.25rem] flex-col items-center",
        side === "left" ? "items-end" : "items-start",
        className,
      )}
      aria-hidden
    >
      <div
        className={cn(
          "relative rounded-lg border-2 border-[#C88202] bg-[#FFA503] px-2 py-1 shadow-md",
          side === "left" ? "-rotate-6" : "rotate-6",
        )}
      >
        <p className="whitespace-nowrap font-heading text-xs font-extrabold uppercase leading-tight tracking-wide text-[#031F82] sm:text-sm">
          Start Here
        </p>
        <span
          className={cn(
            "absolute top-1/2 size-0 -translate-y-1/2 border-y-[6px] border-y-transparent",
            side === "left"
              ? "-right-[7px] border-l-[8px] border-l-[#C88202]"
              : "-left-[7px] border-r-[8px] border-r-[#C88202]",
          )}
        />
      </div>
    </div>
  );
}
