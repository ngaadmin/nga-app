"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { CashInPointsPanel } from "@/components/dashboard/points/cash-in-points-panel";
import type { PointsConvertedPayload } from "@/components/dashboard/points/cash-in-points-panel";
import {
  VaultBudgetHub,
} from "@/components/dashboard/vault/vault-budget-hub";
import { VaultCollapsible } from "@/components/dashboard/vault/vault-visuals";
import {
  CoinRainOverlay,
  COIN_RAIN_DURATION_MS,
  spawnRainCoins,
  type RainCoin,
} from "@/components/dashboard/vault/vault-coin-rain";
import {
  ConfettiRainOverlay,
  CONFETTI_RAIN_DURATION_MS,
  SavingsGoalAchievedCallout,
  spawnConfettiPieces,
  type ConfettiPiece,
} from "@/components/dashboard/vault/vault-confetti-rain";
import { ModalShell } from "@/components/ui/modal-shell";
import { copyMatrix } from "@/constants/copyMatrix";
import { useCurrency } from "@/lib/dashboard/currency-context";
import {
  SAVINGS_JAR_ID,
  roundAudAmount,
  type DestinationJar,
} from "@/lib/dashboard/destination-jars";
import {
  defaultCustomBucket,
  isCustomBucketId,
  isSavingsGoalMoveTarget,
  sumAllocations,
  sumVaultWealthBalance,
  type CustomVaultBucketPersisted,
  type VaultBucketId,
} from "@/lib/dashboard/vault-buckets";
import {
  buildHighRoiWarningCopy,
  resolveFinnAddressName,
} from "@/lib/dashboard/resolve-finn-address-name";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { useMasteryCohort } from "@/lib/dashboard/use-user-session";
import {
  defaultSavingsGoal,
  computeTotalSavings,
  ensureFreemiumStarterGoals,
  findGoalsJustHitTarget,
  resolveVaultSavingsGoals,
  type SavingsGoal,
  type SavingsGoalId,
} from "@/lib/dashboard/savings-goals";
import {
  DEFAULT_SPENDING_CATEGORY_IDS,
  defaultCustomSpendingCategory,
  resolveSpendingCategories,
  type DefaultSpendingCategoryId,
  type SpendingCategoryId,
} from "@/lib/dashboard/spending-categories";
import {
  getVaultCompoundingDefaults,
  resolveCompoundingLimits,
  resolveFutureSavingsPotential,
} from "@/lib/dashboard/vault-compounding-defaults";
import {
  resolveVaultTransferLocationLabel,
  type VaultTransferLocationId,
} from "@/lib/dashboard/vault-transfer";
import { cn } from "@/lib/utils/cn";

type LedgerFlow = "in" | "out";

type LedgerEntry = {
  id: string;
  message: string;
  highlight?: boolean;
  timestamp: number;
  amount?: number;
  flow?: LedgerFlow;
};

const HIGH_ROI_WARNING_THRESHOLD = 12;

/** Premium billing is not wired yet — Vault defaults to freemium limits. */
const VAULT_IS_PREMIUM = false;

function defaultSpendingCategoryLabels(): Record<DefaultSpendingCategoryId, string> {
  const labels = copyMatrix.dashboard.vault.budget.defaultCategories;
  return {
    "food-snacks": labels.foodSnacks,
    "fun-entertainment": labels.funEntertainment,
    "personal-items": labels.personalItems,
    gifts: labels.gifts,
    other: labels.other,
  };
}

function isDefaultSpendingCategoryId(id: SpendingCategoryId): id is DefaultSpendingCategoryId {
  return (DEFAULT_SPENDING_CATEGORY_IDS as readonly string[]).includes(id);
}

function formatLedgerDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function projectCompoundSavings(
  principal: number,
  weeklyTopUp: number,
  years: number,
  annualRoiPercent: number,
): number {
  const safePrincipal = Math.max(0, principal);
  const safeWeeklyTopUp = Math.max(0, weeklyTopUp);
  const safeYears = Math.max(0, years);
  const annualRate = Math.max(0, annualRoiPercent) / 100;
  const weeklyRate = annualRate / 52;
  const totalWeeks = Math.round(safeYears * 52);

  let balance = safePrincipal;
  for (let week = 0; week < totalWeeks; week += 1) {
    balance = balance * (1 + weeklyRate) + safeWeeklyTopUp;
  }

  return Math.round(balance);
}

