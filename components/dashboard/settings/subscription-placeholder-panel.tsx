"use client";

import { useRouter } from "next/navigation";
import { copyMatrix } from "@/constants/copyMatrix";
import { cn } from "@/lib/utils/cn";

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

export function SubscriptionPlaceholderPanel() {
  const router = useRouter();
  const copy = copyMatrix.dashboard.settings.subscription;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-6 overflow-x-hidden bg-white px-2 py-4 pb-8">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/settings")}
          className="font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:text-[#031F82]"
        >
          ← {copy.backLabel}
        </button>
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-extrabold text-[#031F82]">
            {copy.title}
          </h1>
          <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
            {copy.description}
          </p>
        </div>
      </div>

      <section
        aria-labelledby="subscription-heading"
        className={cn(floatingPanelClass, "space-y-2 p-4")}
      >
        <h2
          id="subscription-heading"
          className="font-heading text-sm font-extrabold uppercase tracking-wide text-[#031F82]"
        >
          {copy.title}
        </h2>
        <p className="font-sans text-sm leading-relaxed text-[#1E3A5F]">
          {copy.placeholder}
        </p>
      </section>
    </div>
  );
}
