"use client";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ reset }: DashboardErrorProps) {
  return (
    <section className="mx-auto flex w-full max-w-md flex-col items-center px-2 py-10 text-center">
      <h1 className="font-heading text-xl font-extrabold text-[#031F82]">
        This page tripped
      </h1>
      <p className="mt-2 max-w-xs font-sans text-sm font-semibold leading-relaxed text-[#1E3A5F]">
        Your progress is still here. Give it another go.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 inline-flex h-touch min-h-touch items-center justify-center rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] px-6 font-heading text-sm font-bold text-[#031F82]"
      >
        Try again
      </button>
    </section>
  );
}