function createLedgerId(): string {
  return `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function adjustBucketBalance(
  bucketId: VaultBucketId,
  delta: number,
  setJars: (
    updater: DestinationJar[] | ((current: DestinationJar[]) => DestinationJar[]),
  ) => void,
  setCustomBuckets: (
    updater:
      | CustomVaultBucketPersisted[]
      | ((current: CustomVaultBucketPersisted[]) => CustomVaultBucketPersisted[]),
  ) => void,
) {
  if (isCustomBucketId(bucketId)) {
    setCustomBuckets((current) =>
      current.map((bucket) =>
        bucket.id === bucketId
          ? { ...bucket, balance: roundAudAmount(bucket.balance + delta) }
          : bucket,
      ),
    );
    return;
  }

  setJars((current) =>
    current.map((jar) =>
      jar.id === bucketId
        ? { ...jar, balance: roundAudAmount(jar.balance + delta) }
        : jar,
    ),
  );
}

type CompoundingCalculatorPanelProps = {
  savingsBalance: number;
  projectedTotal: number;
  isPremium: boolean;
  yearsSaved: number;
  yearsSavedMax: number;
  weeklyTopUp: number;
  weeklyTopUpMax: number;
  expectedRoi: number;
  highRoiWarningCopy: string;
  onYearsSavedChange: (value: number) => void;
  onWeeklyTopUpChange: (value: number) => void;
  onExpectedRoiChange: (value: number) => void;
};

function PremiumCompoundingLimitsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const copy = copyMatrix.dashboard.vault.budget;
  const orangeCtaClass =
    "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82]";

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="premium-compounding-title"
      backdropClassName="bg-[#031F82]/45"
      panelClassName="max-w-sm rounded-nga-xl bg-white p-5"
    >
      <h2
        id="premium-compounding-title"
        className="font-heading text-lg font-extrabold text-[#031F82]"
      >
        {copy.premiumCompoundingTitle}
      </h2>
      <p className="mt-2 text-sm text-[#1E3A5F]">{copy.premiumCompoundingBody}</p>
      <button type="button" className={cn("mt-4 h-touch w-full px-4", orangeCtaClass)}>
        {copy.premiumUnlock}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full py-2 text-sm font-bold text-[#0CC1E0]"
      >
        {copy.premiumLater}
      </button>
    </ModalShell>
  );
}

function CompoundingCalculatorPanel({
  savingsBalance,
  projectedTotal,
  isPremium,
  yearsSaved,
  yearsSavedMax,
  weeklyTopUp,
  weeklyTopUpMax,
  expectedRoi,
  highRoiWarningCopy,
  onYearsSavedChange,
  onWeeklyTopUpChange,
  onExpectedRoiChange,
}: CompoundingCalculatorPanelProps) {
  const { formatMoney } = useCurrency();
  const budgetCopy = copyMatrix.dashboard.vault.budget;
  const showHighRoiWarning = expectedRoi >= HIGH_ROI_WARNING_THRESHOLD;
  const [premiumLimitsOpen, setPremiumLimitsOpen] = useState(false);

  return (
    <>
    <div
      id="compounding-calculator-panel"
      className="space-y-3 rounded-xl bg-[#F7FBFF]/80 p-3"
      role="region"
      aria-label="Compounding calculator"
    >
      <p className="font-sans text-xs text-[#1E3A5F]">
        Projected: <span className="font-semibold text-[#031F82]">{formatMoney(projectedTotal)}</span>
      </p>

      <div className="block">
        <span className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82]">
          {budgetCopy.currentSavingsLabel}
        </span>
        <p
          className="mt-1 w-full rounded-xl bg-[#BDE9FB]/20 px-3 py-1.5 font-heading text-sm font-extrabold text-[#031F82]"
          aria-live="polite"
        >
          {formatMoney(savingsBalance)}
        </p>
      </div>

      <label className="block">
        <span className="flex items-center justify-between font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82]">
          Years Saved
          <span className="rounded-full bg-[#BDE9FB]/30 px-2 py-0.5 text-[#0CC1E0]">
            {yearsSaved}
          </span>
        </span>
        <input
          type="range"
          min={1}
          max={yearsSavedMax}
          step={1}
          value={Math.min(yearsSaved, yearsSavedMax)}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10) as number;
            if (Number.isFinite(next)) onYearsSavedChange(next);
          }}
          className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#BDE9FB]/50 accent-[#0CC1E0]"
        />
        {isPremium ? (
          <input
            type="number"
            min={1}
            max={yearsSavedMax}
            step={1}
            value={yearsSaved}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10);
              if (Number.isFinite(next)) {
                onYearsSavedChange(Math.min(yearsSavedMax, Math.max(1, next)));
              }
            }}
            className="mt-1.5 w-full rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#0CC1E0]"
            aria-label="Custom years saved"
          />
        ) : null}
      </label>

      <label className="block">
        <span className="flex items-center justify-between font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82]">
          Weekly Top-Up
          <span className="rounded-full bg-[#BDE9FB]/30 px-2 py-0.5 text-[#0CC1E0]">
            {formatMoney(weeklyTopUp)}
          </span>
        </span>
        <input
          type="range"
          min={0}
          max={weeklyTopUpMax}
          step={1}
          value={Math.min(weeklyTopUp, weeklyTopUpMax)}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10) as number;
            if (Number.isFinite(next)) onWeeklyTopUpChange(next);
          }}
          className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#BDE9FB]/50 accent-[#0CC1E0]"
        />
        {isPremium ? (
          <input
            type="number"
            min={0}
            max={weeklyTopUpMax}
            step={1}
            value={weeklyTopUp}
            onChange={(event) => {
              const next = Number.parseInt(event.target.value, 10);
              if (Number.isFinite(next)) {
                onWeeklyTopUpChange(Math.min(weeklyTopUpMax, Math.max(0, next)));
              }
            }}
            className="mt-1.5 w-full rounded-lg border border-[#BDE9FB] bg-white px-2 py-1.5 text-sm outline-none focus:border-[#0CC1E0]"
            aria-label="Custom weekly top-up"
          />
        ) : null}
      </label>

      {!isPremium ? (
        <button
          type="button"
          onClick={() => setPremiumLimitsOpen(true)}
          className="font-heading text-[10px] font-bold text-[#0CC1E0] hover:underline"
        >
          {budgetCopy.changeLimitsLink}
        </button>
      ) : null}

      <label className="block">
        <span className="flex items-center justify-between font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82]">
          Expected Return (ROI)
          <span className="rounded-full bg-[#BDE9FB]/30 px-2 py-0.5 text-[#0CC1E0]">
            {expectedRoi}%
          </span>
        </span>
        <input
          type="range"
          min={1}
          max={25}
          step={1}
          value={expectedRoi}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10) as number;
            if (Number.isFinite(next)) onExpectedRoiChange(next);
          }}
          className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#BDE9FB]/50 accent-[#DCB766]"
        />
      </label>

      {showHighRoiWarning ? (
        <div role="alert" className="rounded-xl bg-[#FFF7ED] p-2.5">
          <p className="font-sans text-xs leading-relaxed text-[#031F82]">⚠️ {highRoiWarningCopy}</p>
        </div>
      ) : null}
    </div>
    <PremiumCompoundingLimitsModal
      isOpen={premiumLimitsOpen}
      onClose={() => setPremiumLimitsOpen(false)}
    />
    </>
  );
}

type ActivityLogListProps = {
  displayName: string;
  ledger: LedgerEntry[];
};

function ActivityLogList({ ledger }: ActivityLogListProps) {
  const { formatMoney } = useCurrency();

  return (
    <ul className="max-h-64 space-y-1.5 overflow-y-auto">
      {ledger.map((entry) => (
        <li key={entry.id} className={cn("flex items-start gap-2 rounded-lg px-2 py-2", entry.highlight ? "bg-[#DCB766]/10" : "bg-[#BDE9FB]/10")}>
          {entry.flow ? (
            <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold", entry.flow === "in" ? "bg-[#22C55E]/15 text-[#15803D]" : "bg-[#FDA4AF]/30 text-[#BE123C]")}>
              {entry.flow === "in" ? "↓" : "↑"}
            </span>
          ) : (
            <span className="mt-0.5 size-6 shrink-0 rounded-full bg-white/80 text-center text-[10px] leading-6">•</span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-sans text-[11px] leading-snug text-[#031F82]">{entry.message}</p>
              {entry.amount !== undefined ? (
                <span className={cn("shrink-0 font-heading text-[10px] font-extrabold", entry.flow === "in" ? "text-[#22C55E]" : entry.flow === "out" ? "text-[#E11D48]" : "text-[#031F82]")}>
                  {entry.flow === "out" ? "-" : entry.flow === "in" ? "+" : ""}{formatMoney(entry.amount)}
                </span>
              ) : null}
            </div>
            <p className="font-sans text-[9px] text-[#1E3A5F]/60">{formatLedgerDate(entry.timestamp)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function VaultDashboard() {
  const searchParams = useSearchParams();
  const vaultCopy = copyMatrix.dashboard.vault;
  const budgetCopy = vaultCopy.budget;
  const { formatMoney } = useCurrency();
  const { username, isLoading } = useDashboardUser();
  const masteryCohort = useMasteryCohort();
  const cohortDefaults = useMemo(
    () => getVaultCompoundingDefaults(masteryCohort),
    [masteryCohort],
  );
  const displayName = resolveFinnAddressName(username, isLoading);
  const {
    moneyToAllocate,
    setMoneyToAllocate,
    jars,
    setJars,
    setCustomBuckets,
    savingsGoals,
    setSavingsGoals,
    spendingCategoryOverrides,
    setSpendingCategoryOverrides,
    customSpendingCategories,
    setCustomSpendingCategories,
    vaultBuckets,
  } = useDashboardWallet();
  const spendingCategories = useMemo(
    () =>
      resolveSpendingCategories(
        defaultSpendingCategoryLabels(),
        spendingCategoryOverrides,
        customSpendingCategories,
      ),
    [customSpendingCategories, spendingCategoryOverrides],
  );

  const highRoiWarningCopy = useMemo(
    () => buildHighRoiWarningCopy(displayName),
    [displayName],
  );
  const ledgerCounter = useRef(0);

  const [ledger, setLedger] = useState<LedgerEntry[]>([
    {
      id: "ledger-welcome",
      message: "Vault online! Deposit income, funnel it into jars, and stack wins.",
      timestamp: Date.now(),
    },
  ]);
  const [coinRain, setCoinRain] = useState<RainCoin[]>([]);
  const [confettiRain, setConfettiRain] = useState<ConfettiPiece[]>([]);
  const [savingsGoalCalloutVisible, setSavingsGoalCalloutVisible] = useState(false);
  const savingsGoalCalloutTimerRef = useRef<number | null>(null);

  const [yearsSaved, setYearsSaved] = useState(5);
  const [weeklyTopUp, setWeeklyTopUp] = useState(
    () => cohortDefaults.weeklyTopUp,
  );
  const [expectedRoi, setExpectedRoi] = useState(
    () => cohortDefaults.expectedRoi,
  );

  useEffect(() => {
    setWeeklyTopUp(cohortDefaults.weeklyTopUp);
    setExpectedRoi(cohortDefaults.expectedRoi);
  }, [cohortDefaults.expectedRoi, cohortDefaults.weeklyTopUp]);

  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [cashInOpen, setCashInOpen] = useState(
    () => searchParams.get("cashIn") === "1",
  );
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const isPremium = VAULT_IS_PREMIUM;

  const saveJarBalance = useMemo(
    () => jars.find((jar) => jar.id === SAVINGS_JAR_ID)?.balance ?? 0,
    [jars],
  );

  const vaultGoals = useMemo(
    () => resolveVaultSavingsGoals(savingsGoals, masteryCohort, isPremium),
    [isPremium, masteryCohort, savingsGoals],
  );

  const totalSavings = useMemo(
    () => computeTotalSavings(saveJarBalance, vaultGoals),
    [saveJarBalance, vaultGoals],
  );

  const totalBucketBalance = useMemo(
    () => sumVaultWealthBalance(vaultBuckets, totalSavings),
    [totalSavings, vaultBuckets],
  );

  const projectedTotal = useMemo(
    () =>
      projectCompoundSavings(
        totalSavings,
        weeklyTopUp,
        yearsSaved,
        expectedRoi,
      ),
    [totalSavings, weeklyTopUp, yearsSaved, expectedRoi],
  );

  const futureSavingsPotential = useMemo(
    () => resolveFutureSavingsPotential(totalSavings, projectedTotal),
    [projectedTotal, totalSavings],
  );

  const futureSubtext =
    totalSavings > 0
      ? `${expectedRoi}% ROI · ${yearsSaved} yrs`
      : "Save first to unlock your forecast";

  const compoundingLimits = useMemo(
    () => resolveCompoundingLimits(masteryCohort, isPremium),
    [isPremium, masteryCohort],
  );

  useEffect(() => {
    if (yearsSaved > compoundingLimits.yearsSavedMax) {
      setYearsSaved(compoundingLimits.yearsSavedMax);
    }
    if (weeklyTopUp > compoundingLimits.weeklyTopUpMax) {
      setWeeklyTopUp(compoundingLimits.weeklyTopUpMax);
    }
  }, [compoundingLimits.weeklyTopUpMax, compoundingLimits.yearsSavedMax, weeklyTopUp, yearsSaved]);

  useEffect(() => {
    if (isPremium) return;
    setSavingsGoals((current) => {
      const ensured = ensureFreemiumStarterGoals(current, masteryCohort);
      const isSynced =
        ensured.length === current.length &&
        ensured.every((goal) => {
          const match = current.find((entry) => entry.id === goal.id);
          return (
            match &&
            match.balance === goal.balance &&
            match.targetAmount === goal.targetAmount &&
            match.name === goal.name
          );
        });
      return isSynced ? current : ensured;
    });
  }, [isPremium, masteryCohort, setSavingsGoals]);

  const triggerCoinRain = useCallback(() => {
    const burst = spawnRainCoins();
    setCoinRain((current) => [...current, ...burst]);

    window.setTimeout(() => {
      setCoinRain((current) =>
        current.filter((coin) => !burst.some((entry) => entry.id === coin.id)),
      );
    }, COIN_RAIN_DURATION_MS + 200);
  }, []);

  const triggerConfettiRain = useCallback(() => {
    const burst = spawnConfettiPieces();
    setConfettiRain((current) => [...current, ...burst]);

    window.setTimeout(() => {
      setConfettiRain((current) =>
        current.filter((piece) => !burst.some((entry) => entry.id === piece.id)),
      );
    }, CONFETTI_RAIN_DURATION_MS + 200);
  }, []);


  const appendLedger = useCallback(
    (
      message: string,
      options?: {
        highlight?: boolean;
        amount?: number;
        flow?: LedgerFlow;
      },
    ) => {
      ledgerCounter.current += 1;
      setLedger((current) => [
        {
          id: `ledger-${ledgerCounter.current}-${createLedgerId()}`,
          message,
          highlight: options?.highlight,
          timestamp: Date.now(),
          amount: options?.amount,
          flow: options?.flow,
        },
        ...current,
      ]);
    },
    [],
  );

  const celebrateGoalsJustHit = useCallback(
    (beforeGoals: readonly SavingsGoal[], afterGoals: readonly SavingsGoal[]) => {
      const hitGoals = findGoalsJustHitTarget(beforeGoals, afterGoals);
      if (hitGoals.length === 0) return;

      triggerConfettiRain();
      setSavingsGoalCalloutVisible(true);
      if (savingsGoalCalloutTimerRef.current !== null) {
        window.clearTimeout(savingsGoalCalloutTimerRef.current);
      }
      savingsGoalCalloutTimerRef.current = window.setTimeout(() => {
        setSavingsGoalCalloutVisible(false);
        savingsGoalCalloutTimerRef.current = null;
      }, CONFETTI_RAIN_DURATION_MS + 200);

      for (const goal of hitGoals) {
        appendLedger(
          vaultCopy.savings.goalHitTargetLogTemplate.replace("{goal}", goal.name),
          { highlight: true },
        );
      }
    },
    [appendLedger, triggerConfettiRain, vaultCopy.savings.goalHitTargetLogTemplate],
  );

  useEffect(
    () => () => {
      if (savingsGoalCalloutTimerRef.current !== null) {
        window.clearTimeout(savingsGoalCalloutTimerRef.current);
      }
    },
    [],
  );

  const handlePointsConverted = useCallback(
    ({ audAmount, pointsClaimed }: PointsConvertedPayload) => {
      triggerCoinRain();
      appendLedger(
        `Cashed in ${pointsClaimed.toLocaleString()} XP to Save Jar`,
        { amount: audAmount, flow: "in", highlight: true },
      );
      setCalculatorOpen(false);
    },
    [appendLedger, triggerCoinRain],
  );

  useEffect(() => {
    if (searchParams.get("cashIn") === "1") {
      setCashInOpen(true);
    }
  }, [searchParams]);

  const handleDeposit = useCallback(
    (amount: number) => {
      setMoneyToAllocate((current) => roundAudAmount(current + amount));
      appendLedger(
        budgetCopy.depositLogTemplate.replace("{amount}", formatMoney(amount)),
        { amount, flow: "in" },
      );
    },
    [appendLedger, budgetCopy.depositLogTemplate, formatMoney, setMoneyToAllocate],
  );

  const handleLockIn = useCallback(
    (allocations: Record<string, number>) => {
      const total = sumAllocations(allocations);
      if (total <= 0 || total > moneyToAllocate + 0.001) return;

      setMoneyToAllocate((current) => roundAudAmount(current - total));

      for (const [bucketId, amount] of Object.entries(allocations)) {
        if (amount <= 0) continue;
        adjustBucketBalance(
          bucketId as VaultBucketId,
          amount,
          setJars,
          setCustomBuckets,
        );
      }

      triggerCoinRain();
      appendLedger(
        budgetCopy.lockedInTemplate.replace("{amount}", formatMoney(total)),
        { amount: total, flow: "out" },
      );
    },
    [
      appendLedger,
      budgetCopy.lockedInTemplate,
      formatMoney,
      moneyToAllocate,
      setCustomBuckets,
      setJars,
      setMoneyToAllocate,
      triggerCoinRain,
    ],
  );

  const handleVaultTransfer = useCallback(
    (from: VaultTransferLocationId, to: VaultTransferLocationId, amount: number) => {
      if (amount <= 0 || from === to) return;

      const resolveBalance = (id: VaultTransferLocationId): number => {
        if (id === "pool") return moneyToAllocate;
        if (isSavingsGoalMoveTarget(id)) {
          return savingsGoals.find((entry) => entry.id === id)?.balance ?? 0;
        }
        return vaultBuckets.find((entry) => entry.id === id)?.balance ?? 0;
      };

      if (amount > resolveBalance(from)) return;

      const fromIsGoal = isSavingsGoalMoveTarget(from);
      const toIsGoal = isSavingsGoalMoveTarget(to);

      if (from === "pool") {
        setMoneyToAllocate((current) => roundAudAmount(current - amount));
      } else if (!fromIsGoal) {
        adjustBucketBalance(from, -amount, setJars, setCustomBuckets);
      }

      if (to === "pool") {
        setMoneyToAllocate((current) => roundAudAmount(current + amount));
      } else if (!toIsGoal) {
        adjustBucketBalance(to, amount, setJars, setCustomBuckets);
      }

      if (fromIsGoal || toIsGoal) {
        const beforeGoals = savingsGoals;
        const nextGoals = beforeGoals.map((entry) => {
          if (fromIsGoal && entry.id === from) {
            return { ...entry, balance: roundAudAmount(entry.balance - amount) };
          }
          if (toIsGoal && entry.id === to) {
            return { ...entry, balance: roundAudAmount(entry.balance + amount) };
          }
          return entry;
        });
        setSavingsGoals(nextGoals);
        celebrateGoalsJustHit(beforeGoals, nextGoals);
      }

      const fromName = resolveVaultTransferLocationLabel(
        from,
        vaultBuckets,
        savingsGoals,
        budgetCopy.poolLabel,
      );
      const toName = resolveVaultTransferLocationLabel(
        to,
        vaultBuckets,
        savingsGoals,
        budgetCopy.poolLabel,
      );
      appendLedger(
        vaultCopy.savings.vaultTransferLogTemplate
          .replace("{amount}", formatMoney(amount))
          .replace("{from}", fromName)
          .replace("{to}", toName),
        { amount },
      );
    },
    [
      appendLedger,
      budgetCopy.poolLabel,
      celebrateGoalsJustHit,
      formatMoney,
      moneyToAllocate,
      savingsGoals,
      setCustomBuckets,
      setJars,
      setMoneyToAllocate,
      setSavingsGoals,
      vaultBuckets,
      vaultCopy.savings.vaultTransferLogTemplate,
    ],
  );

  const handleMarkSpent = useCallback(
    (bucketId: VaultBucketId, amount: number, categoryLabel: string) => {
      if (amount <= 0) return;

      const bucket = vaultBuckets.find((entry) => entry.id === bucketId);
      if (!bucket || amount > bucket.balance) return;

      adjustBucketBalance(bucketId, -amount, setJars, setCustomBuckets);
      appendLedger(
        budgetCopy.spentLogTemplate
          .replace("{amount}", formatMoney(amount))
          .replace("{category}", categoryLabel)
          .replace("{bucket}", bucket.name),
        { amount, flow: "out", highlight: true },
      );
    },
    [
      appendLedger,
      budgetCopy.spentLogTemplate,
      formatMoney,
      setCustomBuckets,
      setJars,
      vaultBuckets,
    ],
  );

  const handleAddCustomSpendingCategory = useCallback(
    (label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;
      setCustomSpendingCategories((current) => [
        ...current,
        defaultCustomSpendingCategory(trimmed),
      ]);
    },
    [setCustomSpendingCategories],
  );

  const handleRenameSpendingCategory = useCallback(
    (categoryId: SpendingCategoryId, label: string) => {
      const trimmed = label.trim();
      if (!trimmed) return;

      if (isDefaultSpendingCategoryId(categoryId)) {
        setSpendingCategoryOverrides((current) => ({
          ...current,
          [categoryId]: trimmed,
        }));
        return;
      }

      setCustomSpendingCategories((current) =>
        current.map((entry) =>
          entry.id === categoryId ? { ...entry, label: trimmed } : entry,
        ),
      );
    },
    [setCustomSpendingCategories, setSpendingCategoryOverrides],
  );

  const handleRenameBucket = useCallback(
    (bucketId: VaultBucketId, name: string) => {
      if (isCustomBucketId(bucketId)) {
        setCustomBuckets((current) =>
          current.map((bucket) =>
            bucket.id === bucketId ? { ...bucket, name } : bucket,
          ),
        );
        return;
      }

      setJars((current) =>
        current.map((jar) => (jar.id === bucketId ? { ...jar, name } : jar)),
      );
    },
    [setCustomBuckets, setJars],
  );

  const handleAddCustomBucket = useCallback(() => {
    setCustomBuckets((current) => [...current, defaultCustomBucket()]);
  }, [setCustomBuckets]);

  const handleAddGoal = useCallback(
    (name: string, targetAmount: number) => {
      setSavingsGoals((current) => [
        ...current,
        defaultSavingsGoal(name, targetAmount),
      ]);
      appendLedger(`Created savings goal: ${name.trim()}`);
    },
    [appendLedger, setSavingsGoals],
  );

  const handleUpdateGoalTarget = useCallback(
    (goalId: SavingsGoalId, targetAmount: number) => {
      if (targetAmount <= 0) return;

      const goal = savingsGoals.find((entry) => entry.id === goalId);
      if (!goal) return;

      setSavingsGoals((current) =>
        current.map((entry) =>
          entry.id === goalId
            ? { ...entry, targetAmount: roundAudAmount(targetAmount) }
            : entry,
        ),
      );
      appendLedger(
        vaultCopy.savings.goalTargetUpdatedTemplate
          .replace("{goal}", goal.name)
          .replace("{amount}", formatMoney(targetAmount)),
      );
    },
    [
      appendLedger,
      formatMoney,
      savingsGoals,
      setSavingsGoals,
      vaultCopy.savings.goalTargetUpdatedTemplate,
    ],
  );

  const handleSpendFromGoal = useCallback(
    (goalId: SavingsGoalId, amount: number, note?: string) => {
      if (amount <= 0) return;

      const goal = savingsGoals.find((entry) => entry.id === goalId);
      if (!goal || amount > goal.balance) return;

      setSavingsGoals((current) =>
        current.map((entry) =>
          entry.id === goalId
            ? { ...entry, balance: roundAudAmount(entry.balance - amount) }
            : entry,
        ),
      );

      const trimmedNote = note?.trim();
      const ledgerMessage = trimmedNote
        ? vaultCopy.savings.spentFromGoalWithNoteTemplate
            .replace("{amount}", formatMoney(amount))
            .replace("{goal}", goal.name)
            .replace("{note}", trimmedNote)
        : vaultCopy.savings.spentFromGoalTemplate
            .replace("{amount}", formatMoney(amount))
            .replace("{goal}", goal.name);

      appendLedger(ledgerMessage, { amount, flow: "out", highlight: true });
    },
    [
      appendLedger,
      formatMoney,
      savingsGoals,
      setSavingsGoals,
      vaultCopy.savings.spentFromGoalTemplate,
      vaultCopy.savings.spentFromGoalWithNoteTemplate,
    ],
  );


  const handleDeleteCustomBucket = useCallback(
    (bucketId: VaultBucketId) => {
      if (!isCustomBucketId(bucketId)) return;

      const bucket = vaultBuckets.find((entry) => entry.id === bucketId);
      if (!bucket || bucket.balance > 0) return;

      setCustomBuckets((current) => current.filter((entry) => entry.id !== bucketId));
      appendLedger(`Removed bucket: ${bucket.name}`);
    },
    [appendLedger, setCustomBuckets, vaultBuckets],
  );

  const handleAssignGoals = useCallback(
    (allocations: Record<string, number>) => {
      const appliedByGoal = new Map<SavingsGoalId, number>();
      let appliedTotal = 0;

      for (const [goalId, rawAmount] of Object.entries(allocations)) {
        const amount = rawAmount ?? 0;
        if (amount <= 0) continue;
        const applied = roundAudAmount(amount);
        appliedByGoal.set(goalId as SavingsGoalId, applied);
        appliedTotal = roundAudAmount(appliedTotal + applied);
      }

      if (appliedTotal <= 0 || appliedTotal > saveJarBalance + 0.001) return;

      const beforeGoals = savingsGoals;
      const nextGoals = beforeGoals.map((entry) => {
        const applied = appliedByGoal.get(entry.id) ?? 0;
        if (applied <= 0) return entry;
        return { ...entry, balance: roundAudAmount(entry.balance + applied) };
      });

      adjustBucketBalance(SAVINGS_JAR_ID, -appliedTotal, setJars, setCustomBuckets);
      setSavingsGoals(nextGoals);
      celebrateGoalsJustHit(beforeGoals, nextGoals);

      for (const [goalId, applied] of appliedByGoal) {
        const goal = savingsGoals.find((entry) => entry.id === goalId);
        if (!goal) continue;
        appendLedger(
          vaultCopy.savings.allocatedToGoalTemplate
            .replace("{amount}", formatMoney(applied))
            .replace("{goal}", goal.name),
          { amount: applied },
        );
      }
    },
    [
      appendLedger,
      celebrateGoalsJustHit,
      formatMoney,
      saveJarBalance,
      savingsGoals,
      setCustomBuckets,
      setJars,
      setSavingsGoals,
      vaultCopy.savings.allocatedToGoalTemplate,
    ],
  );

  return (
    <div className="relative mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-2 overflow-x-hidden bg-white px-3 py-5 pb-10">
      <CoinRainOverlay coins={coinRain} />
      <ConfettiRainOverlay pieces={confettiRain} />
      <SavingsGoalAchievedCallout
        isVisible={savingsGoalCalloutVisible}
        message={vaultCopy.savings.goalAchievedCallout}
        kicker={vaultCopy.savings.goalAchievedCalloutKicker}
      />

      <VaultBudgetHub
        isPremium={isPremium}
        totalBalance={totalBucketBalance}
        moneyToAllocate={moneyToAllocate}
        buckets={vaultBuckets}
        totalSavings={totalSavings}
        futureSavingsPotential={futureSavingsPotential}
        futureSubtext={futureSubtext}
        calculatorOpen={calculatorOpen}
        onToggleCalculator={() => setCalculatorOpen((open) => !open)}
        calculatorPanel={
          <CompoundingCalculatorPanel
            savingsBalance={totalSavings}
            projectedTotal={projectedTotal}
            isPremium={isPremium}
            yearsSaved={yearsSaved}
            yearsSavedMax={compoundingLimits.yearsSavedMax}
            weeklyTopUp={weeklyTopUp}
            weeklyTopUpMax={compoundingLimits.weeklyTopUpMax}
            expectedRoi={expectedRoi}
            highRoiWarningCopy={highRoiWarningCopy}
            onYearsSavedChange={setYearsSaved}
            onWeeklyTopUpChange={setWeeklyTopUp}
            onExpectedRoiChange={setExpectedRoi}
          />
        }
        goals={vaultGoals}
        onDeposit={handleDeposit}
        onLockIn={handleLockIn}
        onVaultTransfer={handleVaultTransfer}
        onMarkSpent={handleMarkSpent}
        spendingCategories={spendingCategories}
        onAddCustomSpendingCategory={handleAddCustomSpendingCategory}
        onRenameSpendingCategory={handleRenameSpendingCategory}
        onAddGoal={handleAddGoal}
        onUpdateGoalTarget={handleUpdateGoalTarget}
        onAssignGoals={handleAssignGoals}
        onSpendFromGoal={handleSpendFromGoal}
        onRenameBucket={handleRenameBucket}
        onAddCustomBucket={handleAddCustomBucket}
        onDeleteCustomBucket={handleDeleteCustomBucket}
      />

      <VaultCollapsible
        id="vault-activity-log"
        title={`${displayName}'s Activity Log`}
        subtitle="Money in and out"
        icon="📒"
        isOpen={ledgerOpen}
        onToggle={() => setLedgerOpen((open) => !open)}
      >
        <ActivityLogList displayName={displayName} ledger={ledger} />
      </VaultCollapsible>

      <ModalShell
        isOpen={cashInOpen}
        onClose={() => setCashInOpen(false)}
        labelledBy="vault-cash-in-title"
        backdropClassName="bg-[#031F82]/45"
        panelClassName="max-w-sm rounded-nga-xl bg-white p-5 shadow-nga-pop sm:p-6"
      >
        <h2
          id="vault-cash-in-title"
          className="font-heading text-lg font-extrabold text-[#031F82]"
        >
          {vaultCopy.cashInTileLabel}
        </h2>
        <div className="mt-4">
          <CashInPointsPanel
            onConverted={(payload) => {
              handlePointsConverted(payload);
              setCashInOpen(false);
            }}
          />
        </div>
      </ModalShell>
    </div>
  );
}
