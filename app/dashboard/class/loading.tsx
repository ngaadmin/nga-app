import { NextGenAchieversWordmark } from "@/components/brand/nextgen-achievers-wordmark";

/** Shown the moment Class is opened, before the roster request returns. */
export default function ClassPageLoading() {
  return (
    <div
      className="mx-auto flex w-full max-w-lg flex-col gap-6"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Opening class</span>
      <div className="flex justify-center">
        <NextGenAchieversWordmark />
      </div>
      <div className="h-28 animate-pulse rounded-nga-lg bg-nga-mist" />
      <div className="h-5 w-2/3 animate-pulse rounded-full bg-nga-mist" />
      <div className="h-24 animate-pulse rounded-nga-lg bg-nga-mist" />
      <div className="h-12 animate-pulse rounded-nga-lg bg-nga-mist" />
      <div className="h-12 animate-pulse rounded-nga-lg bg-nga-mist" />
    </div>
  );
}
