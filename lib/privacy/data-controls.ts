/**
 * Pure rules for who may see or download an account, what a data file
 * contains, and whether the Community leaderboard is on.
 * Callers pass already-loaded rows. This module does not touch the database.
 */

import {
  isTermsAcceptanceEntry,
  TERMS_ACCEPTANCE_TITLE,
} from "@/lib/legal/terms-consent";

export type DataActor =
  | { role: "parent_master"; userId: string; linkedChildIds: readonly string[] }
  | { role: "teacher"; userId: string; seatIds: readonly string[] }
  | { role: "child"; userId: string }
  | { role: "guest" };

export type LeaderboardAudience = "home" | "school" | "guest" | "manager";

const SECRET_KEY =
  /password|pin_hash|passcode|token|secret|class_password/i;

export function authorizeLearnerRead(
  actor: DataActor,
  targetUserId: string,
): boolean {
  const target = targetUserId.trim();
  if (!target) return false;
  if (actor.role === "parent_master") {
    return actor.linkedChildIds.some((id) => id === target);
  }
  if (actor.role === "teacher") {
    return actor.seatIds.some((id) => id === target);
  }
  if (actor.role === "child") return actor.userId === target;
  return false;
}

export function authorizeManagerRead(
  actor: DataActor,
  managerUserId: string,
): boolean {
  const target = managerUserId.trim();
  if (!target) return false;
  if (actor.role === "parent_master" || actor.role === "teacher") {
    return actor.userId === target;
  }
  return false;
}

/** Parent switches a linked child. Teacher switches their own class row. */
export function authorizeLeaderboardWrite(
  actor: DataActor,
  targetProfileId: string,
): boolean {
  const target = targetProfileId.trim();
  if (!target) return false;
  if (actor.role === "parent_master") {
    return actor.linkedChildIds.some((id) => id === target);
  }
  if (actor.role === "teacher") return actor.userId === target;
  return false;
}

/** A missing row is off. Only an explicit true turns the board on. */
export function leaderboardEnabledFromRow(
  row: { enabled?: boolean } | null | undefined,
): boolean {
  return row?.enabled === true;
}

export function resolveLeaderboardView(input: {
  audience: LeaderboardAudience;
  enabled: boolean;
}): { visible: boolean; askButton: boolean } {
  if (
    (input.audience === "home" || input.audience === "school") &&
    input.enabled
  ) {
    return { visible: true, askButton: false };
  }
  if (input.audience === "home") {
    return { visible: false, askButton: true };
  }
  return { visible: false, askButton: false };
}

/** The red teacher-delete button stays disabled until this exact word. */
export function deleteTeacherPhraseAccepted(value: unknown): boolean {
  return value === "DELETE";
}

export function formatStudentLoginSummary(
  usernames: readonly string[],
  visible = 6,
): string {
  const names = usernames.map((name) => name.trim()).filter(Boolean);
  if (names.length === 0) return "";
  const shown = names.slice(0, Math.max(1, visible));
  const rest = names.length - shown.length;
  if (rest > 0) {
    return `${shown.join(", ")} and ${rest} more`;
  }
  if (shown.length === 1) return shown[0] ?? "";
  const last = shown[shown.length - 1];
  return `${shown.slice(0, -1).join(", ")} and ${last}`;
}

export function stripSecrets<T>(value: T): T {
  return stripValue(value) as T;
}

function stripValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => stripValue(item));
  if (!value || typeof value !== "object") return value;
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (SECRET_KEY.test(key)) continue;
    output[key] = stripValue(entry);
  }
  return output;
}

export type LearnerDataFileInput = {
  profile: Record<string, unknown>;
  learnerProgress: unknown;
  usageEvents: unknown[];
  consentRecords: unknown[];
};

/** Stored child rows only. Secrets are removed even if a query selected them. */
export function buildLearnerDataFile(input: LearnerDataFileInput): {
  profile: Record<string, unknown>;
  learnerProgress: unknown;
  usageEvents: unknown[];
  consentRecords: unknown[];
} {
  return {
    profile: stripSecrets(input.profile),
    learnerProgress: stripSecrets(input.learnerProgress),
    usageEvents: stripSecrets(input.usageEvents),
    consentRecords: stripSecrets(input.consentRecords),
  };
}

