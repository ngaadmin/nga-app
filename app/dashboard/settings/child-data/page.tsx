import { Suspense } from "react";
import { ParentChildPage } from "@/components/privacy/parent-child-page";

export const dynamic = "force-dynamic";

export default function ChildDataPage() {
  return (
    <Suspense fallback={<p className="px-2 py-6 font-sans text-sm text-[#1E3A5F]">Loading…</p>}>
      <ParentChildPage />
    </Suspense>
  );
}
