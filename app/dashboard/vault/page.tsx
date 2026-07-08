"use client";

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  DashboardSectionHeading,
  dashboardSectionHeadingClass,
} from "@/components/dashboard/dashboard-section-heading";
import { ModalShell } from "@/components/ui/modal-shell";
import { OverlayPortal } from "@/components/ui/overlay-portal";
import { copyMatrix } from "@/constants/copyMatrix";
import { useDashboardWallet } from "@/lib/dashboard/dashboard-wallet-context";
import {
  SAVINGS_JAR_ID,
  type DestinationJar,
  type DestinationJarId,
} from "@/lib/dashboard/destination-jars";
import {
  buildHighRoiWarningCopy,
  resolveFinnAddressName,
} from "@/lib/dashboard/resolve-finn-address-name";
import { useDashboardUser } from "@/lib/dashboard/use-dashboard-user";
import { cn } from "@/lib/utils/cn";

type LedgerEntry = {
  id: string;
  message: string;
  highlight?: boolean;
};

type CoinFlight = {
  id: string;
  direction: "to-jar" | "to-holding";
  jarIndex: number;
  delayMs: number;
};

type JarInteractionMode = "add" | "recall";

const HOLDING_JAR_ID = "money-to-allocate" as const;
const DEFAULT_EXPECTED_ROI = 5;
const HIGH_ROI_WARNING_THRESHOLD = 12;

const COIN_BURST_COUNT = 6;
const COIN_FLIGHT_DURATION_MS = 900;

const floatingPanelClass =
  "rounded-2xl border-0 bg-white shadow-md";

const orangeCtaClass =
  "rounded-nga-lg border-b-4 border-[#C88202] bg-[#FFA503] font-heading text-xs font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 sm:text-sm";

const confirmInClass =
  "flex-1 rounded-nga-lg border-b-4 border-[#22C55E] bg-[#86EFAC] px-2 py-1.5 font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.03] active:translate-y-[2px] active:border-b-2 sm:text-xs";

const confirmOutClass =
  "flex-1 rounded-nga-lg border-b-4 border-[#E11D48] bg-[#FDA4AF] px-2 py-1.5 font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.03] active:translate-y-[2px] active:border-b-2 sm:text-xs";

const resetPoolClass =
  "shrink-0 rounded-nga-lg border-b-4 border-gray-400 bg-gray-200 px-3 py-1.5 font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82] transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0";

const RESET_POOL_LEDGER_MESSAGE = "Typo cleared! Let's try that deposit again.";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.max(0, amount));
}

