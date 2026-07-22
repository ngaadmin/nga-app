"use client";

import Image from "next/image";
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
  isSavingsBucket,
  sumAllocations,
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

type SavingsRegisterEntry = {
  id: string;
  timestamp: number;
  amount: number;
  direction: "added" | "removed";
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

const floatingPanelClass = "rounded-2xl border-0 bg-white shadow-md";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 sm:text-sm";

const vaultTileClass =
  "flex flex-col items-center justify-center rounded-2xl bg-white p-4 text-center shadow-md transition-all hover:shadow-lg active:scale-[0.98]";

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

function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={cn(
        "size-4 shrink-0 text-[#0CC1E0] transition-transform duration-300",
        isOpen && "rotate-180",
      )}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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

type VaultStatTileProps = {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick: () => void;
  ariaControls?: string;
};

function VaultStatTile({
  label,
  value,
  subtext,
  icon,
  isActive,
  onClick,
  ariaControls,
}: VaultStatTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isActive}
      aria-controls={ariaControls}
      className={cn(
        vaultTileClass,
        "w-full min-h-[7.5rem]",
        isActive && "ring-2 ring-[#0CC1E0]/35 shadow-lg",
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-[#BDE9FB]/25">
        {icon}
      </span>
      <p className="mt-2 font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
        {label}
      </p>
      <p className="mt-1 font-heading text-lg font-extrabold leading-none text-[#031F82] sm:text-xl">
        {value}
      </p>
      {subtext ? (
        <p className="mt-1 font-sans text-[9px] font-medium text-[#1E3A5F] sm:text-[10px]">
          {subtext}
        </p>
      ) : null}
    </button>
  );
}

type SavingsRegisterPanelProps = {
  entries: SavingsRegisterEntry[];
};

function SavingsRegisterPanel({ entries }: SavingsRegisterPanelProps) {
  const { formatMoney } = useCurrency();

  return (
    <div
      id="savings-register-panel"
      className={cn(floatingPanelClass, "p-4")}
      role="region"
      aria-label="Savings register"
    >
      <h3 className="font-heading text-sm font-extrabold text-[#031F82]">
        Savings Register
      </h3>
      <p className="mt-1 font-sans text-xs text-[#1E3A5F]">
        Every add or remove from your Save Jar - dated and tracked.
      </p>
      {entries.length === 0 ? (
        <p className="mt-4 rounded-xl bg-[#BDE9FB]/15 px-3 py-4 text-center font-sans text-xs text-[#1E3A5F]">
          No savings movements yet. Cash in XP above or allocate cash from Budget
          Hub into your Save Jar to start your register.
        </p>
      ) : (
        <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-[#BDE9FB]/10 px-3 py-2"
            >
              <span className="font-sans text-[11px] text-[#1E3A5F]">
                {formatLedgerDate(entry.timestamp)}
              </span>
              <span
                className={cn(
                  "font-heading text-sm font-extrabold",
                  entry.direction === "added"
                    ? "text-[#22C55E]"
                    : "text-[#E11D48]",
                )}
              >
                {entry.direction === "added" ? "+" : "-"}
                {formatMoney(entry.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
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
      className={cn(floatingPanelClass, "space-y-3 p-4")}
      role="region"
      aria-label="Compounding calculator"
    >
      <div>
        <h3 className="font-heading text-sm font-extrabold text-[#031F82]">
          Compounding Calculator
        </h3>
        <p className="mt-1 font-sans text-xs text-[#1E3A5F]">
          Tune your forecast - projected total:{" "}
          <span className="font-semibold text-[#031F82]">
            {formatMoney(projectedTotal)}
          </span>
        </p>
      </div>

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
        <div
          role="alert"
          className={cn(floatingPanelClass, "bg-[#FFF7ED] p-3 shadow-sm")}
        >
          <p className="font-sans text-xs leading-relaxed text-[#031F82]">
            <span aria-hidden className="mr-1">
              ⚠️
            </span>
            {highRoiWarningCopy}
          </p>
        </div>
      ) : null}
    </div>
  );
}

type ActivityLogCardProps = {
  displayName: string;
  isOpen: boolean;
  ledger: LedgerEntry[];
  onToggle: () => void;
};

function ActivityLogCard({
  displayName,
  isOpen,
  ledger,
  onToggle,
}: ActivityLogCardProps) {
  const { formatMoney } = useCurrency();

  return (
    <section aria-labelledby="activity-log-heading" className="w-full">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="activity-log-panel"
        className={cn(
          floatingPanelClass,
          "flex w-full items-center gap-3 p-4 text-left transition-all hover:shadow-lg active:scale-[0.99]",
          isOpen && "ring-2 ring-[#0CC1E0]/25",
        )}
      >
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#BDE9FB]/25 text-xl"
          aria-hidden
        >
          📒
        </span>
        <div className="min-w-0 flex-1">
          <p
            id="activity-log-heading"
            className="font-heading text-sm font-extrabold text-[#031F82]"
          >
            {displayName}&apos;s Activity Log
          </p>
          <p className="mt-0.5 font-sans text-xs text-[#1E3A5F]">
            Tap to see your money in and out
          </p>
        </div>
        <ChevronIcon isOpen={isOpen} />
      </button>

      <div
        id="activity-log-panel"
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0",
        )}
        role="region"
        aria-label={`${displayName}'s activity log`}
        aria-hidden={!isOpen}
      >
        <div className="overflow-hidden">
          <ul className="max-h-72 space-y-2 overflow-y-auto">
            {ledger.map((entry) => (
              <li
                key={entry.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl px-3 py-2.5 shadow-sm",
                  entry.highlight
                    ? "bg-[#DCB766]/10"
                    : "bg-[#BDE9FB]/15",
                )}
              >
                {entry.amount !== undefined && entry.flow ? (
                  <span
                    className={cn(
                      "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full font-heading text-sm font-extrabold",
                      entry.flow === "in"
                        ? "bg-[#22C55E]/15 text-[#15803D]"
                        : "bg-[#FDA4AF]/30 text-[#BE123C]",
                    )}
                    aria-hidden
                  >
                    {entry.flow === "in" ? "↓" : "↑"}
                  </span>
                ) : (
                  <span
                    className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm"
                    aria-hidden
                  >
                    •
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                    <p className="font-sans text-xs leading-relaxed text-[#031F82]">
                      {entry.message}
                    </p>
                    {entry.amount !== undefined ? (
                      <span
                        className={cn(
                          "shrink-0 font-heading text-xs font-extrabold",
                          entry.flow === "in"
                            ? "text-[#22C55E]"
                            : entry.flow === "out"
                              ? "text-[#E11D48]"
                              : "text-[#031F82]",
                        )}
                      >
                        {entry.flow === "out" ? "-" : entry.flow === "in" ? "+" : ""}
                        {formatMoney(entry.amount)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 font-sans text-[10px] text-[#1E3A5F]/70">
                    {formatLedgerDate(entry.timestamp)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
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
    vaultBuckets,
  } = useDashboardWallet();
  const highRoiWarningCopy = useMemo(
    () => buildHighRoiWarningCopy(displayName),
    [displayName],
  );
  const ledgerCounter = useRef(0);
  const savingsRegisterCounter = useRef(0);

  const [ledger, setLedger] = useState<LedgerEntry[]>([
    {
      id: "ledger-welcome",
      message: "Vault online! Deposit income, funnel it into jars, and stack wins.",
      timestamp: Date.now(),
    },
  ]);
  const [savingsRegister, setSavingsRegister] = useState<SavingsRegisterEntry[]>(
    [],
  );
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

  const [savingsRegisterOpen, setSavingsRegisterOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [budgetHubOpen, setBudgetHubOpen] = useState(false);
  const [cashInOpen, setCashInOpen] = useState(
    () => searchParams.get("cashIn") === "1",
  );
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [isPremium] = useState(false);
  const cashInPanelRef = useRef<HTMLDivElement | null>(null);

  const savingsBalance = useMemo(
    () => jars.find((jar) => jar.id === SAVINGS_JAR_ID)?.balance ?? 0,
    [jars],
  );

  const activePrincipal = useMemo(
    () => parsePrincipalOverride(principalOverride, savingsBalance),
    [principalOverride, savingsBalance],
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
    () => resolveFutureSavingsPotential(savingsBalance, projectedTotal),
    [projectedTotal, savingsBalance],
  );

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

  const appendSavingsRegister = useCallback(
    (amount: number, direction: "added" | "removed") => {
      savingsRegisterCounter.current += 1;
      setSavingsRegister((current) => [
        {
          id: `savings-${savingsRegisterCounter.current}-${Date.now()}`,
          timestamp: Date.now(),
          amount,
          direction,
        },
        ...current,
      ]);
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
      appendSavingsRegister(audAmount, "added");
      appendLedger(
        `Cashed in ${pointsClaimed.toLocaleString()} XP to Save Jar`,
        { amount: audAmount, flow: "in", highlight: true },
      );
      setSavingsRegisterOpen(true);
      setCalculatorOpen(false);
    },
    [appendLedger, appendSavingsRegister, jars, triggerCoinBurst],
  );

  useEffect(() => {
    if (searchParams.get("cashIn") !== "1") return;
    setCashInOpen(true);
    window.requestAnimationFrame(() => {
      cashInPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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

      let saveAmount = 0;
      for (const [bucketId, amount] of Object.entries(allocations)) {
        if (amount <= 0) continue;
        adjustBucketBalance(
          bucketId as VaultBucketId,
          amount,
          setJars,
          setCustomBuckets,
        );
        const bucket = vaultBuckets.find((entry) => entry.id === bucketId);
        if (bucket && isSavingsBucket(bucket)) {
          saveAmount = roundAudAmount(saveAmount + amount);
        }
      }

      if (saveAmount > 0) {
        appendSavingsRegister(saveAmount, "added");
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
      appendSavingsRegister,
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
        if (isSavingsBucket(fromBucket)) {
          appendSavingsRegister(amount, "removed");
        }
        return;
      }

      adjustBucketBalance(destination, amount, setJars, setCustomBuckets);
      const destName = resolveBucketName(destination, vaultBuckets, budgetCopy.poolLabel);
      appendLedger(
        `Moved ${formatMoney(amount)} from ${fromBucket.name} to ${destName}`,
        { amount },
      );

      const destBucket = vaultBuckets.find((bucket) => bucket.id === destination);
      if (isSavingsBucket(fromBucket)) {
        appendSavingsRegister(amount, "removed");
      }
      if (destBucket && isSavingsBucket(destBucket)) {
        appendSavingsRegister(amount, "added");
      }
    },
    [
      appendLedger,
      appendSavingsRegister,
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

  return (
    <div className="relative mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-6 overflow-x-hidden bg-white px-2 py-6 pb-10">
      <CoinFlightOverlay flights={coinFlights} />

      <section aria-label="Cash in points" className="w-full shrink-0">
        <button
          type="button"
          onClick={() => {
            setCashInOpen((open) => !open);
            setCalculatorOpen(false);
          }}
          aria-expanded={cashInOpen}
          aria-controls="vault-cash-in-panel"
          className={cn(
            "h-touch w-full px-4 shadow-nga-pop",
            orangeCtaClass,
            cashInOpen && "ring-2 ring-[#FFA503]/35",
          )}
        >
          {vaultCopy.cashInTileLabel}
        </button>

        <div
          id="vault-cash-in-panel"
          ref={cashInPanelRef}
          className={cn(
            "grid transition-all duration-300 ease-in-out",
            cashInOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          )}
          aria-hidden={!cashInOpen}
        >
          <div className="overflow-hidden">
            <div className={cn(floatingPanelClass, "p-4")}>
              <CashInPointsPanel onConverted={handlePointsConverted} />
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Vault savings overview" className="w-full shrink-0">
        <div className="grid grid-cols-2 gap-3">
          <VaultStatTile
            label="Total Savings"
            value={formatMoney(savingsBalance)}
            icon={
              <Image
                src="/dashboard/piggy-bank.svg"
                alt=""
                width={28}
                height={28}
                className="size-7"
                aria-hidden
              />
            }
            isActive={savingsRegisterOpen}
            ariaControls="savings-register-panel"
            onClick={() => {
              setSavingsRegisterOpen((open) => !open);
              setCalculatorOpen(false);
            }}
          />
          <VaultStatTile
            label="Future Savings Potential"
            value={formatMoney(futureSavingsPotential)}
            subtext={
              savingsBalance > 0
                ? `${expectedRoi}% ROI · ${yearsSaved} yrs`
                : "Start saving to unlock your forecast"
            }
            icon={
              <Image
                src="/dashboard/trend-up.svg"
                alt=""
                width={28}
                height={28}
                className="size-7"
                aria-hidden
              />
            }
            isActive={calculatorOpen}
            ariaControls="compounding-calculator-panel"
            onClick={() => {
              setCalculatorOpen((open) => !open);
              setSavingsRegisterOpen(false);
            }}
          />
        </div>

        {savingsRegisterOpen ? (
          <div className="mt-3">
            <SavingsRegisterPanel entries={savingsRegister} />
          </div>
        ) : null}

        {calculatorOpen ? (
          <div className="mt-3">
            <CompoundingCalculatorPanel
              savingsBalance={savingsBalance}
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
          </div>
        ) : null}
      </section>

      <VaultBudgetHub
        isOpen={budgetHubOpen}
        onToggle={() => setBudgetHubOpen((open) => !open)}
        isPremium={isPremium}
        moneyToAllocate={moneyToAllocate}
        buckets={vaultBuckets}
        onDeposit={handleDeposit}
        onLockIn={handleLockIn}
        onMove={handleMove}
        onMarkSpent={handleMarkSpent}
        onRenameBucket={handleRenameBucket}
        onAddCustomBucket={handleAddCustomBucket}
      />

      <ActivityLogCard
        displayName={displayName}
        isOpen={ledgerOpen}
        ledger={ledger}
        onToggle={() => setLedgerOpen((open) => !open)}
      />
    </div>
  );
}
