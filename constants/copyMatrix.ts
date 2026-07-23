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
        birthYearTrack: "Birth Year / Age Track",
      },
      profile: {
        joinDateLabel: "Joined",
      },
      parentMode: {
        label: "Parent Mode",
        shortLabel: "Parent",
        enabledHint: "Parent Hub is unlocked - you can adjust these settings.",
        pinTitle: "Parent PIN Required",
        pinBody:
          "Enter the parent PIN to open Parent Hub. Kids can't change conversion rate, currency, or age track on their own.",
        setupTitle: "Set Parent PIN",
        setupBody:
          "No parent PIN yet. Choose a 4-digit code to secure Parent Hub.",
        setupNewLabel: "New PIN",
        pinPlaceholder: "4-digit PIN",
        setupConfirmLabel: "Confirm new PIN",
        pinError: "Wrong PIN - nice try.",
        setupMismatch: "PINs don't match - try again.",
        pinConfirm: "Unlock Parent Hub",
        setupSave: "Save & Unlock Parent Hub",
        pinCancel: "Cancel",
      },
      parentHub: {
        title: "Parent Hub",
        lockedSubtext: "PIN required for parent-only controls",
        unlockedSubtext: "Conversion rate, currency & age track",
        lockedBadge: "Locked",
        unlockedBadge: "Open",
        unlockButton: "Enter Parent PIN",
        lockHub: "Lock Parent Hub",
        birthYearHint:
          "Update birth year to refresh Academy modules, skills, and lesson tracks.",
      },
      currency: {
        heading: "Display Currency",
        summary:
          "Choose the currency shown across The Vault and XP cash-in. Amounts stay the same - only the symbol and format change.",
        lockedHint: "Unlock Parent Hub to change currency.",
        savedNote: "Currency updated across The Vault.",
      },
      birthYear: {
        pinBody:
          "Enter the parent PIN to update birth year and learning track.",
        modalTitle: "Update Birth Year",
        modalBody:
          "Pick the correct birth year. Academy modules, skills, and lessons will match the new age track.",
        currentTrackLabel: "Current track",
        newTrackLabel: "New track",
        birthYearLabel: "Birth year",
        save: "Save Birth Year",
        cancel: "Cancel",
        savedTitle: "Track Updated",
        savedBodyTemplate:
          "Birth year saved. You are now on the {track} track (ages {range}).",
        savedAcknowledge: "Got it",
        invalidYear: "Pick a valid birth year.",
        unchanged: "That birth year is already saved.",
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
          "When your child cashes in XP from The Vault, converted cash goes straight into their Save Jar at this rate.",
        vaultCashInHint:
          "Open Parent Hub (PIN required) to set the conversion rate. Kids cash in XP from The Vault.",
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
          "Conversion rate has been set to {rate}. Cash out when you are ready!",
        xpAvailableTemplate: "{points} XP available",
        noPointsError: "No XP to cash in yet - keep learning!",
        claimingLabel: "Claiming…",
        childPayoutReadoutTemplate: "You will receive {amount} straight into your Save Jar",
        claimCashReward: "Claim Cash Reward",
        successTitle: "Points Converted!",
        successBodyTemplate:
          "Points Converted! {amount} has been safely deposited straight into your Save Jar. Head over to the Vault to check your growth, or shift your funds to another jar if you have a different plan!",
        successAcknowledge: "Let's Go!",
        parentEmail: {
          draftLabel: "Parent notification",
          title: "Email sent to guardian",
          body: "We sent a heads-up about this XP cash-in. Draft preview below.",
          toLabel: "To:",
          subjectLabel: "Subject:",
          acknowledge: "Got it",
        },
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
            subtitle: "Understanding the Money Game",
            focusAreas:
              "How your daily spending choices shape your freedom and future.",
            iconPath: "/dashboard/money-bag.svg",
          },
          {
            id: "leveling-up-loot",
            number: 2,
            subtitle: "Protecting Your Money",
            focusAreas: "Stop money from quietly slipping away.",
            iconPath: "/dashboard/trend-up.svg",
          },
          {
            id: "interest-multiplier",
            number: 3,
            subtitle: "Commanding Your Cash",
            focusAreas: "Build a system that puts you in control.",
            iconPath: "/dashboard/bank-building.svg",
          },
          {
            id: "goal-crusher",
            number: 4,
            subtitle: "Generating Your Income",
            focusAreas: "Create extra money with skills you have.",
            iconPath: "/dashboard/goal-target.svg",
          },
          {
            id: "scammer-defense",
            number: 5,
            subtitle: "Multiplying Your Wealth",
            focusAreas: "Make your money work for you.",
            iconPath: "/dashboard/shield-check.svg",
          },
          {
            id: "savings-streak",
            number: 6,
            subtitle: "Mastering the System",
            focusAreas: "Unlock how the wealthy stay ahead.",
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
      cashInTileLabel: "Cash In Your Points",
      cashInTileSubtext: "{points} XP ready to convert",
      budget: {
        sectionTitle: "Budget Allocation",
        depositHeading: "Got some money? Add it here!",
        depositButton: "Deposit Income",
        poolLabel: "Money to Allocate",
        poolDisclaimer:
          "This represents real-world money you earned - not real digital payments.",
        currencySettingsNote:
          "Currency can be changed in Settings → Parent Hub.",
        allocatedTemplate: "Allocated: {allocated} / {total}",
        remainingTemplate: "Remaining: {amount}",
        remainingLabel: "Left to allocate",
        fullyAllocatedLabel: "Fully Allocated!",
        lockItIn: "Lock It In",
        move: "Move",
        markAsSpent: "Mark as Spent",
        inJarTemplate: "{amount}",
        fromPoolLabel: "From this deposit",
        addCustomBucket: "Add Bucket",
        renameBucket: "Rename",
        bucketLimitTemplate: "{count} / {max} buckets",
        premiumRenameTitle: "Level Up Your Vault",
        premiumRenameBody:
          "Renaming Save, Spend, and Give is a Premium perk. Freemium keeps the classic trio - upgrade to name them your way.",
        premiumUnlock: "Unlock Premium Tier",
        premiumLater: "Maybe later",
        moveTitle: "Move Money",
        markSpentTitle: "Mark as Spent",
        moveAmountLabel: "Amount to move",
        markSpentAmountLabel: "Amount spent",
        moveDestinationLabel: "Move to",
        moveConfirm: "Move It",
        markSpentConfirm: "Log It",
        moveCancel: "Cancel",
        movePoolOption: "Money to Allocate",
        spentLogTemplate: "Marked {amount} as spent from {bucket}",
        lockedInTemplate: "Locked {amount} into your jars",
        depositLogTemplate: "Deposited {amount} to allocate",
        bucketsOverviewTitle: "Your Buckets",
        allocateHeading: "Split It Up",
        totalBalanceLabel: "Your Money",
        totalBalanceHint: "Total across all buckets",
        futurePotentialLabel: "Future Potential",
      },
      savings: {
        sectionTitle: "Savings",
        addGoal: "Add Savings Goal",
        premiumGoalsPrompt:
          "Create multiple savings goals with Premium - upgrade to unlock!",
        premiumGoalsTitle: "Multiple Savings Goals",
        premiumGoalsBody:
          "Premium lets you set named targets, track progress bars, and allocate straight from your Save Jar. One goal is great - several is founder mode.",
        goalNameLabel: "Goal name",
        goalTargetLabel: "Target amount",
        createGoal: "Create Goal",
        cancel: "Cancel",
        allocateFromSave: "Add from Save Jar",
        assignToGoals: "Assign to Goals",
        increaseGoal: "Increase Goal",
        spendFromGoal: "Spend from Goal",
        moveFromGoal: "Move from Goal",
        goalAllocationHeading: "Split unassigned savings",
        goalRemainingLabel: "Left to assign",
        goalFullyAssignedLabel: "Fully assigned!",
        goalProgressTemplate: "{saved} / {target}",
        goalComplete: "Goal crushed!",
        allocatedToGoalTemplate: "Moved {amount} to {goal}",
        saveJarTitle: "Save Jar",
        saveJarHint: "Unassigned savings - assign to goals or spend here.",
        saveJarReadyLabel: "Ready to assign",
        markSpentFromSave: "Mark as Spent",
        returnToAllocate: "Return to Allocate",
        returnToSaveJar: "Return to Save Jar",
        spentFromSaveTemplate: "Spent {amount} from Save Jar",
        spentFromGoalTemplate: "Spent {amount} from {goal}",
        returnedGoalToSaveTemplate: "Returned {amount} from {goal} to Save Jar",
        returnedSaveToPoolTemplate: "Returned {amount} from Save Jar to allocate",
        defaultGoalHint: "Two starter goals on Freemium — Premium unlocks custom names and more.",
        spendAmountLabel: "Amount",
        spendConfirm: "Log It",
        spendCancel: "Cancel",
        spendFromSaveTitle: "Spend from Save Jar",
        spendFromGoalTitle: "Spend from Goal",
        returnToSaveTitle: "Return to Save Jar",
        returnToPoolTitle: "Return to Allocate",
      },
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
        id: "level-1",
        title: "1. Money Game Rules",
        subtext: "Focus: Mindset, Time, Inflation",
      },
      {
        id: "level-2",
        title: "2. Plugging Leaks",
        subtext: "Focus: Subscriptions, Debt, Cyber Security",
      },
      {
        id: "level-3",
        title: "3. Taking Control",
        subtext: "Focus: Dashboards, Savings, Vaults",
      },
      {
        id: "level-4",
        title: "4. Making Your Own Cash",
        subtext: "Focus: Value, Offers, Trust",
      },
      {
        id: "level-5",
        title: "5. Growing Assets",
        subtext: "Focus: Equities, Property, Leverage",
      },
      {
        id: "level-6",
        title: "6. Mastering the System",
        subtext: "Focus: Tax, Structures, Legacy",
      },
    ],
  },
} as const;

export type DashboardCopyPillar = keyof Pick<
  typeof copyMatrix.dashboard,
  "settings" | "academy" | "engine" | "vault" | "achievements"
>;
