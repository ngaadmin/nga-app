"use server";

import "server-only";

import { cookies } from "next/headers";

import { lessonTitleFor } from "@/lib/academy/lessons/payload/lesson-titles";
import {
  masteryCohortAgeRangeLabel,
  masteryCohortLabel,
  type MasteryCohort,
} from "@/lib/dashboard/mastery-cohort";
import { listLinkedChildrenForCurrentParent } from "@/lib/onboarding/list-linked-children";
import { readLearnerProgressPayloads } from "@/lib/onboarding/learner-progress-store";
import { deleteUsageEventsForUsername } from "@/lib/privacy/delete-usage-events";
import { deleteTeacherAccount } from "@/lib/privacy/delete-teacher-account";
import {
  PARENT_DATA_GRANT_COOKIE,
  readParentDataGrant,
} from "@/lib/privacy/parent-data-grant";
import {
  assembleLearnerView,
  authorizeLeaderboardWrite,
  authorizeLearnerRead,
  authorizeManagerRead,
  buildClassCsv,
  buildLearnerDataFile,
  buildParentDataFile,
  buildParentHistory,
  buildRecentActivity,
  buildTeacherDataFile,
  buildTeacherHistory,
  classExportRowFromProgress,
  historySummary,
  leaderboardEnabledFromRow,
  type ClassExportRow,
  type DataActor,
  type HistoryEntry,
  type LeaderboardAudience,
  type LearnerDataView,
} from "@/lib/privacy/data-controls";
import { resolveExchangeRateCents } from "@/lib/dashboard/xp-cash";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { parentTabGatePassValid } from "@/lib/parent/parent-tab-gate-pass";

type Admin = ReturnType<typeof createAdminClient>;

type Fail = { ok: false; error: string };

const PUBLIC_PROFILE =
  "id, username, account_role, account_status, curriculum_cohort, class_cohort, teacher_id, is_teacher, seat_cap, created_at, updated_at, consent_approved_at, marketing_opt_in";

function trackLabel(cohort: string | null | undefined): string | null {
  if (cohort !== "explorer" && cohort !== "pathfinder" && cohort !== "maverick") {
    return null;
  }
  // Non-breaking space and hyphen keep "Ages 10-13" on one line.
  return `${masteryCohortLabel(cohort)} · Ages\u00A0${masteryCohortAgeRangeLabel(cohort).replace("-", "\u2011")}`;
}

function trackName(cohort: string | null | undefined): string | null {
  if (cohort !== "explorer" && cohort !== "pathfinder" && cohort !== "maverick") {
    return null;
  }
  return masteryCohortLabel(cohort);
}

function asCohort(value: unknown): MasteryCohort | null {
  return value === "explorer" || value === "pathfinder" || value === "maverick"
    ? value
    : null;
}

async function signedInUser(): Promise<{ id: string } | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user ? { id: data.user.id } : null;
  } catch {
    return null;
  }
}

function openAdmin(): { ok: true; admin: Admin } | Fail {
  try {
    return { ok: true, admin: createAdminClient() };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not load data.",
    };
  }
}

async function grantMatches(userId: string): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PARENT_DATA_GRANT_COOKIE)?.value;
  const grant = readParentDataGrant(token);
  return grant?.userId === userId;
}

async function parentActor(
  admin: Admin,
  parentId: string,
): Promise<{ ok: true; actor: DataActor; email: string } | Fail> {
  const { data: profile } = await admin
    .from("profiles")
    .select("account_role")
    .eq("id", parentId)
    .maybeSingle();
  if (profile?.account_role !== "parent_master") {
    return { ok: false, error: "Sign in as a parent to see this." };
  }
  const listed = await listLinkedChildrenForCurrentParent();
  if (!listed.ok) return { ok: false, error: listed.error };
  const email = await accountEmail(admin, parentId);
  return {
    ok: true,
    email,
    actor: {
      role: "parent_master",
      userId: parentId,
      linkedChildIds: listed.children.map((child) => child.userId),
    },
  };
}

async function accountEmail(admin: Admin, userId: string): Promise<string> {
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user?.email?.trim() ?? "";
}

