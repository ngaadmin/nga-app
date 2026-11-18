import type { LaunchpadFloor } from "@/lib/launchpad/content/types";
import { launchpadLearnerSaveEnabled } from "@/lib/launchpad/learner-db/flag";
import { mergeLaunchpadLearnerSnapshot, type LaunchpadLearnerSnapshot } from "@/lib/launchpad/learner-db/merge";
import {
  answerRowsForSave,
  isMissingProgressColumn,
  remoteSnapshotFromStore,
  ventureRowForSave,
  ventureRowWithoutFullProgress,
  type LearnerAnswerWrite,
  type LearnerVentureWrite,
  type StoredAnswerRow,
  type StoredVentureProgress,
} from "@/lib/launchpad/learner-db/rows";
import { readUserSession, type AccountRole } from "@/lib/onboarding/guest-session";
import {
  hasSeenVentureTestOnboarding,
  loadVentureTestProgress,
  saveVentureTestProgress,
} from "@/lib/launchpad/venture-test/venture-test-storage";
import type { VentureTestProgress } from "@/lib/launchpad/venture-test/venture-test-progress";

const STAMP_PREFIX = "lp-venture-test:v1:";
const SAVE_DELAY_MS = 500;
const RETRY_DELAY_MS = 8000;

export type LearnerVentureRecord = StoredVentureProgress & {
  content_version_id: string | null;
  current_level: number;
  current_silver_id: string | null;
};

export type LaunchpadLearnerGateway = {
  userId(): Promise<string | null>;
  readVenture(ventureId: string): Promise<{ row: LearnerVentureRecord | null; error: string | null }>;
  readAnswers(learnerVentureId: string): Promise<{ rows: StoredAnswerRow[]; error: string | null }>;
  upsertVenture(row: LearnerVentureWrite): Promise<{ id: string | null; error: string | null }>;
  upsertAnswers(rows: LearnerAnswerWrite[]): Promise<{ error: string | null }>;
};

type SaveRequest = {
  /** Dashboard route only. The test route must pass "test" and is never written. */
  route: "dashboard" | "test";
  ventureId: string;
  versionId: string | null;
  contentHash: string | null;
  floors: readonly LaunchpadFloor[];
  progress: VentureTestProgress;
  onboardingSeen: boolean;
};

type SessionLike = { accountRole?: AccountRole; accessMode?: string; accountStatus?: string } | null;

const deps: {
  gateway: () => Promise<LaunchpadLearnerGateway>;
  session: () => SessionLike;
  now: () => string;
} = {
  gateway: browserGateway,
  session: () => readUserSession(),
  now: () => new Date().toISOString(),
};

let pending: SaveRequest | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let writing = false;

/** Parents, teachers, and guests never write. A child learner does. */
export function launchpadLearnerMaySave(session: SessionLike): boolean {
  if (!session) return false;
  if (session.accessMode === "guest" || session.accountStatus === "GUEST") return false;
  if (session.accessMode !== "registered") return false;
  return session.accountRole === "child";
}

export function shouldSyncLaunchpadLearner(request: Pick<SaveRequest, "route">, session: SessionLike = deps.session()): boolean {
  return request.route === "dashboard" && launchpadLearnerSaveEnabled() && launchpadLearnerMaySave(session);
}

function stampKey(ventureId: string): string {
  return `${STAMP_PREFIX}${ventureId}:answer-stamps`;
}

export function readAnswerStamps(ventureId: string): Record<string, string> {
  try {
    const raw = window.localStorage.getItem(stampKey(ventureId));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string") out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

function writeAnswerStamps(ventureId: string, stamps: Record<string, string>): void {
  try {
    window.localStorage.setItem(stampKey(ventureId), JSON.stringify(stamps));
  } catch {
    // The browser progress copy is already stored. Stamps are only for the merge.
  }
}

/** Stamp answers that changed. No-op while the save flag is off, so browser storage stays as it is. */
export function noteAnswerStamps(ventureId: string, before: VentureTestProgress, after: VentureTestProgress): void {
  if (!launchpadLearnerSaveEnabled()) return;
  const stamps = readAnswerStamps(ventureId);
  const now = deps.now();
  const keys = new Set([...Object.keys(before.answers ?? {}), ...Object.keys(after.answers ?? {})]);
  for (const key of keys) {
    if (JSON.stringify(before.answers?.[key]) !== JSON.stringify(after.answers?.[key])) stamps[key] = now;
  }
  writeAnswerStamps(ventureId, stamps);
}

function localSnapshot(ventureId: string, progress: VentureTestProgress, onboardingSeen: boolean): LaunchpadLearnerSnapshot {
  return {
    progress,
    onboardingSeen,
    answerUpdatedAt: readAnswerStamps(ventureId),
    taskUpdatedAt: {},
  };
}

/**
 * Queue one batched save. Returns immediately. The screen does not wait on it.
 * Flag off, the test route, and any non-child session never touch the client.
 */
export function scheduleLaunchpadLearnerSave(request: SaveRequest): void {
  if (!shouldSyncLaunchpadLearner(request)) return;
  pending = request;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void flushLaunchpadLearnerSave();
  }, SAVE_DELAY_MS);
}

