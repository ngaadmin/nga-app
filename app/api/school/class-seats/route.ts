import { NextResponse } from "next/server";
import { authorizeBrowserMutation } from "@/lib/auth/request-guard";
import {
  removeOwnedClassSeats,
  type OwnedClassSeat,
  type RemoveClassSeatsTarget,
} from "@/lib/school/remove-class-seats";
import { deleteUsageEventsForUsername } from "@/lib/privacy/delete-usage-events";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type Body = {
  scope?: unknown;
  username?: unknown;
};

function parseTarget(body: Body): RemoveClassSeatsTarget | null {
  if (body.scope === "all") return { scope: "all" };
  if (body.scope === "one" && typeof body.username === "string") {
    return { scope: "one", username: body.username };
  }
  return null;
}

function isAlreadyGone(error: { message?: string; status?: number }): boolean {
  const message = (error.message ?? "").toLowerCase();
  return (
    error.status === 404 ||
    message.includes("not found") ||
    message.includes("does not exist")
  );
}

export async function POST(request: Request) {
  const origin = authorizeBrowserMutation(request);
  if (!origin.ok) {
    return NextResponse.json(
      { success: false, error: origin.error, removed: [] },
      { status: origin.status },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json(
      { success: false, error: "Choose a student to remove.", removed: [] },
      { status: 400 },
    );
  }

  const target = parseTarget(body);
  if (!target) {
    return NextResponse.json(
      { success: false, error: "Choose a student to remove.", removed: [] },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const teacherId = auth.user?.id;
  if (!teacherId) {
    return NextResponse.json(
      {
        success: false,
        error: "Sign in as a teacher to remove students.",
        removed: [],
      },
      { status: 401 },
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("[class-seats] admin client", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json(
      {
        success: false,
        error: "Could not remove students right now. Try again.",
        removed: [],
      },
      { status: 500 },
    );
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, is_teacher, account_status")
    .eq("id", teacherId)
    .maybeSingle();

  if (
    profileError ||
    profile?.is_teacher !== true ||
    profile.account_status !== "active"
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "Only a confirmed teacher can remove students.",
        removed: [],
      },
      { status: 403 },
    );
  }

  const result = await removeOwnedClassSeats(
    {
      async listOwnedSeats(ownerId) {
        const { data, error } = await admin
          .from("profiles")
          .select("id, username, account_role")
          .eq("teacher_id", ownerId)
          .eq("is_teacher", false);

        if (error) {
          console.error("[class-seats] list", { message: error.message });
          return { ok: false, error: error.message };
        }

        const seats: OwnedClassSeat[] = [];
        for (const row of data ?? []) {
          if (typeof row.id !== "string" || typeof row.username !== "string") {
            continue;
          }
          seats.push({
            id: row.id,
            username: row.username,
            accountRole:
              typeof row.account_role === "string" ? row.account_role : "",
          });
        }
        return { ok: true, seats };
      },
      async deleteProgress(userId) {
        const { error } = await admin
          .from("learner_progress")
          .delete()
          .eq("user_id", userId);
        if (error) {
          console.error("[class-seats] progress", { message: error.message });
          return { ok: false, error: error.message };
        }
        return { ok: true };
      },
      async deleteUsageEvents(username) {
        const usage = await deleteUsageEventsForUsername(admin, username);
        if (!usage.ok) {
          console.error("[class-seats] usage", { message: usage.error });
          return usage;
        }
        return { ok: true };
      },
      async deleteAuthUser(userId) {
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error && !isAlreadyGone(error)) {
          console.error("[class-seats] auth", { message: error.message });
          return { ok: false, error: error.message };
        }
        return { ok: true };
      },
    },
    teacherId,
    target,
  );

  if (!result.ok) {
    const status = result.error === "That student is not in this class." ? 404 : 500;
    return NextResponse.json(
      { success: false, error: result.error, removed: result.removed },
      { status },
    );
  }

  return NextResponse.json({ success: true, removed: result.removed });
}
