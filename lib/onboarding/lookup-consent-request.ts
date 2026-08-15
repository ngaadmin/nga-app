import { createAdminClient } from "@/lib/supabase/admin";
import {
  CONSENT_TOKEN_TTL_MS,
  hashConsentToken,
} from "@/lib/auth/consent-request-token";

export type StoredConsentRequest = {
  id: string;
  kind: "vpc" | "parent_claim";
  status: string;
  childId: string;
  parentEmail: string;
  parentId: string | null;
  createdAt: string;
  expiresAt: string;
  childUsername: string;
  birthYear: number;
};

export type ConsentRequestLookup =
  | { status: "valid"; request: StoredConsentRequest }
  | { status: "expired"; request: StoredConsentRequest | null }
  | { status: "invalid" };

export async function lookupConsentRequestByToken(
  token: string,
): Promise<ConsentRequestLookup> {
  const trimmed = token.trim();
  if (!trimmed) return { status: "invalid" };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("consent_requests")
    .select(
      "id, kind, status, child_id, parent_email, parent_id, created_at, expires_at",
    )
    .eq("token_hash", hashConsentToken(trimmed))
    .maybeSingle();

  if (error || !data) {
    return { status: "invalid" };
  }

  const { data: child } = await admin
    .from("profiles")
    .select("username, birth_year")
    .eq("id", data.child_id)
    .maybeSingle();

  if (!child?.username || typeof child.birth_year !== "number") {
    return { status: "invalid" };
  }

  const request: StoredConsentRequest = {
    id: data.id,
    kind: data.kind,
    status: data.status,
    childId: data.child_id,
    parentEmail: data.parent_email,
    parentId: data.parent_id,
    createdAt: data.created_at,
    expiresAt: data.expires_at,
    childUsername: child.username,
    birthYear: child.birth_year,
  };

  if (new Date(data.expires_at).getTime() <= Date.now()) {
    return { status: "expired", request };
  }

  if (data.status !== "pending") {
    return { status: "invalid" };
  }

  return { status: "valid", request };
}

export async function rotateConsentRequestToken(input: {
  requestId: string;
  nextToken: string;
}): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin
    .from("consent_requests")
    .update({
      token_hash: hashConsentToken(input.nextToken),
      expires_at: new Date(Date.now() + CONSENT_TOKEN_TTL_MS).toISOString(),
    })
    .eq("id", input.requestId)
    .eq("status", "pending");

  return !error;
}
