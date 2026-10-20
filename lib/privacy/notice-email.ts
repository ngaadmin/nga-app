import { EMAIL_PATTERN } from "@/lib/validation/email";

/** Auth addresses that are not a real inbox. Never send mail here. */
export function isPlaceholderAuthEmail(email: string | null | undefined): boolean {
  const lower = email?.trim().toLowerCase() ?? "";
  if (!lower || !EMAIL_PATTERN.test(lower)) return true;
  return (
    lower.endsWith(".invalid") ||
    lower.endsWith("@users.nextgenachievers.internal")
  );
}

export function realNoticeEmail(email: string | null | undefined): string | null {
  if (isPlaceholderAuthEmail(email)) return null;
  return email!.trim().toLowerCase();
}

export type InactivityNotice = {
  email: string;
  audience: "parent" | "teacher";
};

/**
 * Who may be emailed about an inactive account.
 * Students are never the recipient, even when their auth email looks real.
 */
export function resolveInactivityNotice(input: {
  role: "child" | "parent_master" | "teacher";
  authEmail: string | null;
  parentEmail: string | null;
  teacherEmail: string | null;
  guardianEmail: string | null;
}): InactivityNotice | null {
  if (input.role === "parent_master") {
    const email = realNoticeEmail(input.authEmail);
    return email ? { email, audience: "parent" } : null;
  }
  if (input.role === "teacher") {
    const email = realNoticeEmail(input.authEmail);
    return email ? { email, audience: "teacher" } : null;
  }

  const parent =
    realNoticeEmail(input.parentEmail) ?? realNoticeEmail(input.guardianEmail);
  if (parent) return { email: parent, audience: "parent" };
  const teacher = realNoticeEmail(input.teacherEmail);
  if (teacher) return { email: teacher, audience: "teacher" };
  return null;
}
