import { PrivacyPolicyLink } from "@/components/legal/privacy-policy-link";
import { WEBSITE_LEGAL_LINKS } from "@/lib/legal/paths";
import { cn } from "@/lib/utils/cn";

const legalLinkClass =
  "font-sans text-base font-semibold text-[#031F82] underline decoration-[#031F82]/40 underline-offset-2 hover:decoration-[#031F82]";

export const APP_FOOTER_DISCLAIMER =
  "NextGenAchievers teaches general money skills. It isn't a financial product and doesn't give financial advice. Coins in the app are virtual.";

export type AppFooterAlign = "start" | "center";

/**
 * Legal links and disclaimer shown across the app. `align="center"` is for the
 * centred pre-app screens (welcome, school welcome and the cohort picker).
 */
export function AppFooter({
  className,
  align = "start",
}: {
  className?: string;
  align?: AppFooterAlign;
}) {
  const centered = align === "center";

  return (
    <footer
      className={cn(
        "border-t border-nga-mist py-4",
        centered ? "text-center" : null,
        className,
      )}
    >
      <nav aria-label="Legal">
        <ul
          className={cn(
            "flex flex-wrap items-center gap-x-4 gap-y-2",
            centered ? "justify-center" : null,
          )}
        >
          <li className="whitespace-nowrap">
            <PrivacyPolicyLink />
          </li>
          {WEBSITE_LEGAL_LINKS.map((link) => (
            <li key={link.href} className="whitespace-nowrap">
              <a href={link.href} className={legalLinkClass}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <p
        className={cn(
          "mt-3 max-w-prose font-sans text-sm font-normal leading-normal text-[#5B6B8C]",
          centered ? "mx-auto" : null,
        )}
      >
        {APP_FOOTER_DISCLAIMER}
      </p>
    </footer>
  );
}
