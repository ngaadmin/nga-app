export const COPY_USERNAME_TOKEN = "[Username]" as const;

export const copyMatrix = {
  dashboard: {
    greeting: "Hey, [Username]! Let's build wealth.",
    subheading: "Pick your path",
    settings: {
      title: "Settings",
      description:
        "Your account cockpit - manage settings, parent tools, and point conversion.",
      account: {
        passwordReset: "Password Reset",
        changeParentPin: "Change Parent PIN",
        subscriptionStatus: "Account & Subscription Status",
        logOut: "Log Out",
      },
      profile: {
        joinDateLabel: "Joined",
      },
      parentMode: {
        label: "Parent Mode",
        shortLabel: "Parent",
        enabledHint: "Parent mode is on - conversion settings are unlocked.",
        pinTitle: "Parent PIN Required",
        pinBody:
          "Enter the parent PIN to unlock conversion controls. Kids can't flip this on their own.",
        setupTitle: "Set Parent PIN",
        setupBody:
          "No parent PIN yet. Choose a 4-digit code to secure conversion controls.",
        setupNewLabel: "New PIN",
        pinPlaceholder: "4-digit PIN",
        setupConfirmLabel: "Confirm new PIN",
        pinError: "Wrong PIN - nice try.",
        setupMismatch: "PINs don't match - try again.",
        pinConfirm: "Unlock Parent Mode",
        setupSave: "Save & Unlock Parent Mode",
        pinCancel: "Cancel",
      },
      changePin: {
        title: "Change Parent PIN",
        body: "Verify your current PIN, then set a new 4-digit parent code.",
        currentLabel: "Current PIN",
        newLabel: "New PIN",
        confirmLabel: "Confirm new PIN",
        currentError: "Current PIN doesn't match.",
        newInvalid: "New PIN must be exactly 4 digits.",
        mismatch: "New PINs don't match - try again.",
        sameAsOld: "Pick a different PIN than your current one.",
        forgotPin: "Forgot PIN?",
        forgotPinSending: "Sending recovery code…",
        forgotPinSuccess:
          "Recovery code {code} sent to {email}. Use it as your current PIN, then set a new one.",
        save: "Save New PIN",
        cancel: "Cancel",
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
          "Your parent set the conversion rate - cash out when you are ready!",
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
    achievements: {
      title: "Achievements",
      description:
        "Your badge cabinet - track Bronze, Silver, and Gold breakthroughs across Academy and Engine.",
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
  "settings" | "academy" | "engine" | "vault" | "achievements"
>;
