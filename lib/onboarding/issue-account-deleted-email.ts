"use server";

import { sendOnboardingEmail } from "@/lib/email/resend-client";
import { EMAIL_PATTERN } from "@/lib/validation/email";

/**
 * Notice after a single child profile is deleted. Soft-fails so deletion
 * can still complete if mail cannot be sent.
 */
export async function notifyAccountDeletedChild(input: {
  recipientEmail: string;
  username: string;
}): Promise<void> {
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  const username = input.username.trim();
  if (!username || !recipientEmail || !EMAIL_PATTERN.test(recipientEmail)) {
    return;
  }

  try {
    await sendOnboardingEmail({
      type: "ACCOUNT_DELETED_CHILD",
      recipientEmail,
      data: { username },
    });
  } catch {
    // Soft-fail: the profile delete is the source of truth.
  }
}
