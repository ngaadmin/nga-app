import { NextResponse } from "next/server";
import { consumeRateLimit } from "@/lib/auth/rate-limit";
import { authorizeBrowserMutation } from "@/lib/auth/request-guard";
import {
  assessParentPin,
  PARENT_PIN_GATE_COPY,
} from "@/lib/dashboard/parent-pin-gate";
import {
  deleteLinkedChildAccount,
  parseLinkedChildId,
  DELETE_LINKED_CHILD_COPY,
  type DeleteLinkedChildAdmin,
  type LinkedChildTarget,
} from "@/lib/onboarding/delete-linked-child";
import { notifyAccountDeletedChild } from "@/lib/onboarding/issue-account-deleted-email";
import { deleteUsageEventsForUsername } from "@/lib/privacy/delete-usage-events";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  childId?: unknown;
  parentPin?: unknown;
};

type ProfileRoleRow = {
  id?: string;
  account_role?: string | null;
  username?: string | null;
};

function isAlreadyGone(error: { message?: string; status?: number; code?: string }): boolean {
  const message = (error.message ?? "").toLowerCase();
  const code = (error.code ?? "").toLowerCase();
  return (
    error.status === 404 ||
    code.includes("not_found") ||
    message.includes("not found") ||
    message.includes("does not exist")
  );
}

function stepError(message: string): { ok: false; error: string } {
  console.error("[delete-child]", { message });
  return { ok: false, error: message };
}

export async function POST(request: Request) {
  const origin = authorizeBrowserMutation(request);
  if (!origin.ok) {
    return NextResponse.json(
      { success: false, error: origin.error },
      { status: origin.status },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { success: false, error: DELETE_LINKED_CHILD_COPY.invalid },
      { status: 400 },
    );
  }

  const childId = parseLinkedChildId(body.childId);
  if (!childId) {
    return NextResponse.json(
      { success: false, error: DELETE_LINKED_CHILD_COPY.invalid },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const parentId = auth.user?.id ? parseLinkedChildId(auth.user.id) : null;
  if (!parentId) {
    return NextResponse.json(
      { success: false, error: "Sign in as the parent to delete this learner." },
      { status: 401 },
    );
  }

  let db;
  try {
    db = createAdminClient();
  } catch (error) {
    console.error("[delete-child] admin client", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      { success: false, error: DELETE_LINKED_CHILD_COPY.failed },
      { status: 500 },
    );
  }

  const { data: pinRow, error: pinError } = await db
    .from("profiles")
    .select("account_role, parent_pin_hash")
    .eq("id", parentId)
    .maybeSingle();
  if (pinError) {
    return NextResponse.json(
      { success: false, error: DELETE_LINKED_CHILD_COPY.failed },
      { status: 500 },
    );
  }
  const pinProfile = pinRow as {
    account_role?: string | null;
    parent_pin_hash?: string | null;
  } | null;
  if (pinProfile?.account_role !== "parent_master") {
    return NextResponse.json(
      { success: false, error: DELETE_LINKED_CHILD_COPY.notParent },
      { status: 403 },
    );
  }
  const storedPin = pinProfile.parent_pin_hash?.trim() ?? "";
  if (storedPin) {
    const pinLimit = consumeRateLimit(`parent-pin:${parentId}`, 8, 15 * 60 * 1000);
    if (!pinLimit.allowed) {
      return NextResponse.json(
        { success: false, error: PARENT_PIN_GATE_COPY.limited },
        { status: 429 },
      );
    }
  }
  const pin = assessParentPin(body.parentPin, pinProfile.parent_pin_hash);
  if (!pin.ok) {
    return NextResponse.json({ success: false, error: pin.error }, { status: 403 });
  }

  const admin: DeleteLinkedChildAdmin = {
    async loadCallerRole(callerId) {
      const { data, error } = await db
        .from("profiles")
        .select("account_role")
        .eq("id", callerId)
        .maybeSingle();
      if (error) return stepError(error.message);
      const role = (data as { account_role?: string | null } | null)?.account_role;
      return { ok: true, role: typeof role === "string" ? role : null };
    },
    async findLinkedChild(callerId, targetId) {
      const { data: link, error: linkError } = await db
        .from("parent_child")
        .select("child_id")
        .eq("parent_id", callerId)
        .eq("child_id", targetId)
        .maybeSingle();
      if (linkError) return stepError(linkError.message);
      const linkedId =
        typeof link?.child_id === "string" ? link.child_id.trim().toLowerCase() : "";
      if (linkedId !== targetId) return { ok: true, child: null };

      const { data: profile, error: profileError } = await db
        .from("profiles")
        .select("id, account_role, username")
        .eq("id", targetId)
        .maybeSingle();
      if (profileError) return stepError(profileError.message);

      const row = profile as ProfileRoleRow | null;
      const rowId = typeof row?.id === "string" ? row.id.trim().toLowerCase() : "";
      if (rowId !== targetId) return { ok: true, child: null };
      const child: LinkedChildTarget = {
        id: targetId,
        role: typeof row?.account_role === "string" ? row.account_role : "",
        username: typeof row?.username === "string" ? row.username : "",
      };
      return { ok: true, child };
    },
    async deleteLearnerProgress(targetId) {
      const { error } = await db
        .from("learner_progress")
        .delete()
        .eq("user_id", targetId);
      if (error) return stepError(error.message);
      return { ok: true };
    },
    async deleteConsentRequests(targetId) {
      const { error } = await db
        .from("consent_requests")
        .delete()
        .eq("child_id", targetId);
      if (error) return stepError(error.message);
      return { ok: true };
    },
    async deleteUsageEvents(username) {
      const usage = await deleteUsageEventsForUsername(db, username);
      if (!usage.ok) return stepError(usage.error);
      return { ok: true };
    },
    async deleteAuthUser(targetId) {
      const { error } = await db.auth.admin.deleteUser(targetId, false);
      if (error && !isAlreadyGone(error)) return stepError(error.message);
      return { ok: true };
    },
    async deleteParentChildLink(callerId, targetId) {
      const { error } = await db
        .from("parent_child")
        .delete()
        .eq("parent_id", callerId)
        .eq("child_id", targetId);
      if (error) return stepError(error.message);
      return { ok: true };
    },
    async deleteProfile(targetId) {
      const { error } = await db.from("profiles").delete().eq("id", targetId);
      if (error) return stepError(error.message);
      return { ok: true };
    },
    async confirmAuthUserGone(targetId) {
      const { data, error } = await db.auth.admin.getUserById(targetId);
      if (error && !isAlreadyGone(error)) return stepError(error.message);
      if (data?.user?.id) return stepError("Auth user still present after delete.");
      return { ok: true };
    },
  };

  const result = await deleteLinkedChildAccount(admin, parentId, childId);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.status },
    );
  }

  const parentEmail = auth.user?.email?.trim().toLowerCase() ?? "";
  if (parentEmail && result.username) {
    await notifyAccountDeletedChild({
      recipientEmail: parentEmail,
      username: result.username,
    });
  }

  return NextResponse.json({ success: true });
}
