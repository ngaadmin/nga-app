export const COPY_USERNAME_TOKEN = "[Username]" as const;

export const copyMatrix = {
  dashboard: {
    greeting: "Hey, [Username]! Let's build wealth.",
    subheading: "Pick your path",
    home: {
      title: "Home",
      description:
        "Your account cockpit — manage settings, parent tools, and point conversion.",
      account: {
        passwordReset: "Password Reset",
        subscriptionStatus: "Account & Subscription Status",
        logOut: "Log Out",
      },
      parentMode: {
        label: "Switch to Parent Mode",
        enabledHint: "Parent mode is on — conversion settings are unlocked.",
      },
      conversion: {
        heading: "Parent Points Conversion Rate",
        rateTemplate: " XP = $1.00 AUD",
        summary:
          "When points are converted by a parent, this cash amount will automatically appear as fresh income to distribute inside the child's Vault.",
        convertNowHeading: "Convert Now",
        convertFullBalance: "Convert Full Points Balance",
        customAmountLabel: "Custom points to convert",
        customAmountPlaceholder: "Enter points",
        payoutReadoutTemplate:
          "This will send {amount} to the child's unallocated income pool",
        sendToVault: "Send to Vault",
        disclaimer:
          "Disclaimer: NextGenAchievers is a financial literacy utility. This platform does not process real-world monetary transactions, bank transfers, or legal cash deposits. All balances represent virtual learning values.",
        confirmTitle: "Virtual Transfer Reminder",
        confirmBody:
          "This action does not move real money. The cash amount displayed is a virtual representation for your child's ledger. You will need to fulfill this payout independently via cash, allowance pocket money, or your preferred banking app.",
        confirmAcknowledge: "Got it",
        cashInHeading: "Cash In Your Points",
        cashInRateHint:
          "Your parent set the conversion rate — cash out when you are ready!",
        childPayoutReadoutTemplate: "You will receive {amount} straight into your Save Jar",
        claimCashReward: "Claim Cash Reward",
        successTitle: "Points Converted!",
        successBodyTemplate:
          "Points Converted! {amount} has been safely deposited straight into your Save Jar. Head over to the Vault to check your growth, or shift your funds to another jar if you have a different plan!",
        successAcknowledge: "Let's Go!",
      },
    },
    academy: {
      title: "The Academy",
      description:
        "Bite-sized learning missions. Master the 24 core financial skills through interactive games.",
      journey: {
        heading: "Your Academy Journey",
        xpLabel: "XP",
        lockedLabel: "Locked",
        nodes: [
          {
            id: "cash-stash",
            number: 1,
            subtitle: "The Cash Stash",
            iconPath: "/dashboard/money-bag.svg",
          },
          {
            id: "leveling-up-loot",
            number: 2,
            subtitle: "Leveling Up Your Loot",
            iconPath: "/dashboard/trend-up.svg",
          },
          {
            id: "interest-multiplier",
            number: 3,
            subtitle: "The Interest Multiplier",
            iconPath: "/dashboard/bank-building.svg",
          },
          {
            id: "goal-crusher",
            number: 4,
            subtitle: "Goal Crusher: Console Quest",
            iconPath: "/dashboard/goal-target.svg",
          },
          {
            id: "scammer-defense",
            number: 5,
            subtitle: "Scammer Defense Shield",
            iconPath: "/dashboard/shield-check.svg",
          },
          {
            id: "savings-streak",
            number: 6,
            subtitle: "Savings Streak Builder",
            iconPath: "/dashboard/piggy-bank.svg",
          },
        ],
      },
    },
    engine: {
      title: "The Engine",
      description:
        "Launch your business. Choose a Venture Pack blueprint and start earning real cash.",
    },
    vault: {
      title: "The Vault",
      description:
        "Your wealth cockpit. Track your assets, revenue, and watch your net worth climb.",
    },
  },
  home: {
    streak: {
      label: "Day Streak",
      unit: "days",
    },
    shield: {
      label: "Banked Streak Freezes",
      activeLabel: "Freezes Active",
    },
    skillTrack: {
      heading: "Skills Unlocked",
      progressLabel: "Progress",
      lockedLabel: "Locked",
    },
    skillNodes: [
      {
        id: "cash-stash",
        title: "1. The Cash Stash",
        subtext: "Learning to split your pocket money.",
      },
      {
        id: "leveling-up-loot",
        title: "2. Leveling Up Your Loot",
        subtext: "Fun ways to earn extra cash side-hustling.",
      },
      {
        id: "interest-multiplier",
        title: "3. The Interest Multiplier",
        subtext: "Getting free money from the bank.",
      },
      {
        id: "goal-crusher",
        title: "4. Goal Crusher: Console Quest",
        subtext: "Saving up for your dream gear.",
      },
      {
        id: "scammer-defense",
        title: "5. Scammer Defense Shield",
        subtext: "Spotting fake sites and in-app traps.",
      },
    ],
  },
} as const;

export type DashboardCopyPillar = keyof Pick<
  typeof copyMatrix.dashboard,
  "home" | "academy" | "engine" | "vault"
>;
