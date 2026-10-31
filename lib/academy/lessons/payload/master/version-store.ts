/**
 * academy_lesson_versions over Supabase REST with a service key.
 * Tools and the preview job only. Writes draft rows. Never writes
 * academy_lesson_current.
 */
import type {
  MasterPublishPayload,
  MasterPublishStore,
} from "@/lib/academy/lessons/payload/master/publish-master";
import { supabaseKeyHeaders } from "@/lib/academy/media/held-media";

type Credentials = { supabaseUrl: string; serviceKey: string };

function headers(key: string): Record<string, string> {
  return { ...supabaseKeyHeaders(key), Accept: "application/json" };
}

async function getJson<T>(credentials: Credentials, query: string): Promise<T> {
  const response = await fetch(`${credentials.supabaseUrl.replace(/\/+$/, "")}/rest/v1/${query}`, {
    headers: headers(credentials.serviceKey),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Read failed (${response.status}) for ${query.split("?")[0]}.`);
  return (await response.json()) as T;
}

export function restVersionStore(credentials: Credentials, moduleNumber: number): MasterPublishStore {
  return {
    async findByHash(hash) {
      const rows = await getJson<Array<{ id: string }>>(
        credentials,
        `academy_lesson_versions?module_number=eq.${moduleNumber}&content_hash=eq.${encodeURIComponent(hash)}&select=id`,
      );
      return rows[0]?.id ?? null;
    },
    async saveDraft(hash, payload) {
      const response = await fetch(
        `${credentials.supabaseUrl.replace(/\/+$/, "")}/rest/v1/academy_lesson_versions`,
        {
          method: "POST",
          headers: {
            ...headers(credentials.serviceKey),
            "Content-Type": "application/json",
            Prefer: "return=representation",
          },
          body: JSON.stringify({ module_number: moduleNumber, content_hash: hash, payload }),
        },
      );
      if (!response.ok) throw new Error(`Version insert failed (${response.status}).`);
      const rows = (await response.json()) as Array<{ id?: string }>;
      if (!rows[0]?.id) throw new Error("Version insert did not return an id.");
      return rows[0].id;
    },
  };
}

/** Payload that prod serves for this module now, for the renumber check. */
export async function currentPayload(
  credentials: Credentials,
  moduleNumber: number,
): Promise<{ versionId: string; payload: MasterPublishPayload } | null> {
  const rows = await getJson<Array<{ version?: { id: string; payload: MasterPublishPayload } | null }>>(
    credentials,
    `academy_lesson_current?module_number=eq.${moduleNumber}&select=version:academy_lesson_versions(id,payload)`,
  );
  const version = rows[0]?.version;
  return version ? { versionId: version.id, payload: version.payload } : null;
}

export async function versionPayload(
  credentials: Credentials,
  versionId: string,
): Promise<{ id: string; moduleNumber: number; payload: unknown } | null> {
  const rows = await getJson<Array<{ id: string; module_number: number; payload: unknown }>>(
    credentials,
    `academy_lesson_versions?id=eq.${encodeURIComponent(versionId)}&select=id,module_number,payload`,
  );
  const row = rows[0];
  return row ? { id: row.id, moduleNumber: row.module_number, payload: row.payload } : null;
}