function parsePositiveAmount(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  const parsed = Number.parseFloat(trimmed) as number;
  if (!Number.isFinite(parsed) || parsed <= 0) return null;

  return Math.round(parsed * 100) / 100;
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

/**
 * Standard client-side compound interest with weekly contributions:
 * each week balance compounds at (annualROI / 52) and adds weeklyTopUp.
 */
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

function GearIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M19.4 13a7.9 7.9 0 0 0 .1-2l2-1.2-2-3.5-2.3.9a8 8 0 0 0-1.7-1L15 2h-6l-.5 4.2a8 8 0 0 0-1.7 1l-2.3-.9-2 3.5L4.5 11a7.9 7.9 0 0 0 .1 2l-2 1.2 2 3.5 2.3-.9a8 8 0 0 0 1.7 1L9 22h6l.5-4.2a8 8 0 0 0 1.7-1l2.3.9 2-3.5-2-1.2Z"
        stroke="currentColor"
        strokeWidth="2"
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

type MotivationScoreboardProps = {
  savingsBalance: number;
  projectedTotal: number;
  yearsSaved: number;
  weeklyTopUp: number;
  expectedRoi: number;
  forecastSettingsOpen: boolean;
  principalOverride: string;
  highRoiWarningCopy: string;
  onToggleSettings: () => void;
  onPrincipalOverrideChange: (value: string) => void;
  onYearsSavedChange: (value: number) => void;
  onWeeklyTopUpChange: (value: number) => void;
  onExpectedRoiChange: (value: number) => void;
};

function MotivationScoreboard({
  savingsBalance,
  projectedTotal,
  yearsSaved,
  weeklyTopUp,
  expectedRoi,
  forecastSettingsOpen,
  principalOverride,
  highRoiWarningCopy,
  onToggleSettings,
  onPrincipalOverrideChange,
  onYearsSavedChange,
  onWeeklyTopUpChange,
  onExpectedRoiChange,
}: MotivationScoreboardProps) {
  const showHighRoiWarning = expectedRoi >= HIGH_ROI_WARNING_THRESHOLD;

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-4">
        <div className={cn(floatingPanelClass, "p-3")}>
          <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
            Total Savings
          </p>
          <p className="mt-0.5 truncate font-heading text-lg font-extrabold leading-none text-[#031F82] sm:text-xl">
            {formatCurrency(savingsBalance)}
          </p>
        </div>

        <div className={cn(floatingPanelClass, "p-3")}>
          <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
            Projected Total
          </p>
          <p className="mt-0.5 font-heading text-lg font-extrabold leading-none text-[#031F82] sm:text-xl">
            {formatCurrency(projectedTotal)}
          </p>
          <p className="mt-1 font-sans text-[9px] font-semibold text-[#1E3A5F] sm:text-[10px]">
            Projected at {expectedRoi}% ROI
          </p>
          <div className="mt-1 flex items-center justify-between gap-1">
            <p className="font-sans text-[9px] text-[#1E3A5F] sm:text-[10px]">
              {yearsSaved} yrs @ {formatCurrency(weeklyTopUp)}/wk
            </p>
            <button
              type="button"
              onClick={onToggleSettings}
              aria-label="Toggle forecast settings"
              aria-expanded={forecastSettingsOpen}
              className={cn(
                "shrink-0 rounded-full bg-[#BDE9FB]/30 p-1 text-[#031F82] transition-all hover:bg-[#BDE9FB]/50 active:scale-95",
                forecastSettingsOpen && "bg-[#0CC1E0]/15 ring-2 ring-[#0CC1E0]/30",
              )}
            >
              <GearIcon className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          forecastSettingsOpen
            ? "mt-3 grid-rows-[1fr] opacity-100"
            : "mt-0 grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className={cn(floatingPanelClass, "space-y-3 p-3")}>
            <label className="block">
              <span className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82]">
                Principal override
              </span>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="decimal"
                placeholder={String(savingsBalance)}
                value={principalOverride}
                onChange={(event) =>
                  onPrincipalOverrideChange(event.target.value)
                }
                className="mt-1 w-full rounded-xl bg-[#BDE9FB]/20 px-3 py-1.5 font-sans text-sm text-[#031F82] outline-none ring-0 focus:bg-[#BDE9FB]/35 focus:outline-none"
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
                  {formatCurrency(weeklyTopUp)}
                </span>
              </span>
              <input
                type="range"
                min={0}
                max={50}
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

            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                showHighRoiWarning
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type DestinationJarCardProps = {
  jar: DestinationJar;
  isExpanded: boolean;
  interactionAmount: string;
  onToggleExpand: (jarId: DestinationJarId) => void;
  onAmountChange: (value: string) => void;
  onConfirm: (jarId: DestinationJarId, mode: JarInteractionMode) => void;
};

function DestinationJarCard({
  jar,
  isExpanded,
  interactionAmount,
  onToggleExpand,
  onAmountChange,
  onConfirm,
}: DestinationJarCardProps) {
  return (
    <article
      className={cn(
        "flex w-full flex-col self-start",
        floatingPanelClass,
        "transition-shadow",
        isExpanded && "shadow-lg ring-2 ring-[#0CC1E0]/25",
      )}
    >
      <button
        type="button"
        onClick={() => onToggleExpand(jar.id)}
        aria-expanded={isExpanded}
        className="w-full rounded-2xl p-3 text-left transition-colors hover:bg-[#BDE9FB]/10 active:bg-[#BDE9FB]/20"
      >
        <div className="flex items-start justify-between gap-1">
          <span className="text-lg leading-none" aria-hidden>
            {jar.emoji}
          </span>
          <span className="rounded-full bg-[#DCB766]/15 px-1.5 py-0.5 font-heading text-[8px] font-bold uppercase tracking-wide text-[#031F82]">
            Foundation
          </span>
        </div>

        <h3 className="mt-1.5 line-clamp-2 font-heading text-[10px] font-bold leading-tight text-[#031F82]">
          {jar.name}
        </h3>
        <p className="mt-0.5 font-heading text-base font-extrabold text-[#031F82] sm:text-lg">
          {formatCurrency(jar.balance)}
        </p>
      </button>

      <div
        className={cn(
          "grid transition-all duration-200 ease-in-out",
          isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-2 px-3 pb-3 pt-1">
            <label className="block">
              <span className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#031F82]">
                Amount
              </span>
              <input
                type="number"
                min={0}
                step={1}
                inputMode="decimal"
                value={interactionAmount}
                onChange={(event) => onAmountChange(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                placeholder="0"
                className="mt-1 w-full rounded-xl bg-[#BDE9FB]/20 px-2 py-1.5 font-sans text-sm text-[#031F82] outline-none focus:bg-[#BDE9FB]/35"
              />
            </label>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onConfirm(jar.id, "add");
                }}
                className={confirmInClass}
              >
                Confirm In
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onConfirm(jar.id, "recall");
                }}
                className={confirmOutClass}
              >
                Confirm Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

type CustomJarTeaserCardProps = {
  onClick: () => void;
};

function CustomJarTeaserCard({ onClick }: CustomJarTeaserCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[5.5rem] w-full flex-col items-center justify-center self-start p-3 text-center transition-all hover:shadow-lg active:scale-[0.98]",
        floatingPanelClass,
        "border border-dashed border-[#DCB766]/50 bg-white/90 shadow-sm",
      )}
    >
      <span className="font-heading text-xl font-bold text-[#DCB766]">+</span>
      <span className="mt-0.5 font-heading text-[10px] font-bold text-[#031F82]">
        Add Custom Jar
      </span>
    </button>
  );
}

type PremiumCustomJarModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function PremiumCustomJarModal({ isOpen, onClose }: PremiumCustomJarModalProps) {
  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="premium-jar-title"
      backdropClassName="bg-[#031F82]/45"
      panelClassName="max-w-sm rounded-nga-xl bg-white p-5 shadow-nga-pop sm:p-6"
    >
        <p className="font-heading text-xs font-bold uppercase tracking-wide text-[#DCB766]">
          Premium unlock
        </p>
        <h2
          id="premium-jar-title"
          className="mt-2 font-heading text-xl font-extrabold text-[#031F82] sm:text-2xl"
        >
          Build Your Custom Jar
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]">
          Adding, renaming, and modifying custom jars is an exclusive Paid Premium
          Tier feature. Level up to design your own money buckets and run your vault
          like a true founder.
        </p>

        <button
          type="button"
          className={cn("mt-5 h-touch w-full px-4 shadow-nga-pop", orangeCtaClass)}
        >
          Unlock Premium Tier
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-nga-lg px-4 py-2 font-heading text-sm font-bold text-[#0CC1E0] transition-colors hover:bg-[#BDE9FB]/40"
        >
          Maybe later
        </button>
    </ModalShell>
  );
}

type FinnActivityDrawerProps = {
  isOpen: boolean;
  ledger: LedgerEntry[];
  onToggle: () => void;
};

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

