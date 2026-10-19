"use server";

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/**
 * True when the signed-in user is a class seat (created for a teacher)
 * and no parent is linked in parent_child.
 * The id comes from the server session. A user id from the browser is ignored.
 */
export async function loadSignedInClassAccountCashIn(): Promise<{
  classAccountWithoutParent: boolean;
  /** Class seats and student seats never cash in XP, even when a parent is linked. */
  classOrStudentSeat: boolean;
}> {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id?.trim();
    if (!userId) return { classAccountWithoutParent: false, classOrStudentSeat: false };

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .select("id, teacher_id, is_teacher, account_role")
      .eq("id", userId)
      .maybeSingle();

    if (error || !profile?.id) {
      return { classAccountWithoutParent: false, classOrStudentSeat: false };
    }

    const teacherId =
      typeof profile.teacher_id === "string" ? profile.teacher_id.trim() : "";
    const isClassSeat =
      teacherId.length > 0 &&
      teacherId !== profile.id &&
      profile.is_teacher !== true &&
      profile.account_role === "child";

    if (!isClassSeat) return { classAccountWithoutParent: false, classOrStudentSeat: false };

    const { data: links, error: linkError } = await admin
      .from("parent_child")
      .select("parent_id")
      .eq("child_id", userId)
      .limit(1);

    if (linkError) {
      return { classAccountWithoutParent: true, classOrStudentSeat: true };
    }

    const hasParent = (links ?? []).some(
      (row) => typeof row.parent_id === "string" && row.parent_id.trim().length > 0,
    );
    return { classAccountWithoutParent: !hasParent, classOrStudentSeat: true };
  } catch {
    return { classAccountWithoutParent: false, classOrStudentSeat: false };
  }
}