export type ParentDataFileInput = {
  email: string;
  linkedChildren: readonly {
    userId: string;
    username: string;
    track: string | null;
  }[];
  consentHistory: unknown[];
};

export function buildParentDataFile(input: ParentDataFileInput) {
  return stripSecrets({
    email: input.email,
    linkedChildren: input.linkedChildren.map((child) => ({
      userId: child.userId,
      username: child.username,
      track: child.track,
    })),
    consentHistory: input.consentHistory,
  });
}

export type TeacherDataFileInput = {
  username: string;
  email: string;
  classes: readonly {
    name: string;
    students: readonly { userId: string; username: string }[];
  }[];
  history: unknown[];
};

export function buildTeacherDataFile(input: TeacherDataFileInput) {
  return stripSecrets({
    username: input.username,
    email: input.email,
    classes: input.classes.map((klass) => ({
      name: klass.name,
      studentCount: klass.students.length,
      students: klass.students.map((student) => ({
        userId: student.userId,
        username: student.username,
      })),
    })),
    history: input.history,
  });
}

export type ClassExportRow = {
  username: string;
  track: string;
  lessonsDone: number;
  coins: number;
  lifetimeXp: number;
  bronze: number;
  silver: number;
  gold: number;
  dayStreak: number;
  save: number;
  spend: number;
  give: number;
  emergency: number;
};

const CLASS_CSV_HEADERS = [
  "username",
  "track",
  "lessons_done",
  "coins",
  "lifetime_xp",
  "bronze_medals",
  "silver_medals",
  "gold_medals",
  "day_streak",
  "save",
  "spend",
  "give",
  "emergency",
] as const;