async function readPref(admin: Admin, profileId: string): Promise<boolean> {
  const { data } = await admin
    .from("leaderboard_prefs")
    .select("enabled")
    .eq("profile_id", profileId)
    .maybeSingle();
  return leaderboardEnabledFromRow(data);
}

async function usageRows(admin: Admin, username: string) {
  const safe = username.replace(/[%_]/g, "").trim();
  if (!safe) return [];
  const { data } = await admin
    .from("usage_events")
    .select(
      "id, created_at, username, class_id, event_type, lesson_number, xp_total, streak_days, metadata",
    )
    .ilike("username", safe)
    .order("created_at", { ascending: false })
    .limit(1000);
  return data ?? [];
}

async function consentRows(
  admin: Admin,
  column: "child_id" | "parent_id",
  id: string,
) {
  const { data } = await admin
    .from("consent_requests")
    .select("id, kind, status, child_id, parent_email, parent_id, created_at, approved_at, expires_at")
    .eq(column, id)
    .order("created_at", { ascending: true });
  return data ?? [];
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function activityFor(payload: unknown, events: readonly Record<string, unknown>[]) {
  const progress = asRecord(payload) ?? {};
  const wallet = asRecord(progress.wallet);
  const spends = Array.isArray(wallet?.ledger) ? wallet.ledger : [];
  const vault = asRecord(progress.vaultProfile) ?? asRecord(progress.vaultSession);
  const moves = Array.isArray(vault?.ledger) ? vault.ledger : [];
  return buildRecentActivity({
    now: new Date(),
    lessonTitle: lessonTitleFor,
    usageEvents: events.map((event) => {
      const metadata = asRecord(event.metadata);
      return {
        createdAt: text(event.created_at),
        eventType: text(event.event_type),
        lessonNumber:
          typeof event.lesson_number === "number" ? event.lesson_number : null,
        metadata: metadata
          ? {
              skill: text(metadata.skill),
              tier: text(metadata.tier),
            }
          : null,
      };
    }),
    walletSpends: spends
      .map((entry) => {
        const record = asRecord(entry);
        if (!record || record.kind !== "spend") return null;
        const points = typeof record.points === "number" ? record.points : 0;
        const at = text(record.at);
        if (!at || points <= 0) return null;
        return { at, points };
      })
      .filter((entry): entry is { at: string; points: number } => entry !== null),
    vaultMoves: moves
      .map((entry) => {
        const record = asRecord(entry);
        if (!record) return null;
        if (record.category !== "allocation" && record.category !== "transfer") {
          return null;
        }
        const title = text(record.message);
        const timestamp = typeof record.timestamp === "number" ? record.timestamp : 0;
        if (!title || !timestamp) return null;
        return { at: new Date(timestamp).toISOString(), title };
      })
      .filter((entry): entry is { at: string; title: string } => entry !== null),
  });
}

function bestStreakFrom(events: readonly Record<string, unknown>[]): number {
  let best = 0;
  for (const event of events) {
    const value = typeof event.streak_days === "number" ? event.streak_days : 0;
    if (value > best) best = value;
  }
  return best;
}

async function viewForChild(
  admin: Admin,
  childId: string,
  username: string,
  cohort: string | null,
  extras: {
    accountLine?: string | null;
    linkedParentEmail?: string | null;
    /** Parent Hub child page: no recent activity is shown, so skip building it. */
    slim?: boolean;
  },
): Promise<LearnerDataView> {
  const payloads = await readLearnerProgressPayloads([childId]);
  const payload = payloads.get(childId) ?? {};
  const events = (await usageRows(admin, username)) as Record<string, unknown>[];
  const view = assembleLearnerView({
    userId: childId,
    username,
    trackLabel: trackLabel(cohort),
    accountLine: extras.accountLine,
    linkedParentEmail: extras.linkedParentEmail,
    progress: payload,
    bestStreakFromEvents: bestStreakFrom(events),
    activity: extras.slim ? [] : activityFor(payload, events),
    leaderboardEnabled: await readPref(admin, childId),
  });
  if (!extras.slim) return view;
  const wallet = (payload as { wallet?: Parameters<typeof resolveExchangeRateCents>[0] }).wallet;
  return { ...view, cashRateCentsPer100Coins: resolveExchangeRateCents(wallet) };
}

export async function parentDataGrantActive(): Promise<boolean> {
  const user = await signedInUser();
  if (!user) return false;
  return grantMatches(user.id);
}

/**
 * A linked child's progress for the Parent Hub (lessons, streak, coins,
 * medals, Vault and recent activity). Read only. Needs the Parent Hub gate
 * pass from this visit, checked here on the server, so the Hub never asks
 * for a second PIN.
 */
export async function loadParentHubChildProgress(
  pass: string,
  childId: string,
): Promise<{ ok: true; view: LearnerDataView } | Fail> {
  const user = await signedInUser();
  if (!user) return { ok: false, error: "Sign in as a parent to see this." };
  if (typeof pass !== "string" || !parentTabGatePassValid(pass, user.id)) {
    return { ok: false, error: "Enter your parent PIN first." };
  }
  const opened = openAdmin();
  if (!opened.ok) return opened;
  const actorResult = await parentActor(opened.admin, user.id);
  if (!actorResult.ok) return actorResult;
  const listed = await listLinkedChildrenForCurrentParent();
  if (!listed.ok) return listed;
  const match = listed.children.find(
    (child) => child.userId === String(childId ?? "").trim(),
  );
  if (!match || !authorizeLearnerRead(actorResult.actor, match.userId)) {
    return { ok: false, error: "That learner is not linked to this parent account." };
  }
  if (match.accountStatus === "pending_consent") {
    // No consent yet: no progress leaves the server.
    return { ok: false, error: "Approve this account first to see progress." };
  }
  const view = await viewForChild(
    opened.admin,
    match.userId,
    match.username,
    match.curriculumCohort ?? null,
    { slim: true },
  );
  return { ok: true, view };
}

export async function loadParentOwnRecord(): Promise<
  | {
      ok: true;
      email: string;
      children: {
        userId: string;
        username: string;
        trackLabel: string | null;
        cohort: MasteryCohort | null;
      }[];
      history: HistoryEntry[];
      historyTitle: string;
      historySummary: string;
    }
  | Fail
> {
  const user = await signedInUser();
  if (!user) return { ok: false, error: "Sign in as a parent to see this." };
  if (!(await grantMatches(user.id))) {
    return { ok: false, error: "Enter your parent PIN first." };
  }
  const opened = openAdmin();
  if (!opened.ok) return opened;
  const actorResult = await parentActor(opened.admin, user.id);
  if (!actorResult.ok) return actorResult;
  if (!authorizeManagerRead(actorResult.actor, user.id)) {
    return { ok: false, error: "Sign in as a parent to see this." };
  }
  const listed = await listLinkedChildrenForCurrentParent();
  if (!listed.ok) return listed;
  const { data: profile } = await opened.admin
    .from("profiles")
    .select("created_at")
    .eq("id", user.id)
    .maybeSingle();
  const consents = await consentRows(opened.admin, "parent_id", user.id);
  const events = await historyRows(opened.admin, user.id);
  const history = buildParentHistory({
    accountCreatedAt: text(profile?.created_at) || null,
    consents: consents
      .filter((row) => row.status === "approved")
      .map((row) => {
        const child = listed.children.find((item) => item.userId === row.child_id);
        return {
          at: text(row.approved_at) || text(row.created_at),
          username: child?.username || "a child",
          trackLabel: trackLabel(child?.curriculumCohort) || "Learner",
        };
      })
      .filter((row) => row.at),
    events,
  });
  return {
    ok: true,
    email: actorResult.email,
    children: listed.children.map((child) => ({
      userId: child.userId,
      username: child.username,
      trackLabel: trackLabel(child.curriculumCohort),
      cohort: asCohort(child.curriculumCohort),
    })),
    history,
    historyTitle: `Consent history · ${history.length} ${history.length === 1 ? "entry" : "entries"}`,
    historySummary: historySummary(history),
  };
}

async function historyRows(admin: Admin, profileId: string): Promise<HistoryEntry[]> {
  const { data } = await admin
    .from("account_history")
    .select("occurred_at, title, detail")
    .eq("profile_id", profileId)
    .order("occurred_at", { ascending: true });
  return (data ?? [])
    .map((row) => ({
      at: text(row.occurred_at),
      title: text(row.title),
      detail: text(row.detail),
    }))
    .filter((row) => row.at && row.title);
}

export async function loadTeacherStudent(username: string): Promise<
  | { ok: true; view: LearnerDataView; className: string }
  | Fail
> {
  const user = await signedInUser();
  if (!user) return { ok: false, error: "Sign in as a teacher to see this." };
  const opened = openAdmin();
  if (!opened.ok) return opened;
  const { data: teacher } = await opened.admin
    .from("profiles")
    .select("is_teacher, account_status, class_cohort")
    .eq("id", user.id)
    .maybeSingle();
  if (teacher?.is_teacher !== true || teacher.account_status !== "active") {
    return { ok: false, error: "Sign in as a teacher to see this." };
  }
  const safe = username.replace(/[%_]/g, "").trim();
  const { data: seats } = await opened.admin
    .from("profiles")
    .select(PUBLIC_PROFILE)
    .eq("teacher_id", user.id)
    .ilike("username", safe);
  const seat = (seats ?? []).find(
    (row) => text(row.username).toLowerCase() === safe.toLowerCase(),
  );
  if (!seat || !authorizeLearnerRead(
    { role: "teacher", userId: user.id, seatIds: [text(seat.id)] },
    text(seat.id),
  )) {
    return { ok: false, error: "That student is not in this class." };
  }
  const cohort = asCohort(seat.curriculum_cohort) ?? asCohort(teacher.class_cohort);
  const classTitle = cohort ? `${masteryCohortLabel(cohort)} class` : "class";
  const view = await viewForChild(opened.admin, text(seat.id), text(seat.username), cohort, {
    accountLine: `School seat in ${classTitle} (no parent linked)`,
    linkedParentEmail: null,
  });
  return { ok: true, view, className: classTitle };
}

export async function loadTeacherOwnRecord(): Promise<
  | {
      ok: true;
      username: string;
      email: string;
      classLabel: string;
      studentCount: number;
      students: { userId: string; username: string }[];
      history: HistoryEntry[];
      historyTitle: string;
      historySummary: string;
      studentSummary: string;
    }
  | Fail
> {
  const user = await signedInUser();
  if (!user) return { ok: false, error: "Sign in as a teacher to see this." };
  const opened = openAdmin();
  if (!opened.ok) return opened;
  const { data: teacher } = await opened.admin
    .from("profiles")
    .select("username, is_teacher, account_status, class_cohort, created_at")
    .eq("id", user.id)
    .maybeSingle();
  if (teacher?.is_teacher !== true) {
    return { ok: false, error: "Sign in as a teacher to see this." };
  }
  if (
    !authorizeManagerRead(
      { role: "teacher", userId: user.id, seatIds: [] },
      user.id,
    )
  ) {
    return { ok: false, error: "Sign in as a teacher to see this." };
  }
  const { data: seats } = await opened.admin
    .from("profiles")
    .select("id, username")
    .eq("teacher_id", user.id)
    .eq("account_role", "child")
    .order("username");
  const students = (seats ?? [])
    .map((seat) => ({ userId: text(seat.id), username: text(seat.username) }))
    .filter((seat) => seat.userId && seat.username);
  const cohort = asCohort(teacher.class_cohort);
  const classLabel = cohort ? `${masteryCohortLabel(cohort)} class` : "Class";
  const events = await historyRows(opened.admin, user.id);
  const history = buildTeacherHistory({
    classCreatedAt: text(teacher.created_at) || null,
    className: cohort ? `${masteryCohortLabel(cohort)} class` : null,
    events,
  });
  return {
    ok: true,
    username: text(teacher.username),
    email: await accountEmail(opened.admin, user.id),
    classLabel,
    studentCount: students.length,
    students,
    history,
    historyTitle: `History · ${history.length} ${history.length === 1 ? "entry" : "entries"}`,
    historySummary: historySummary(history),
    studentSummary: students.map((seat) => seat.username).join(", "),
  };
}

export async function loadMyInfo(): Promise<
  | {
      ok: true;
      userId: string;
      username: string;
      trackLabel: string | null;
      cohort: "explorer" | "pathfinder" | "maverick" | null;
      managedBy: "teacher" | "account_manager";
    }
  | Fail
> {
  const user = await signedInUser();
  if (!user) return { ok: false, error: "Sign in to see your info." };
  const opened = openAdmin();
  if (!opened.ok) return opened;
  const { data: profile } = await opened.admin
    .from("profiles")
    .select("id, username, account_role, curriculum_cohort, teacher_id, is_teacher")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile || profile.account_role !== "child" || profile.is_teacher === true) {
    return { ok: false, error: "This page is for a learner account." };
  }
  if (
    !authorizeLearnerRead({ role: "child", userId: user.id }, text(profile.id))
  ) {
    return { ok: false, error: "This page is for a learner account." };
  }
  return {
    ok: true,
    userId: user.id,
    username: text(profile.username),
    trackLabel: trackLabel(text(profile.curriculum_cohort)),
    cohort: asCohort(profile.curriculum_cohort),
    managedBy: text(profile.teacher_id) ? "teacher" : "account_manager",
  };
}

