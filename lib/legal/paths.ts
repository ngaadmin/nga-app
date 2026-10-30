/** Public in-app privacy policy. Guests and signed-in users can open it. */
export const PRIVACY_POLICY_PATH = "/privacy" as const;

/** Legal pages that live on the website, not in the app. */
export const WEBSITE_LEGAL_LINKS = [
  { label: "Terms", href: "https://nextgenachievers.com/terms" },
  { label: "Privacy for kids", href: "https://nextgenachievers.com/privacy/kids" },
  { label: "Disclaimer", href: "https://nextgenachievers.com/disclaimer" },
  {
    label: "Child safety",
    href: "https://nextgenachievers.com/child-safety-privacy",
  },
  { label: "Accessibility", href: "https://nextgenachievers.com/accessibility" },
] as const;
