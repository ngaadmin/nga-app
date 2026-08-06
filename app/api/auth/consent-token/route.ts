import { NextRequest, NextResponse } from "next/server";
import {
  signConsentToken,
  verifyConsentToken,
  type ConsentTokenClaims,
} from "@/lib/auth/consent-token";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { requiresParentConsentForBirthYear } from "@/lib/dashboard/mastery-cohort";

export const runtime = "nodejs";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONSENT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function isConsentStillValid(createdAtIso: string, birthYear: number): boolean {
  const createdAt = Date.parse(createdAtIso);
  if (!Number.isFinite(createdAt) || Date.now() - createdAt > CONSENT_TTL_MS) {
    return false;
  }
  return requiresParentConsentForBirthYear(birthYear);
}

/** Issue a signed parental consent token. */
export async function POST(request: Request) {
  const limit = consumeRateLimit(`consent-issue:${clientKey(request)}`, 20, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Try again shortly." },
      { status: 429 },
    );
  }

  try {
    const body = (await request.json()) as Partial<ConsentTokenClaims>;
    const parentEmail =
      typeof body.parentEmail === "string"
        ? body.parentEmail.trim().toLowerCase()
        : "";
    const childUsername =
      typeof body.childUsername === "string" ? body.childUsername.trim() : "";
    const birthYear =
      typeof body.birthYear === "number" && Number.isInteger(body.birthYear)
        ? body.birthYear
        : NaN;
    const createdAt =
      typeof body.createdAt === "string" && body.createdAt.trim()
        ? body.createdAt.trim()
        : new Date().toISOString();
    const passcodeHash =
      typeof body.passcodeHash === "string" && body.passcodeHash.trim()
        ? body.passcodeHash.trim()
        : undefined;

    if (!parentEmail || !EMAIL_PATTERN.test(parentEmail)) {
      return NextResponse.json(
        { success: false, error: "A valid parentEmail is required." },
        { status: 400 },
      );
    }
    if (!childUsername) {
      return NextResponse.json(
        { success: false, error: "childUsername is required." },
        { status: 400 },
      );
    }
    if (!Number.isInteger(birthYear) || !requiresParentConsentForBirthYear(birthYear)) {
      return NextResponse.json(
        { success: false, error: "birthYear must require parental consent." },
        { status: 400 },
      );
    }

    const token = signConsentToken({
      parentEmail,
      childUsername,
      birthYear,
      createdAt,
      passcodeHash,
    });

    return NextResponse.json({ success: true as const, token, createdAt });
  } catch (error) {
    console.error("[CONSENT_TOKEN_ISSUE_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Could not issue consent token." },
      { status: 500 },
    );
  }
}

/** Verify a signed consent token and return claims (no credential digests leaked beyond what's required). */
export async function GET(request: NextRequest) {
  const limit = consumeRateLimit(`consent-verify:${clientKey(request)}`, 60, 60_000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Try again shortly." },
      { status: 429 },
    );
  }

  const token = (request.nextUrl.searchParams.get("token") ?? "").trim();
  if (!token) {
    return NextResponse.json(
      { success: false, error: "token is required." },
      { status: 400 },
    );
  }

  const claims = verifyConsentToken(token);
  if (!claims || !isConsentStillValid(claims.createdAt, claims.birthYear)) {
    return NextResponse.json(
      { success: false, error: "Invalid or expired consent token." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true as const,
    pending: {
      token,
      parentEmail: claims.parentEmail,
      childUsername: claims.childUsername,
      birthYear: claims.birthYear,
      createdAt: claims.createdAt,
      passcodeHash: claims.passcodeHash,
    },
  });
}