export async function loadLeaderboardAccess(): Promise<{
  audience: LeaderboardAudience;
  enabled: boolean;
}> {
  try {
    const user = await signedInUser();
    if (!user) return { audience: "guest", enabled: false };
    const opened = openAdmin();
    if (!opened.ok) return { audience: "guest", enabled: false };
    const { data: profile } = await opened.admin
      .from("profiles")
      .select("account_role, is_teacher, teacher_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile) return { audience: "guest", enabled: false };
    if (
      profile.account_role === "parent_master" ||
      profile.account_role === "teacher" ||
      profile.is_teacher === true
    ) {
      return { audience: "manager", enabled: false };
    }
    const teacherId = text(profile.teacher_id);
    if (teacherId) {
      return { audience: "school", enabled: await readPref(opened.admin, teacherId) };
    }
    return { audience: "home", enabled: await readPref(opened.admin, user.id) };
  } catch {
    return { audience: "guest", enabled: false };
  }
}

export async function loadClassLeaderboard(): Promise<{ enabled: boolean }> {
  const user = await signedInUser();
  if (!user) return { enabled: false };
  const opened = openAdmin();
  if (!opened.ok) return { enabled: false };
  const { data: profile } = await opened.admin
    .from("profiles")
    .select("is_teacher")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_teacher !== true) return { enabled: false };
  return { enabled: await readPref(opened.admin, user.id) };
}

