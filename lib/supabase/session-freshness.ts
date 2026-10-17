/**
 * Same window auth-js uses before it refreshes an access token
 * (`EXPIRY_MARGIN_MS` = 3 × 30s). Inside this window, middleware must call
 * `getClaims()` so the refresh cookie is written. Outside it, the token is
 * still valid and a refresh would only add a network hop.
 */
export const SESSION_REFRESH_MARGIN_MS = 90_000;

const AUTH_TOKEN_COOKIE =
  /^sb-[A-Za-z0-9]+-auth-token(?:\.(0|[1-9][0-9]*))?$/;

type CookieLike = {
  name: string;
  value: string;
};

type SessionCookie = {
  expires_at?: unknown;
  access_token?: unknown;
};

/**
 * True when middleware should run `getClaims()` to refresh the Supabase session.
 * Guests (no auth cookie) and sessions that are still comfortably valid skip it.
 * An unreadable auth cookie returns true so the Supabase client can repair it.
 */
export function shouldRefreshSupabaseSession(
  cookies: readonly CookieLike[],
  now = Date.now(),
): boolean {
  const groups = new Map<string, Map<number | "whole", string>>();

  for (const cookie of cookies) {
    const match = AUTH_TOKEN_COOKIE.exec(cookie.name);
    if (!match) continue;
    const base = cookie.name.replace(/\.\d+$/, "");
    let chunks = groups.get(base);
    if (!chunks) {
      chunks = new Map();
      groups.set(base, chunks);
    }
    if (match[1] === undefined) {
      chunks.set("whole", cookie.value);
    } else {
      chunks.set(Number(match[1]), cookie.value);
    }
  }

  if (groups.size === 0) return false;

  for (const chunks of groups.values()) {
    const raw = assembleSessionCookie(chunks);
    const expiryMs = raw ? readSessionExpiryMs(raw) : null;
    if (expiryMs === null || expiryMs - now <= SESSION_REFRESH_MARGIN_MS) {
      return true;
    }
  }

  return false;
}

function assembleSessionCookie(
  chunks: ReadonlyMap<number | "whole", string>,
): string | null {
  const whole = chunks.get("whole");
  if (whole) return whole;

  const indexes = [...chunks.keys()]
    .filter((key): key is number => typeof key === "number")
    .sort((left, right) => left - right);
  if (indexes.length === 0 || indexes[0] !== 0) return null;
  for (let index = 0; index < indexes.length; index += 1) {
    if (indexes[index] !== index) return null;
  }
  return indexes.map((index) => chunks.get(index) ?? "").join("");
}

function readSessionExpiryMs(raw: string): number | null {
  let text = raw;
  if (text.startsWith("base64-")) {
    const decoded = decodeBase64Url(text.slice("base64-".length));
    if (!decoded) return null;
    text = decoded;
  }

  let session: SessionCookie;
  try {
    session = JSON.parse(text) as SessionCookie;
  } catch {
    return null;
  }

  if (typeof session.expires_at === "number" && Number.isFinite(session.expires_at)) {
    return session.expires_at * 1000;
  }

  if (typeof session.access_token === "string") {
    return readJwtExpiryMs(session.access_token);
  }

  return null;
}

function readJwtExpiryMs(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  const decoded = decodeBase64Url(payload);
  if (!decoded) return null;
  try {
    const claims = JSON.parse(decoded) as { exp?: unknown };
    if (typeof claims.exp === "number" && Number.isFinite(claims.exp)) {
      return claims.exp * 1000;
    }
  } catch {
    return null;
  }
  return null;
}

function decodeBase64Url(value: string): string | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (padded.length % 4)) % 4;
    const binary = atob(padded + "=".repeat(padLength));
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}