function FinnActivityDrawer({
  isOpen,
  ledger,
  onToggle,
}: FinnActivityDrawerProps) {
  return (
    <section
      aria-labelledby="finn-activity-log-heading"
      className="w-full pt-4"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls="finn-activity-log-panel"
        className="group flex w-full items-center justify-center gap-2 py-2 transition-opacity hover:opacity-80 active:opacity-70"
      >
        <span
          id="finn-activity-log-heading"
          className={dashboardSectionHeadingClass}
        >
          Finn&apos;s Activity Log
        </span>
        <ChevronIcon isOpen={isOpen} />
      </button>

      <div
        id="finn-activity-log-panel"
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isOpen ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0",
        )}
        role="region"
        aria-label="Finn's Activity Log feed"
        aria-hidden={!isOpen}
      >
        <div className="overflow-hidden">
          <ul className="max-h-72 space-y-3 overflow-y-auto px-1 py-1">
            {ledger.map((entry) => (
              <li
                key={entry.id}
                className={cn(
                  "rounded-2xl px-3 py-2.5 font-sans text-xs leading-relaxed shadow-sm",
                  entry.highlight
                    ? "bg-[#DCB766]/10 font-semibold text-[#031F82]"
                    : "bg-[#BDE9FB]/15 text-[#1E3A5F]",
                )}
              >
                {entry.message}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function VaultPage() {
  const vaultCopy = copyMatrix.dashboard.vault;
  const { username, isLoading } = useDashboardUser();
  const { moneyToAllocate, setMoneyToAllocate, jars, setJars } =
    useDashboardWallet();
  const finnAddressName = resolveFinnAddressName(username, isLoading);
  const highRoiWarningCopy = useMemo(
    () => buildHighRoiWarningCopy(finnAddressName),
    [finnAddressName],
  );
  const ledgerCounter = useRef(0);

  const [incomeInput, setIncomeInput] = useState("");
  const [expandedJarId, setExpandedJarId] = useState<DestinationJarId | null>(
    null,
  );
  const [interactionAmount, setInteractionAmount] = useState("");
  const [ledger, setLedger] = useState<LedgerEntry[]>([
    {
      id: "ledger-welcome",
      message:
        "Vault online, legend. Deposit income, funnel it into jars, and stack wins like a pro CFO - Finn's watching your moves.",
    },
  ]);
  const [coinFlights, setCoinFlights] = useState<CoinFlight[]>([]);

  const [principalOverride, setPrincipalOverride] = useState("");
  const [yearsSaved, setYearsSaved] = useState(5);
  const [weeklyTopUp, setWeeklyTopUp] = useState(10);
  const [expectedRoi, setExpectedRoi] = useState(DEFAULT_EXPECTED_ROI);
  const [forecastSettingsOpen, setForecastSettingsOpen] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [premiumJarModalOpen, setPremiumJarModalOpen] = useState(false);

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

  const appendLedger = useCallback((message: string, highlight = false) => {
    ledgerCounter.current += 1;
    setLedger((current) => [
      {
        id: `ledger-${ledgerCounter.current}-${createLedgerId()}`,
        message,
        highlight,
      },
      ...current,
    ]);
  }, []);

  function clearInteraction() {
    setExpandedJarId(null);
    setInteractionAmount("");
  }

  function handleToggleJarExpand(jarId: DestinationJarId) {
    setExpandedJarId((current) => {
      if (current === jarId) {
        setInteractionAmount("");
        return null;
      }
      setInteractionAmount("");
      return jarId;
    });
  }

  function handleDepositIncome(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const amount = parsePositiveAmount(incomeInput);
    if (amount === null) return;

    setMoneyToAllocate((current) => current + amount);
    setIncomeInput("");
    appendLedger(
      `Income drop! ${formatCurrency(amount)} landed in Money to Allocate - Finn says funnel it where it counts.`,
    );
  }

  function handleResetUnallocatedPool() {
    if (moneyToAllocate <= 0) return;

    setMoneyToAllocate(0);
    appendLedger(RESET_POOL_LEDGER_MESSAGE);
  }

  function handleConfirmInteraction(
    jarId: DestinationJarId,
    mode: JarInteractionMode,
  ) {
    const amount = parsePositiveAmount(interactionAmount);
    if (amount === null) return;

    const jar = jars.find((entry) => entry.id === jarId);
    if (!jar) return;

    const jarIndex = jars.findIndex((entry) => entry.id === jarId);

    if (mode === "add") {
      if (amount > moneyToAllocate) return;

      setMoneyToAllocate((current) => current - amount);
      setJars((current) =>
        current.map((entry) =>
          entry.id === jarId
            ? { ...entry, balance: entry.balance + amount }
            : entry,
        ),
      );
      triggerCoinBurst("to-jar", jarIndex);
      appendLedger(
        `Boom! ${formatCurrency(amount)} just flew into your ${jar.name} - Future-you is cheering!`,
      );
    } else {
      if (amount > jar.balance) return;

      setJars((current) =>
        current.map((entry) =>
          entry.id === jarId
            ? { ...entry, balance: entry.balance - amount }
            : entry,
        ),
      );
      setMoneyToAllocate((current) => current + amount);
      triggerCoinBurst("to-holding", jarIndex);
      appendLedger(
        `Smart recall - ${formatCurrency(amount)} boomeranged from ${jar.name} back to Money to Allocate. Redeploy when ready.`,
      );
    }

    clearInteraction();
  }

  return (
    <div className="relative mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col space-y-14 overflow-x-hidden bg-white px-2 py-6 pb-10">
      <CoinFlightOverlay flights={coinFlights} />
      <PremiumCustomJarModal
        isOpen={premiumJarModalOpen}
        onClose={() => setPremiumJarModalOpen(false)}
      />

      <section
        aria-labelledby="savings-stats-heading"
        className="w-full shrink-0"
      >
        <DashboardSectionHeading id="savings-stats-heading">
          Your Savings Stats
        </DashboardSectionHeading>
        <div className="mt-5">
          <MotivationScoreboard
            savingsBalance={savingsBalance}
            projectedTotal={projectedTotal}
            yearsSaved={yearsSaved}
            weeklyTopUp={weeklyTopUp}
            expectedRoi={expectedRoi}
            forecastSettingsOpen={forecastSettingsOpen}
            principalOverride={principalOverride}
            highRoiWarningCopy={highRoiWarningCopy}
            onToggleSettings={() => setForecastSettingsOpen((open) => !open)}
            onPrincipalOverrideChange={setPrincipalOverride}
            onYearsSavedChange={setYearsSaved}
            onWeeklyTopUpChange={setWeeklyTopUp}
            onExpectedRoiChange={setExpectedRoi}
          />
        </div>
      </section>

      <section
        aria-labelledby="income-funnel-heading"
        className="w-full space-y-6"
      >
        <div>
          <DashboardSectionHeading id="income-funnel-heading">
            Your Income Funnel
          </DashboardSectionHeading>
          <p className="mt-3 text-center font-sans text-[10px] leading-relaxed text-[#1E3A5F]">
            {vaultCopy.description}
          </p>
        </div>

        <form
          onSubmit={handleDepositIncome}
          className="flex w-full flex-col gap-4"
        >
          <label
            className={cn(
              floatingPanelClass,
              "flex w-full items-center gap-2 px-3 py-2",
            )}
          >
            <span className="font-heading text-sm font-bold text-[#031F82]">
              $
            </span>
            <input
              type="number"
              min={0}
              step={1}
              inputMode="decimal"
              value={incomeInput}
              onChange={(event) => setIncomeInput(event.target.value)}
              placeholder="0"
              className="w-full min-w-0 bg-transparent font-sans text-sm text-[#031F82] outline-none"
              aria-label="Income amount"
            />
          </label>
          <button
            type="submit"
            className={cn("h-touch w-full px-4 shadow-nga-pop", orangeCtaClass)}
          >
            Deposit Income
          </button>
        </form>

        <article
          id={HOLDING_JAR_ID}
          className={cn(floatingPanelClass, "p-4")}
        >
          <div className="flex items-center justify-center gap-3">
            <div className="min-w-0 flex-1 text-center">
              <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#0CC1E0]">
                Money to Allocate
              </p>
              <p className="mt-0.5 font-heading text-xl font-extrabold text-[#031F82] sm:text-2xl">
                {formatCurrency(moneyToAllocate)}
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetUnallocatedPool}
              disabled={moneyToAllocate <= 0}
              aria-label="Reset unallocated income pool"
              className={resetPoolClass}
            >
              Reset
            </button>
          </div>
        </article>

        <div className="grid w-full grid-cols-2 items-start gap-4">
          {jars.map((jar) => (
            <DestinationJarCard
              key={jar.id}
              jar={jar}
              isExpanded={expandedJarId === jar.id}
              interactionAmount={interactionAmount}
              onToggleExpand={handleToggleJarExpand}
              onAmountChange={setInteractionAmount}
              onConfirm={handleConfirmInteraction}
            />
          ))}
          <CustomJarTeaserCard onClick={() => setPremiumJarModalOpen(true)} />
        </div>
      </section>

      <FinnActivityDrawer
        isOpen={ledgerOpen}
        ledger={ledger}
        onToggle={() => setLedgerOpen((open) => !open)}
      />
    </div>
  );
}
