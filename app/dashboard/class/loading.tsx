/** Shown the moment Class is opened, before the roster request returns. */
export default function ClassPageLoading() {
  return (
    <div
      className="-mx-4 -mt-6 flex-1 bg-[linear-gradient(180deg,#EEF5FF_0%,#FFFFFF_55%)] px-5 sm:-mx-6"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Opening class</span>
      <div className="mx-auto w-full max-w-[720px]">
        <div className="mt-2 h-8 w-56 animate-pulse rounded-full bg-[#EAF0FF]" />
        <div className="mt-2 h-5 w-48 animate-pulse rounded-full bg-[#E1E8F6]" />
        <div className="mt-5 h-20 animate-pulse border-y border-[#E1E8F6] bg-[#EAF0FF]/40" />
        <div className="h-[60px] animate-pulse border-b border-[#E1E8F6]" />
        <div className="h-[60px] animate-pulse border-b border-[#E1E8F6]" />
        <div className="mt-2 h-[60px] animate-pulse" />
      </div>
    </div>
  );
}