export async function setChildLeaderboard(
  childId: string,
  enabled: boolean,
): Promise<{ ok: true } | Fail> {
  const user = await signedInUser();
  if (!user) return { ok: false, error: "Sign in as a parent to change this." };
  if (!(await grantMatches(user.id))) {
    return { ok: false, error: "Enter your parent PIN first." };
  }
  const opened = openAdmin();
  if (!opened.ok) return opened;
  const actorResult = await parentActor(opened.admin, user.id);
  if (!actorResult.ok) return actorResult;
  if (!authorizeLeaderboardWrite(actorResult.actor, childId)) {
    return { ok: false, error: "That learner is not linked to this parent account." };
  }
  const { data: child } = await opened.admin
    .from("profiles")
    .select("username")
    .eq("id", childId)
    .maybeSingle();
  const saved = await writePref(opened.admin, childId, enabled);
  if (!saved.ok) return saved;
  await opened.admin.from("account_history").insert({
    profile_id: user.id,
    title: enabled ? "Leaderboard switched on" : "Leaderboard kept off",
    detail: `For ${text(child?.username) || "a child"}`,
  });
  return { ok: true };
}

export async function setClassLeaderboard(
  enabled: boolean,
): Promise<{ ok: true } | Fail> {
  const user = await signedInUser();
  if (!user) return { ok: false, error: "Sign in as a teacher to change this." };
  const opened = openAdmin();
  if (!opened.ok) return opened;
  const { data: profile } = await opened.admin
    .from("profiles")
    .select("is_teacher, account_status")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_teacher !== true || profile.account_status !== "active") {
    return { ok: false, error: "Sign in as a teacher to change this." };
  }
  const actor: DataActor = { role: "teacher", userId: user.id, seatIds: [] };
  if (!authorizeLeaderboardWrite(actor, user.id)) {
    return { ok: false, error: "Sign in as a teacher to change this." };
  }
  const saved = await writePref(opened.admin, user.id, enabled);
  if (!saved.ok) return saved;
  await opened.admin.from("account_history").insert({
    profile_id: user.id,
    title: enabled ? "Leaderboard switched on" : "Leaderboard kept off",
    detail: "For this class",
  });
  return { ok: true };
}