export async function flushLaunchpadLearnerSave(): Promise<"skipped" | "saved" | "kept-browser"> {
  const request = pending;
  pending = null;
  if (!request || writing) {
    if (request) pending = request;
    return "skipped";
  }
  if (!shouldSyncLaunchpadLearner(request)) return "skipped";
  writing = true;
  try {
    const gateway = await deps.gateway();
    const userId = await gateway.userId();
    if (!userId) return keep(request);
    const venture = ventureRowForSave({
      userId,
      ventureId: request.ventureId,
      versionId: request.versionId,
      contentHash: request.contentHash,
      progress: request.progress,
      floors: request.floors,
      onboardingSeen: request.onboardingSeen,
      seenAt: deps.now(),
    });
    let saved = await gateway.upsertVenture(venture);
    if (saved.error && isMissingProgressColumn(saved.error)) {
      saved = await gateway.upsertVenture(ventureRowWithoutFullProgress(venture));
    }
    if (saved.error || !saved.id) return keep(request);
    const answers = answerRowsForSave({
      userId,
      learnerVentureId: saved.id,
      progress: request.progress,
      floors: request.floors,
      completedAt: deps.now(),
    });
    if (answers.length) {
      const wrote = await gateway.upsertAnswers(answers);
      if (wrote.error) return keep(request);
    }
    return "saved";
  } catch {
    return keep(request);
  } finally {
    writing = false;
    if (pending && !retryTimer && !timer) void flushLaunchpadLearnerSave();
  }
}

function keep(request: SaveRequest): "kept-browser" {
  if (!pending) pending = request;
  if (!retryTimer) {
    retryTimer = setTimeout(() => {
      retryTimer = null;
      void flushLaunchpadLearnerSave();
    }, RETRY_DELAY_MS);
  }
  return "kept-browser";
}

/**
 * Read this learner's rows and merge them into the browser copy.
 * Progress never loses a completed task. A failed read leaves the browser copy.
 */
export async function hydrateLaunchpadLearnerProgress(request: SaveRequest): Promise<LaunchpadLearnerSnapshot | null> {
  if (!shouldSyncLaunchpadLearner(request)) return null;
  try {
    const gateway = await deps.gateway();
    const userId = await gateway.userId();
    if (!userId) return null;
    const venture = await gateway.readVenture(request.ventureId);
    if (venture.error) return null;
    const storedAnswers = venture.row ? await gateway.readAnswers(venture.row.id) : { rows: [], error: null };
    if (storedAnswers.error) return null;
    const remote = remoteSnapshotFromStore(venture.row, storedAnswers.rows);
    const localProgress = loadVentureTestProgress(request.ventureId);
    const merged = mergeLaunchpadLearnerSnapshot(
      localSnapshot(request.ventureId, localProgress, hasSeenVentureTestOnboarding(request.ventureId) || request.onboardingSeen),
      remote,
    );
    saveVentureTestProgress(request.ventureId, merged.progress);
    writeAnswerStamps(request.ventureId, merged.answerUpdatedAt);
    return merged;
  } catch {
    return null;
  }
}

export function setLaunchpadLearnerSaveDepsForTests(next: Partial<typeof deps> | null): void {
  deps.gateway = next?.gateway ?? browserGateway;
  deps.session = next?.session ?? (() => readUserSession());
  deps.now = next?.now ?? (() => new Date().toISOString());
  pending = null;
  if (timer) clearTimeout(timer);
  if (retryTimer) clearTimeout(retryTimer);
  timer = null;
  retryTimer = null;
  writing = false;
}

async function browserGateway(): Promise<LaunchpadLearnerGateway> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  return {
    async userId() {
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    },
    async readVenture(ventureId) {
      const full = await supabase
        .from("launchpad_learner_ventures")
        .select(
          "id, content_version_id, current_level, current_silver_id, onboarding_seen_at, updated_at, content_hash, completed_task_ids, task_state, answers, rooftop_completed_at",
        )
        .eq("venture_id", ventureId)
        .maybeSingle();
      if (full.error && isMissingProgressColumn(full.error.message)) {
        const legacy = await supabase
          .from("launchpad_learner_ventures")
          .select("id, content_version_id, current_level, current_silver_id, onboarding_seen_at, updated_at")
          .eq("venture_id", ventureId)
          .maybeSingle();
        if (legacy.error) return { row: null, error: legacy.error.message };
        const row = legacy.data as Omit<LearnerVentureRecord, "hasProgressDocument"> | null;
        return { row: row ? { ...row, hasProgressDocument: false } : null, error: null };
      }
      if (full.error) return { row: null, error: full.error.message };
      const row = full.data as Omit<LearnerVentureRecord, "hasProgressDocument"> | null;
      return { row: row ? { ...row, hasProgressDocument: true } : null, error: null };
    },
    async readAnswers(learnerVentureId) {
      const { data, error } = await supabase
        .from("launchpad_learner_answers")
        .select("answer_key, answer, status, updated_at, completed_at")
        .eq("learner_venture_id", learnerVentureId);
      if (error) return { rows: [], error: error.message };
      return { rows: (data as StoredAnswerRow[] | null) ?? [], error: null };
    },
    async upsertVenture(row) {
      const { data, error } = await supabase
        .from("launchpad_learner_ventures")
        .upsert(row, { onConflict: "user_id,venture_id" })
        .select("id")
        .single();
      if (error) return { id: null, error: error.message };
      const id = (data as { id?: string } | null)?.id;
      return { id: id ?? null, error: id ? null : "Venture save returned no id." };
    },
    async upsertAnswers(rows) {
      if (!rows.length) return { error: null };
      const { error } = await supabase.from("launchpad_learner_answers").upsert(rows, { onConflict: "learner_venture_id,answer_key" });
      return { error: error?.message ?? null };
    },
  };
}