export function buildClassCsv(rows: readonly ClassExportRow[]): string {
  const lines = [CLASS_CSV_HEADERS.join(",")];
  for (const row of rows) {
    lines.push(
      [
        csvCell(row.username),
        csvCell(row.track),
        String(row.lessonsDone),
        String(row.coins),
        String(row.lifetimeXp),
        String(row.bronze),
        String(row.silver),
        String(row.gold),
        String(row.dayStreak),
        String(row.save),
        String(row.spend),
        String(row.give),
        String(row.emergency),
      ].join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

function csvCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export function countStoredMedals(
  skillProgress: Record<string, unknown> | null | undefined,
): { bronze: number; silver: number; gold: number } {
  let bronze = 0;
  let silver = 0;
  let gold = 0;
  for (const tier of Object.values(skillProgress ?? {})) {
    const level =
      tier === "gold" ? 3 : tier === "silver" ? 2 : tier === "bronze" ? 1 : 0;
    if (level >= 1) bronze += 1;
    if (level >= 2) silver += 1;
    if (level >= 3) gold += 1;
  }
  return { bronze, silver, gold };
}

export type HistoryEntry = {
  at: string;
  title: string;
  detail: string;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatHistoryDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function historySummary(entries: readonly HistoryEntry[]): string {
  const latest = [...entries].sort(
    (left, right) => Date.parse(right.at) - Date.parse(left.at),
  )[0];
  if (!latest) return "No entries yet.";
  const when = formatHistoryDate(latest.at);
  return when ? `Latest: ${when}, ${latest.title}` : `Latest: ${latest.title}`;
}

export function buildParentHistory(input: {
  accountCreatedAt: string | null;
  consents: readonly {
    at: string;
    username: string;
    trackLabel: string;
  }[];
  events: readonly HistoryEntry[];
}): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  // Only say the parent agreed when an acceptance was actually recorded
  // (account_history rows written by the Terms tick box).
  const termsAccepted = input.events.some(isTermsAcceptanceEntry);
  const events = input.accountCreatedAt
    ? input.events.filter((event) => !isTermsAcceptanceEntry(event))
    : input.events;
  if (input.accountCreatedAt) {
    entries.push({
      at: input.accountCreatedAt,
      title: "Made a parent account",
      detail: termsAccepted ? TERMS_ACCEPTANCE_TITLE : "",
    });
  }
  for (const consent of input.consents) {
    entries.push({
      at: consent.at,
      title: `Gave consent for ${consent.username}`,
      detail: consent.trackLabel,
    });
  }
  entries.push(...events);
  return entries.sort((left, right) => Date.parse(left.at) - Date.parse(right.at));
}

export function buildTeacherHistory(input: {
  classCreatedAt: string | null;
  className: string | null;
  events: readonly HistoryEntry[];
}): HistoryEntry[] {
  const entries: HistoryEntry[] = [];
  if (input.classCreatedAt && input.className) {
    entries.push({
      at: input.classCreatedAt,
      title: `Made ${input.className}`,
      detail: "",
    });
  }
  entries.push(...input.events);
  return entries.sort((left, right) => Date.parse(left.at) - Date.parse(right.at));
}

type ActivitySource = {
  at: string;
  emoji: string;
  title: string;
  detail: string;
};

export function buildRecentActivity(input: {
  usageEvents: readonly {
    createdAt: string;
    eventType: string;
    lessonNumber?: number | null;
    metadata?: { skill?: string; tier?: string } | null;
  }[];
  walletSpends: readonly { at: string; points: number }[];
  vaultMoves: readonly { at: string; title: string }[];
  now: Date;
  limit?: number;
}): { emoji: string; title: string; detail: string; when: string }[] {
  const items: ActivitySource[] = [];
  for (const event of input.usageEvents) {
    if (event.eventType === "lesson_completed") {
      items.push({
        at: event.createdAt,
        emoji: "🎓",
        title: "Finished a lesson",
        detail: event.metadata?.skill?.trim() || lessonDetail(event.lessonNumber),
      });
    } else if (event.eventType === "medal_earned") {
      items.push({
        at: event.createdAt,
        emoji: medalEmoji(event.metadata?.tier),
        title: medalTitle(event.metadata?.tier),
        detail: event.metadata?.skill?.trim() || "Medal",
      });
    }
  }
  for (const spend of input.walletSpends) {
    items.push({
      at: spend.at,
      emoji: "🪙",
      title: `Cashed in ${spend.points} coins`,
      detail: "Went to Cash in the Vault",
    });
  }
  for (const move of input.vaultMoves) {
    items.push({
      at: move.at,
      emoji: "🏦",
      title: move.title,
      detail: "Vault",
    });
  }
  return items
    .filter((item) => Number.isFinite(Date.parse(item.at)))
    .sort((left, right) => Date.parse(right.at) - Date.parse(left.at))
    .slice(0, input.limit ?? 4)
    .map((item) => ({
      emoji: item.emoji,
      title: item.title,
      detail: item.detail,
      when: formatActivityWhen(item.at, input.now),
    }));
}

function lessonDetail(lessonNumber: number | null | undefined): string {
  if (typeof lessonNumber === "number" && lessonNumber > 0) {
    return `Lesson ${lessonNumber}`;
  }
  return "Academy";
}

function medalTitle(tier: string | undefined): string {
  if (tier === "gold") return "Gold medal";
  if (tier === "silver") return "Silver medal";
  return "Bronze medal";
}

function medalEmoji(tier: string | undefined): string {
  if (tier === "gold") return "🥇";
  if (tier === "silver") return "🥈";
  return "🥉";
}

export function formatActivityWhen(iso: string, now: Date): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const day = startOfLocalDay(date).getTime();
  const today = startOfLocalDay(now).getTime();
  const diff = Math.round((today - day) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const JAR_ORDER = [
  { id: "save-jar", name: "Save", emoji: "🏦" },
  { id: "spend-jar", name: "Spend", emoji: "🛒" },
  { id: "give-jar", name: "Give", emoji: "🎁" },
  { id: "emergencies-jar", name: "Emergency", emoji: "🚨" },
] as const;

export type LearnerDataView = {
  userId: string;
  username: string;
  trackLabel: string | null;
  accountLine: string | null;
  linkedParentEmail: string | null;
  lessonsDone: number;
  dayStreak: number;
  bestStreak: number;
  coins: number;
  lifetimeXp: number;
  medals: { bronze: number; silver: number; gold: number };
  jars: { name: string; emoji: string; amount: number }[];
  goals: { name: string; emoji: string; balance: number; target: number }[];
  activity: { emoji: string; title: string; detail: string; when: string }[];
  leaderboardEnabled: boolean;
};

export function assembleLearnerView(input: {
  userId: string;
  username: string;
  trackLabel: string | null;
  accountLine?: string | null;
  linkedParentEmail?: string | null;
  progress: unknown;
  bestStreakFromEvents?: number;
  activity: LearnerDataView["activity"];
  leaderboardEnabled: boolean;
}): LearnerDataView {
  const progress = asRecord(input.progress) ?? {};
  const wallet = asRecord(progress.wallet);
  const academy = Array.isArray(progress.academyProgress)
    ? progress.academyProgress
    : [];
  const lessonsDone = academy.filter((node) => {
    const record = asRecord(node);
    return record?.status === "completed";
  }).length;
  const vault = asRecord(progress.vaultProfile) ?? asRecord(progress.vaultSession);
  const jarBalances = asRecord(vault?.jarBalances) ?? {};
  const goalsRaw = Array.isArray(vault?.savingsGoals) ? vault.savingsGoals : [];
  const dayStreak = finiteCount(progress.dayStreak);
  const storedBest = finiteCount(progress.bestStreak);
  const bestStreak = Math.max(
    dayStreak,
    storedBest,
    finiteCount(input.bestStreakFromEvents),
  );

  return {
    userId: input.userId,
    username: input.username,
    trackLabel: input.trackLabel,
    accountLine: input.accountLine ?? null,
    linkedParentEmail: input.linkedParentEmail ?? null,
    lessonsDone,
    dayStreak,
    bestStreak,
    coins: finiteCount(wallet?.totalPoints),
    lifetimeXp: finiteCount(wallet?.lifetimePointsEarned),
    medals: countStoredMedals(
      asRecord(progress.skillProgress) as Record<string, unknown> | null,
    ),
    jars: JAR_ORDER.map((jar) => ({
      name: jar.name,
      emoji: jar.emoji,
      amount: finiteAmount(jarBalances[jar.id]),
    })),
    goals: goalsRaw
      .map((goal) => {
        const record = asRecord(goal);
        if (!record) return null;
        const name = typeof record.name === "string" ? record.name.trim() : "";
        if (!name) return null;
        return {
          name,
          emoji: typeof record.emoji === "string" ? record.emoji : "⭐",
          balance: finiteAmount(record.balance),
          target: finiteAmount(record.targetAmount),
        };
      })
      .filter((goal): goal is NonNullable<typeof goal> => goal !== null),
    activity: input.activity,
    leaderboardEnabled: input.leaderboardEnabled,
  };
}

export function classExportRowFromProgress(input: {
  username: string;
  track: string;
  progress: unknown;
}): ClassExportRow {
  const view = assembleLearnerView({
    userId: input.username,
    username: input.username,
    trackLabel: input.track,
    progress: input.progress,
    activity: [],
    leaderboardEnabled: false,
  });
  return {
    username: input.username,
    track: input.track,
    lessonsDone: view.lessonsDone,
    coins: view.coins,
    lifetimeXp: view.lifetimeXp,
    bronze: view.medals.bronze,
    silver: view.medals.silver,
    gold: view.medals.gold,
    dayStreak: view.dayStreak,
    save: view.jars.find((jar) => jar.name === "Save")?.amount ?? 0,
    spend: view.jars.find((jar) => jar.name === "Spend")?.amount ?? 0,
    give: view.jars.find((jar) => jar.name === "Give")?.amount ?? 0,
    emergency: view.jars.find((jar) => jar.name === "Emergency")?.amount ?? 0,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function finiteCount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.floor(parsed);
}

function finiteAmount(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.round(parsed * 100) / 100;
}