async function writePref(
  admin: Admin,
  profileId: string,
  enabled: boolean,
): Promise<{ ok: true } | Fail> {
  const { error } = await admin.from("leaderboard_prefs").upsert({
    profile_id: profileId,
    enabled,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: "Could not save that switch. Try again." };
  return { ok: true };
}

export async function buildChildDownload(childId: string): Promise<
  | { ok: true; filename: string; body: string; contentType: string }
  | Fail
> {
  const user = await signedInUser();
  if (!user) return { ok: false, error: "Sign in as a parent to download this." };
  if (!(await grantMatches(user.id))) {
    return { ok: false, error: "Enter your parent PIN first." };
  }
  const opened = openAdmin();
  if (!opened.ok) return opened;
  const actorResult = await parentActor(opened.admin, user.id);
  if (!actorResult.ok) return actorResult;
  if (!authorizeLearnerRead(actorResult.actor, childId)) {
    return { ok: false, error: "That learner is not linked to this parent account." };
  }
  const file = await learnerFile(opened.admin, childId);
  if (!file.ok) return file;
  return {
    ok: true,
    filename: `${file.username}-data.json`,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(file.data, null, 2),
  };
}

export async function buildTeacherStudentDownload(username: string): Promise<
  | { ok: true; filename: string; body: string; contentType: string }
  | Fail
> {
  const loaded = await loadTeacherStudent(username);
  if (!loaded.ok) return loaded;
  const opened = openAdmin();
  if (!opened.ok) return opened;
  const file = await learnerFile(opened.admin, loaded.view.userId);
  if (!file.ok) return file;
  return {
    ok: true,
    filename: `${file.username}-data.json`,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(file.data, null, 2),
  };
}

async function learnerFile(
  admin: Admin,
  childId: string,
): Promise<{ ok: true; username: string; data: unknown } | Fail> {
  const { data: profile, error } = await admin
    .from("profiles")
    .select(PUBLIC_PROFILE)
    .eq("id", childId)
    .maybeSingle();
  if (error || !profile) return { ok: false, error: "Could not download that data. Try again." };
  const username = text(profile.username) || "learner";
  const payloads = await readLearnerProgressPayloads([childId]);
  const events = await usageRows(admin, username);
  const consents = await consentRows(admin, "child_id", childId);
  return {
    ok: true,
    username,
    data: buildLearnerDataFile({
      profile: profile as unknown as Record<string, unknown>,
      learnerProgress: payloads.get(childId) ?? {},
      usageEvents: events,
      consentRecords: consents,
    }),
  };
}

export async function buildParentDownload(): Promise<
  | { ok: true; filename: string; body: string; contentType: string }
  | Fail
> {
  const record = await loadParentOwnRecord();
  if (!record.ok) return record;
  const data = buildParentDataFile({
    email: record.email,
    linkedChildren: record.children.map((child) => ({
      userId: child.userId,
      username: child.username,
      track: child.trackLabel,
    })),
    consentHistory: record.history,
  });
  return {
    ok: true,
    filename: "my-data.json",
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(data, null, 2),
  };
}

export async function buildTeacherDownload(): Promise<
  | { ok: true; filename: string; body: string; contentType: string }
  | Fail
> {
  const record = await loadTeacherOwnRecord();
  if (!record.ok) return record;
  const data = buildTeacherDataFile({
    username: record.username,
    email: record.email,
    classes: [
      {
        name: record.classLabel,
        students: record.students,
      },
    ],
    history: record.history,
  });
  return {
    ok: true,
    filename: "my-data.json",
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(data, null, 2),
  };
}

export async function buildClassDownload(): Promise<
  | { ok: true; filename: string; body: string; contentType: string }
  | Fail
> {
  const user = await signedInUser();
  if (!user) return { ok: false, error: "Sign in as a teacher to export this class." };
  const opened = openAdmin();
  if (!opened.ok) return opened;
  const { data: teacher } = await opened.admin
    .from("profiles")
    .select("is_teacher, account_status, class_cohort")
    .eq("id", user.id)
    .maybeSingle();
  if (teacher?.is_teacher !== true || teacher.account_status !== "active") {
    return { ok: false, error: "Sign in as a teacher to export this class." };
  }
  const { data: seats } = await opened.admin
    .from("profiles")
    .select("id, username, curriculum_cohort, account_role")
    .eq("teacher_id", user.id)
    .eq("account_role", "child");
  const rows = seats ?? [];
  const actor: DataActor = {
    role: "teacher",
    userId: user.id,
    seatIds: rows.map((seat) => text(seat.id)).filter(Boolean),
  };
  const allowed = rows.filter((seat) => authorizeLearnerRead(actor, text(seat.id)));
  const payloads = await readLearnerProgressPayloads(allowed.map((seat) => text(seat.id)));
  const cohort = asCohort(teacher.class_cohort);
  const exportRows: ClassExportRow[] = allowed
    .map((seat) =>
      classExportRowFromProgress({
        username: text(seat.username),
        track: trackName(text(seat.curriculum_cohort)) || (cohort ? masteryCohortLabel(cohort) : ""),
        progress: payloads.get(text(seat.id)) ?? {},
      }),
    )
    .sort((left, right) => left.username.localeCompare(right.username));
  return {
    ok: true,
    filename: "class-data.csv",
    contentType: "text/csv; charset=utf-8",
    body: buildClassCsv(exportRows),
  };
}

export async function deleteTeacherWithPhrase(
  phrase: string,
): Promise<{ ok: true } | Fail> {
  const user = await signedInUser();
  if (!user) return { ok: false, error: "Sign in as a teacher to delete this account." };
  const opened = openAdmin();
  if (!opened.ok) return opened;
  const { data: profile } = await opened.admin
    .from("profiles")
    .select("is_teacher, account_status")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.is_teacher !== true || profile.account_status !== "active") {
    return { ok: false, error: "Only a confirmed teacher can delete this account." };
  }
  const admin = opened.admin;
  const result = await deleteTeacherAccount(
    {
      async loadTeacher(teacherId) {
        const { data } = await admin
          .from("profiles")
          .select("username")
          .eq("id", teacherId)
          .maybeSingle();
        const username = text(data?.username);
        if (!username) return { ok: false, error: "Could not find this teacher account." };
        return { ok: true, username };
      },
      async listOwnedSeats(ownerId) {
        const { data, error } = await admin
          .from("profiles")
          .select("id, username, account_role")
          .eq("teacher_id", ownerId)
          .eq("is_teacher", false);
        if (error) return { ok: false, error: "Could not load this class. Try again." };
        return {
          ok: true,
          seats: (data ?? [])
            .filter((row) => text(row.id) && text(row.username))
            .map((row) => ({
              id: text(row.id),
              username: text(row.username),
              accountRole: text(row.account_role),
            })),
        };
      },
      async deleteProgress(userId) {
        const { error } = await admin.from("learner_progress").delete().eq("user_id", userId);
        if (error) return { ok: false, error: error.message };
        return { ok: true };
      },
      async deleteUsageEvents(username) {
        return deleteUsageEventsForUsername(admin, username);
      },
      async deleteAuthUser(userId) {
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error && !/not found|does not exist/i.test(error.message ?? "")) {
          return { ok: false, error: error.message };
        }
        return { ok: true };
      },
      async deleteTeacherUsage(username) {
        return deleteUsageEventsForUsername(admin, username);
      },
      async deleteTeacherAuth(teacherId) {
        const { error } = await admin.auth.admin.deleteUser(teacherId);
        if (error && !/not found|does not exist/i.test(error.message ?? "")) {
          return { ok: false, error: error.message };
        }
        const { data } = await admin.auth.admin.getUserById(teacherId);
        if (data.user) return { ok: false, error: "still there" };
        return { ok: true };
      },
    },
    user.id,
    phrase,
  );
  if (!result.ok) return { ok: false, error: result.error };
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // The login is already gone. The browser still clears its local session.
  }
  return { ok: true };
}
