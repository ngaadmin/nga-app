import { PrivacyPolicyLink } from "@/components/legal/privacy-policy-link";
import { cn } from "@/lib/utils/cn";

export function AppFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t border-nga-mist py-4", className)}>
      <PrivacyPolicyLink />
    </footer>
  );
}
