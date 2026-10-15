import Link from "next/link";
import { PRIVACY_POLICY_PATH } from "@/lib/legal/paths";
import { cn } from "@/lib/utils/cn";

export function PrivacyPolicyLink({ className }: { className?: string }) {
  return (
    <Link
      href={PRIVACY_POLICY_PATH}
      className={cn(
        "font-sans text-base font-semibold text-[#031F82] underline decoration-[#031F82]/40 underline-offset-2 hover:decoration-[#031F82]",
        className,
      )}
    >
      Privacy Policy
    </Link>
  );
}
