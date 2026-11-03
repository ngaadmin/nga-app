import {
  LAUNCHPAD_FLOOR_TYPES,
  LAUNCHPAD_PLACEHOLDER_BLOCK_KINDS,
  type LaunchpadVenturePayload,
} from "@/lib/launchpad/content/types";
import { LAUNCHPAD_PAYLOAD_SCHEMA_VERSION } from "@/lib/launchpad/content/schema-version";

/** Most plaques a floor wall holds (the building art draws one window each). */
export const LAUNCHPAD_MAX_SILVERS_PER_FLOOR = 6;
/** Most doors (bronzes) under one plaque. */
export const LAUNCHPAD_MAX_BRONZES_PER_SILVER = 6;

export const LAUNCHPAD_VENTURE_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const NODE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/;
/** Copy rules: no internal brand short form and no XP in learner-facing text. */
const BANNED_COPY: readonly { re: RegExp; label: string }[] = [
  { re: /\bNGA\b/, label: "NGA" },
  { re: /\bXP\b/i, label: "XP" },
];

export type LaunchpadPayloadCheck =
  | { ok: true; payload: LaunchpadVenturePayload }
  | { ok: false; reason: string };

type Obj = Record<string, unknown>;

function isObj(value: unknown): value is Obj {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

class Reject extends Error {}

function fail(reason: string): never {
  throw new Reject(reason);
}

function text(value: unknown, where: string, optional = false): void {
  if (value === undefined && optional) return;
  if (typeof value !== "string" || !value.trim()) fail(`${where} is missing.`);
  for (const rule of BANNED_COPY) {
    if (rule.re.test(value)) fail(`${where} uses "${rule.label}".`);
  }
}

function list(value: unknown, where: string, min = 1, max = Number.POSITIVE_INFINITY): unknown[] {
  if (!Array.isArray(value)) fail(`${where} must be a list.`);
  if (value.length < min) fail(`${where} needs at least ${min}.`);
  if (value.length > max) fail(`${where} allows at most ${max}.`);
  return value;
}

function bool(value: unknown, where: string): void {
  if (typeof value !== "boolean") fail(`${where} must be true or false.`);
}

/**
 * Shape check used at publish and again when the app reads a version
 * (same role as Academy's checkMasterPublishPayload). An unknown
 * schemaVersion, floor type, or screen type is rejected so an old app never
 * renders a newer shape. Ids must be unique across the venture because
 * progress is keyed by task id.
 */
export function checkLaunchpadVenturePayload(value: unknown, expectedVentureId?: string): LaunchpadPayloadCheck {
  try {
    checkOrThrow(value, expectedVentureId);
    return { ok: true, payload: value as LaunchpadVenturePayload };
  } catch (error) {
    if (error instanceof Reject) return { ok: false, reason: error.message };
    throw error;
  }
}

function checkOrThrow(value: unknown, expectedVentureId?: string): void {
  if (!isObj(value)) fail("Payload is not an object.");
  if (value.schemaVersion !== LAUNCHPAD_PAYLOAD_SCHEMA_VERSION) {
    fail(`Unsupported schemaVersion ${String(value.schemaVersion)}.`);
  }
  const ventureId = value.ventureId;
  if (typeof ventureId !== "string" || !LAUNCHPAD_VENTURE_ID_RE.test(ventureId)) fail("ventureId is missing.");
  if (expectedVentureId !== undefined && ventureId !== expectedVentureId) {
    fail(`Payload is venture ${ventureId}, expected ${expectedVentureId}.`);
  }
  const ids = new Set<string>();
  const id = (raw: unknown, where: string) => {
    if (typeof raw !== "string" || !NODE_ID_RE.test(raw)) fail(`${where} has no valid id.`);
    if (ids.has(raw)) fail(`Id ${raw} is used twice.`);
    ids.add(raw);
  };
  const floors = list(value.floors, "floors");
  floors.forEach((floor, fi) => {
    const fw = `Floor ${fi + 1}`;
    if (!isObj(floor)) fail(`${fw} is malformed.`);
    if (floor.level !== fi + 1) fail(`${fw} must be level ${fi + 1}.`);
    text(floor.name, `${fw} name`);
    if (!(LAUNCHPAD_FLOOR_TYPES as readonly unknown[]).includes(floor.floorType)) {
      fail(`${fw} has unknown floorType ${String(floor.floorType)}.`);
    }
    if (!isObj(floor.gold)) fail(`${fw} gold is missing.`);
    id(floor.gold.id, `${fw} gold`);
    text(floor.gold.title, `${fw} gold title`);
    list(floor.silvers, `${fw} silvers`, 1, LAUNCHPAD_MAX_SILVERS_PER_FLOOR).forEach((silver, si) => {
      const sw = `${fw} silver ${si + 1}`;
      if (!isObj(silver)) fail(`${sw} is malformed.`);
      id(silver.id, sw);
      text(silver.title, `${sw} title`);
      bool(silver.placeholder, `${sw} placeholder`);
      list(silver.bronzes, `${sw} bronzes`, 1, LAUNCHPAD_MAX_BRONZES_PER_SILVER).forEach((bronze, bi) => {
        const bw = `${sw} bronze ${bi + 1}`;
        if (!isObj(bronze)) fail(`${bw} is malformed.`);
        id(bronze.id, bw);
        text(bronze.title, `${bw} title`);
        text(bronze.subtitle, `${bw} subtitle`, true);
        bool(bronze.placeholder, `${bw} placeholder`);
        list(bronze.tasks, `${bw} tasks`).forEach((task, ti) => {
          const tw = `${bw} task ${ti + 1}`;
          if (!isObj(task)) fail(`${tw} is malformed.`);
          id(task.id, tw);
          text(task.title, `${tw} title`);
          bool(task.placeholder, `${tw} placeholder`);
          list(task.screens, `${tw} screens`).forEach((screen, ki) => checkScreen(screen, `${tw} screen ${ki + 1}`, id));
        });
      });
    });
  });
}

function checkScreen(screen: unknown, where: string, id: (raw: unknown, where: string) => void): void {
  if (!isObj(screen)) fail(`${where} is malformed.`);
  id(screen.id, where);
  text(screen.heading, `${where} heading`, true);
  switch (screen.type) {
    case "placeholder":
      list(screen.blocks, `${where} blocks`).forEach((block, i) => {
        if (!isObj(block) || !(LAUNCHPAD_PLACEHOLDER_BLOCK_KINDS as readonly unknown[]).includes(block.kind)) {
          fail(`${where} block ${i + 1} has an unknown kind.`);
        }
        text(block.label, `${where} block ${i + 1} label`);
      });
      return;
    case "text":
      text(screen.body, `${where} body`);
      text(screen.note, `${where} note`, true);
      return;
    case "checklist":
      text(screen.intro, `${where} intro`, true);
      list(screen.items, `${where} items`).forEach((item, i) => text(item, `${where} item ${i + 1}`));
      return;
    default:
      fail(`${where} has unknown type ${String(screen.type)}.`);
  }
}

