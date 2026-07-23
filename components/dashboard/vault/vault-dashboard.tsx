"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { CashInPointsPanel } from "@/components/dashboard/points/cash-in-points-panel";
import type { PointsConvertedPayload } from "@/components/dashboard/points/cash-in-points-panel";
import {
  VaultBudgetHub,
  type MoveTarget,
} from "@/components/dashboard/vault/vault-budget-hub";
import { VaultCollapsible } from "@/components/dashboard/vault/vault-visuals";
import { ModalShell } from "@/components/ui/modal-shell";
import { OverlayPortal } from "@/components/ui/overlay-portal";
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
  sumAllocations,
  sumBucketBalances,
  type CustomVaultBucketPersisted,
  type VaultBucket,
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
  ensureFreemiumStarterGoals,
  resolveVaultSavingsGoals,
  sumSavingsGoalBalances,
  type SavingsGoalId,
} from "@/lib/dashboard/savings-goals";
import {
  getVaultCompoundingDefaults,
  resolveFutureSavingsPotential,
} from "@/lib/dashboard/vault-compounding-defaults";
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

type CoinFlight = {
  id: string;
  direction: "to-jar" | "to-holding";
  jarIndex: number;
  delayMs: number;
};

const HIGH_ROI_WARNING_THRESHOLD = 12;

const COIN_BURST_COUNT = 6;
const COIN_FLIGHT_DURATION_MS = 900;

function formatLedgerDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function parsePrincipalOverride(
  rawValue: string,
  savingsBalance: number,
): number {
  const trimmed = rawValue.trim();
  if (!trimmed) return savingsBalance;

  const parsed = Number.parseFloat(trimmed) as number;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : savingsBalance;
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

function spawnCoinFlights(
  direction: CoinFlight["direction"],
  jarIndex: number,
): CoinFlight[] {
  const stamp = Date.now();
  return Array.from({ length: COIN_BURST_COUNT }, (_, index) => ({
    id: `${direction}-${jarIndex}-${stamp}-${index}`,
    direction,
    jarIndex,
    delayMs: index * 70,
  }));
}

function createLedgerId(): string {
  return `ledger-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function resolveCoinJarOffset(jarIndex: number): string {
  if (jarIndex === 0) return "-14vw";
  if (jarIndex === 1) return "14vw";
  return "0vw";
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

function resolveBucketName(
  bucketId: VaultBucketId | "pool",
  buckets: readonly VaultBucket[],
  poolLabel: string,
): string {
  if (bucketId === "pool") return poolLabel;
  return buckets.find((bucket) => bucket.id === bucketId)?.name ?? "Jar";
}

type CoinFlightOverlayProps = {
  flights: CoinFlight[];
};

function CoinFlightOverlay({ flights }: CoinFlightOverlayProps) {
  const styleId = useId().replace(/:/g, "");

  if (flights.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes vault-coin-to-jar-${styleId} {
          0% { transform: translate(-50%, -120%) scale(1); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--jar-offset)), 180%) scale(0.45); opacity: 0; }
        }
        @keyframes vault-coin-to-holding-${styleId} {
          0% { transform: translate(calc(-50% + var(--jar-offset)), 120%) scale(0.6); opacity: 1; }
          100% { transform: translate(-50%, -160%) scale(1); opacity: 0; }
        }
      `}</style>

      <OverlayPortal className="overflow-hidden">
        {flights.map((flight) => (
          <span
            key={flight.id}
            className="absolute left-1/2 top-[42%] text-xl sm:text-2xl"
            style={{
              ["--jar-offset" as string]: resolveCoinJarOffset(flight.jarIndex),
              animation:
                flight.direction === "to-jar"
                  ? `vault-coin-to-jar-${styleId} ${COIN_FLIGHT_DURATION_MS}ms ease-in forwards`
                  : `vault-coin-to-holding-${styleId} ${COIN_FLIGHT_DURATION_MS}ms ease-out forwards`,
              animationDelay: `${flight.delayMs}ms`,
            }}
          >
            🪙
          </span>
        ))}
      </OverlayPortal>
    </>
  );
}


type CompoundingCalculatorPanelProps = {
  savingsBalance: number;
  projectedTotal: number;
  yearsSaved: number;
  weeklyTopUp: number;
  weeklyTopUpMax: number;
  expectedRoi: number;
  principalOverride: string;
  highRoiWarningCopy: string;
  onPrincipalOverrideChange: (value: string) => void;
  onYearsSavedChange: (value: number) => void;
  onWeeklyTopUpChange: (value: number) => void;
  onExpectedRoiChange: (value: number) => void;
};

