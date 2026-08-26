import type { HubIntroId } from "@/lib/dashboard/hub-intro/types";

export type HubIntroCopy = {
  title: string;
  firstVisitBody: string;
  infoPanelBody: string;
  firstVisitDisclaimer?: string;
  firstVisitCta: string;
  infoPanelCta: string;
  infoButtonAriaLabel: string;
};

export const hubIntroCopy: Record<HubIntroId, HubIntroCopy> = {
  academy: {
    title: "Academy",
    firstVisitBody:
      "Learn the essential money skills schools don't teach. Earn daily streaks and keep practising to unlock Silver and Gold status.",
    infoPanelBody:
      "Learn real money skills. Practise daily to unlock Silver and Gold medals.",
    firstVisitCta: "Let's go",
    infoPanelCta: "Got it",
    infoButtonAriaLabel: "About Academy",
  },
  launchpad: {
    title: "Launchpad",
    firstVisitBody:
      "Ready to make your own money? Penny and the team will help you start your very own business and earn cash in as little as half a day of prep. Learning about money never feels boring when you're managing cash you made yourself.",
    infoPanelBody:
      "Start a business, earn real cash, and manage the money you made yourself.",
    firstVisitCta: "Let's go",
    infoPanelCta: "Got it",
    infoButtonAriaLabel: "About Launchpad",
  },
  community: {
    title: "Community",
    firstVisitBody:
      "See where you stand. Climb the leaderboard, invite friends, and take on monthly challenges together. Friendly competition makes the money game way more fun.",
    infoPanelBody:
      "Leaderboard, friends, and monthly challenges. Get on the board.",
    firstVisitCta: "Let's go",
    infoPanelCta: "Got it",
    infoButtonAriaLabel: "About Community",
  },
  vault: {
    title: "Vault",
    firstVisitBody:
      "This is where you practise real money skills. Log the cash you already have, split it into jars, set savings goals, and move it around.",
    infoPanelBody:
      "Log money, split it into jars, set goals, and practise managing what you have.",
    firstVisitDisclaimer:
      "This app does not connect to a bank, and it cannot send or take real payments.",
    firstVisitCta: "Let's go",
    infoPanelCta: "Got it",
    infoButtonAriaLabel: "About Vault",
  },
};
