import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

import { localPairSheetImagePath } from "@/lib/academy/illustrations/illustration-registry";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const AUDIO_DIR = path.join(PUBLIC_DIR, "academy-audio");

let audioByName: Map<string, string> | null = null;

function publicAudioPath(fileName: string): string | undefined {
  if (!audioByName) {
    audioByName = new Map();
    if (existsSync(AUDIO_DIR)) {
      for (const entry of readdirSync(AUDIO_DIR, { withFileTypes: true, recursive: true })) {
        if (!entry.isFile()) continue;
        const parent = entry.parentPath ?? entry.path;
        const absolute = path.join(parent, entry.name);
        const rel = `/${path.relative(PUBLIC_DIR, absolute).split(path.sep).join("/")}`;
        audioByName.set(entry.name.toLowerCase(), rel);
      }
    }
  }
  return audioByName.get(fileName.toLowerCase());
}

function storageBase(): string | undefined {
  const base = process.env.NEXT_PUBLIC_ACADEMY_MEDIA_BASE?.trim().replace(/\/$/, "");
  return base || undefined;
}

/** Storage URL when a base is set, otherwise a file under /public. */
export function resolveAcademyImageUrl(fileName: string): string | undefined {
  const local = localPairSheetImagePath(fileName);
  if (local && existsSync(path.join(PUBLIC_DIR, local))) {
    const base = storageBase();
    if (base) {
      const name = fileName.trim().split(/[/\\]/).pop() ?? fileName;
      return `${base}/images/${encodeURIComponent(name)}`;
    }
    return local;
  }
  const base = storageBase();
  if (base) {
    const name = fileName.trim().split(/[/\\]/).pop() ?? fileName;
    return `${base}/images/${encodeURIComponent(name)}`;
  }
  return undefined;
}

export function resolveAcademyAudioUrl(fileName: string): string | undefined {
  const local = publicAudioPath(fileName);
  if (local) return local;
  const base = storageBase();
  if (base) return `${base}/audio/${encodeURIComponent(fileName)}`;
  return undefined;
}
