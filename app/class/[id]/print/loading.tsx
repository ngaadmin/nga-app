/** Shown as soon as Print usernames is opened, before the roster returns. */
export default function ClassUsernamesPrintLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-[linear-gradient(180deg,#EEF5FF_0%,#FFFFFF_55%)] px-5" aria-busy="true">
      <span className="sr-only">Opening usernames</span>
      <div className="mt-3 h-8 w-40 animate-pulse rounded-full bg-[#EAF0FF]" />
      <div className="mx-auto mt-4 h-[495px] w-[350px] animate-pulse rounded-[6px] border border-[#E1E8F6] bg-white" />
    </div>
  );
}