function CompoundingCalculatorPanel({
  savingsBalance,
  projectedTotal,
  yearsSaved,
  weeklyTopUp,
  weeklyTopUpMax,
  expectedRoi,
  principalOverride,
  highRoiWarningCopy,
  onPrincipalOverrideChange,
  onYearsSavedChange,
  onWeeklyTopUpChange,
  onExpectedRoiChange,
}: CompoundingCalculatorPanelProps) {
  const { formatMoney } = useCurrency();
  const showHighRoiWarning = expectedRoi >= HIGH_ROI_WARNING_THRESHOLD;

  return (
    <div
      id="compounding-calculator-panel"
      className="space-y-3 rounded-xl bg-[#F7FBFF]/80 p-3"
      role="region"
      aria-label="Compounding calculator"
    >
      <p className="font-sans text-xs text-[#1E3A5F]">
        Projected: <span className="font-semibold text-[#031F82]">{formatMoney(projectedTotal)}</span>
      </p>

      <label className="block">
        <span className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82]">
          Starting Amount
        </span>
        <input
          type="number"
          min={0}
          step={1}
          inputMode="decimal"
          placeholder={String(savingsBalance)}
          value={principalOverride}
          onChange={(event) => onPrincipalOverrideChange(event.target.value)}
          className="mt-1 w-full rounded-xl bg-[#BDE9FB]/20 px-3 py-1.5 font-sans text-sm text-[#031F82] outline-none focus:bg-[#BDE9FB]/35"
        />
      </label>

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
          max={10}
          step={1}
          value={yearsSaved}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10) as number;
            if (Number.isFinite(next)) onYearsSavedChange(next);
          }}
          className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#BDE9FB]/50 accent-[#0CC1E0]"
        />
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
          value={weeklyTopUp}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10) as number;
            if (Number.isFinite(next)) onWeeklyTopUpChange(next);
          }}
          className="mt-1 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#BDE9FB]/50 accent-[#0CC1E0]"
        />
      </label>

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
    vaultBuckets,
  } = useDashboardWallet();
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
  const [coinFlights, setCoinFlights] = useState<CoinFlight[]>([]);

  const [principalOverride, setPrincipalOverride] = useState("");
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
  const [isPremium] = useState(false);

  const totalBucketBalance = useMemo(
    () => sumBucketBalances(vaultBuckets),
    [vaultBuckets],
  );

  const saveJarBalance = useMemo(
    () => jars.find((jar) => jar.id === SAVINGS_JAR_ID)?.balance ?? 0,
    [jars],
  );

  const goalsBalance = useMemo(
    () => sumSavingsGoalBalances(savingsGoals),
    [savingsGoals],
  );

  const totalSavings = useMemo(
    () => roundAudAmount(saveJarBalance + goalsBalance),
    [goalsBalance, saveJarBalance],
  );

  const activePrincipal = useMemo(
    () => parsePrincipalOverride(principalOverride, totalSavings),
    [principalOverride, totalSavings],
  );

  const projectedTotal = useMemo(
    () =>
      projectCompoundSavings(
        activePrincipal,
        weeklyTopUp,
        yearsSaved,
        expectedRoi,
      ),
    [activePrincipal, weeklyTopUp, yearsSaved, expectedRoi],
  );

  const futureSavingsPotential = useMemo(
    () => resolveFutureSavingsPotential(totalSavings, projectedTotal),
    [projectedTotal, totalSavings],
  );

  const futureSubtext =
    totalSavings > 0
      ? `${expectedRoi}% ROI · ${yearsSaved} yrs`
      : "Save first to unlock your forecast";

  const vaultGoals = useMemo(
    () => resolveVaultSavingsGoals(savingsGoals, masteryCohort, isPremium),
    [isPremium, masteryCohort, savingsGoals],
  );

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

  const triggerCoinBurst = useCallback(
    (direction: CoinFlight["direction"], jarIndex: number) => {
      const burst = spawnCoinFlights(direction, jarIndex);
      setCoinFlights((current) => [...current, ...burst]);

      window.setTimeout(() => {
        setCoinFlights((current) =>
          current.filter(
            (flight) => !burst.some((coin) => coin.id === flight.id),
          ),
        );
      }, COIN_FLIGHT_DURATION_MS + (burst.at(-1)?.delayMs ?? 0) + 100);
    },
    [],
  );


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

  const handlePointsConverted = useCallback(
    ({ audAmount, pointsClaimed }: PointsConvertedPayload) => {
      const saveJarIndex = jars.findIndex((jar) => jar.id === SAVINGS_JAR_ID);
      triggerCoinBurst("to-jar", saveJarIndex >= 0 ? saveJarIndex : 0);
      appendLedger(
        `Cashed in ${pointsClaimed.toLocaleString()} XP to Save Jar`,
        { amount: audAmount, flow: "in", highlight: true },
      );
      setCalculatorOpen(false);
    },
    [appendLedger, jars, triggerCoinBurst],
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

      const saveIndex = vaultBuckets.findIndex((bucket) => bucket.id === SAVINGS_JAR_ID);
      triggerCoinBurst("to-jar", saveIndex >= 0 ? saveIndex : 0);
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
      triggerCoinBurst,
      vaultBuckets,
    ],
  );

  const handleMove = useCallback(
    (fromId: VaultBucketId, destination: MoveTarget, amount: number) => {
      if (amount <= 0) return;

      const fromBucket = vaultBuckets.find((bucket) => bucket.id === fromId);
      if (!fromBucket || amount > fromBucket.balance) return;

      adjustBucketBalance(fromId, -amount, setJars, setCustomBuckets);

      if (destination === "pool") {
        setMoneyToAllocate((current) => roundAudAmount(current + amount));
        appendLedger(
          `Moved ${formatMoney(amount)} from ${fromBucket.name} to ${budgetCopy.poolLabel}`,
          { amount, flow: "in" },
        );
        return;
      }

      adjustBucketBalance(destination, amount, setJars, setCustomBuckets);
      const destName = resolveBucketName(destination, vaultBuckets, budgetCopy.poolLabel);
      appendLedger(
        `Moved ${formatMoney(amount)} from ${fromBucket.name} to ${destName}`,
        { amount },
      );
    },
    [
      appendLedger,
      budgetCopy.poolLabel,
      formatMoney,
      setCustomBuckets,
      setJars,
      setMoneyToAllocate,
      vaultBuckets,
    ],
  );

  const handleMarkSpent = useCallback(
    (bucketId: VaultBucketId, amount: number) => {
      if (amount <= 0) return;

      const bucket = vaultBuckets.find((entry) => entry.id === bucketId);
      if (!bucket || amount > bucket.balance) return;

      adjustBucketBalance(bucketId, -amount, setJars, setCustomBuckets);
      appendLedger(
        budgetCopy.spentLogTemplate
          .replace("{amount}", formatMoney(amount))
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

  const handleRenameGoal = useCallback(
    (goalId: SavingsGoalId, name: string) => {
      setSavingsGoals((current) =>
        current.map((goal) =>
          goal.id === goalId ? { ...goal, name: name.trim() } : goal,
        ),
      );
      appendLedger(`Renamed savings goal to ${name.trim()}`);
    },
    [appendLedger, setSavingsGoals],
  );

  const handleAllocateToGoal = useCallback(
    (goalId: SavingsGoalId, amount: number) => {
      if (amount <= 0 || amount > saveJarBalance) return;

      const goal = savingsGoals.find((entry) => entry.id === goalId);
      if (!goal) return;

      adjustBucketBalance(SAVINGS_JAR_ID, -amount, setJars, setCustomBuckets);
      setSavingsGoals((current) =>
        current.map((entry) =>
          entry.id === goalId
            ? { ...entry, balance: roundAudAmount(entry.balance + amount) }
            : entry,
        ),
      );
      appendLedger(
        vaultCopy.savings.allocatedToGoalTemplate
          .replace("{amount}", formatMoney(amount))
          .replace("{goal}", goal.name),
        { amount },
      );
    },
    [
      appendLedger,
      formatMoney,
      saveJarBalance,
      savingsGoals,
      setCustomBuckets,
      setJars,
      setSavingsGoals,
      vaultCopy.savings.allocatedToGoalTemplate,
    ],
  );

  const handleSpendFromSaveJar = useCallback(
    (amount: number) => {
      if (amount <= 0 || amount > saveJarBalance) return;

      adjustBucketBalance(SAVINGS_JAR_ID, -amount, setJars, setCustomBuckets);
      appendLedger(
        vaultCopy.savings.spentFromSaveTemplate.replace("{amount}", formatMoney(amount)),
        { amount, flow: "out", highlight: true },
      );
    },
    [
      appendLedger,
      formatMoney,
      saveJarBalance,
      setCustomBuckets,
      setJars,
      vaultCopy.savings.spentFromSaveTemplate,
    ],
  );

  const handleSpendFromGoal = useCallback(
    (goalId: SavingsGoalId, amount: number) => {
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
      appendLedger(
        vaultCopy.savings.spentFromGoalTemplate
          .replace("{amount}", formatMoney(amount))
          .replace("{goal}", goal.name),
        { amount, flow: "out", highlight: true },
      );
    },
    [
      appendLedger,
      formatMoney,
      savingsGoals,
      setSavingsGoals,
      vaultCopy.savings.spentFromGoalTemplate,
    ],
  );

  const handleAssignGoals = useCallback(
    (allocations: Record<string, number>) => {
      const total = sumAllocations(allocations);
      if (total <= 0 || total > saveJarBalance + 0.001) return;

      adjustBucketBalance(SAVINGS_JAR_ID, -total, setJars, setCustomBuckets);
      setSavingsGoals((current) =>
        current.map((entry) => {
          const amount = allocations[entry.id] ?? 0;
          if (amount <= 0) return entry;
          return { ...entry, balance: roundAudAmount(entry.balance + amount) };
        }),
      );

      for (const [goalId, amount] of Object.entries(allocations)) {
        if (amount <= 0) continue;
        const goal = savingsGoals.find((entry) => entry.id === goalId);
        if (!goal) continue;
        appendLedger(
          vaultCopy.savings.allocatedToGoalTemplate
            .replace("{amount}", formatMoney(amount))
            .replace("{goal}", goal.name),
          { amount },
        );
      }
    },
    [
      appendLedger,
      formatMoney,
      saveJarBalance,
      savingsGoals,
      setCustomBuckets,
      setJars,
      setSavingsGoals,
      vaultCopy.savings.allocatedToGoalTemplate,
    ],
  );

  const handleMoveFromGoal = useCallback(
    (goalId: SavingsGoalId, amount: number, destination: VaultBucketId) => {
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

      adjustBucketBalance(destination, amount, setJars, setCustomBuckets);

      if (destination === SAVINGS_JAR_ID) {
        appendLedger(
          vaultCopy.savings.returnedGoalToSaveTemplate
            .replace("{amount}", formatMoney(amount))
            .replace("{goal}", goal.name),
          { amount },
        );
        return;
      }

      const destName = vaultBuckets.find((bucket) => bucket.id === destination)?.name ?? "Jar";
      appendLedger(`Moved ${formatMoney(amount)} from ${goal.name} to ${destName}`, { amount });
    },
    [
      appendLedger,
      formatMoney,
      savingsGoals,
      setCustomBuckets,
      setJars,
      setSavingsGoals,
      vaultCopy.savings.returnedGoalToSaveTemplate,
      vaultBuckets,
    ],
  );

  return (
    <div className="relative mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-2 overflow-x-hidden bg-white px-3 py-5 pb-10">
      <CoinFlightOverlay flights={coinFlights} />

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
            yearsSaved={yearsSaved}
            weeklyTopUp={weeklyTopUp}
            weeklyTopUpMax={cohortDefaults.weeklyTopUpMax}
            expectedRoi={expectedRoi}
            principalOverride={principalOverride}
            highRoiWarningCopy={highRoiWarningCopy}
            onPrincipalOverrideChange={setPrincipalOverride}
            onYearsSavedChange={setYearsSaved}
            onWeeklyTopUpChange={setWeeklyTopUp}
            onExpectedRoiChange={setExpectedRoi}
          />
        }
        goals={vaultGoals}
        onRenameGoal={handleRenameGoal}
        onDeposit={handleDeposit}
        onLockIn={handleLockIn}
        onMove={handleMove}
        onMarkSpent={handleMarkSpent}
        onSpendFromSaveJar={handleSpendFromSaveJar}
        onAddGoal={handleAddGoal}
        onAllocateToGoal={handleAllocateToGoal}
        onAssignGoals={handleAssignGoals}
        onSpendFromGoal={handleSpendFromGoal}
        onMoveFromGoal={handleMoveFromGoal}
        onRenameBucket={handleRenameBucket}
        onAddCustomBucket={handleAddCustomBucket}
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
