import type {
  OnboardingEmailDataMap,
  OnboardingEmailType,
} from "@/lib/email/templates";
import type { SendOnboardingEmailResult } from "@/lib/email/resend-client";

export type ClientSendEmailRequest<T extends OnboardingEmailType = OnboardingEmailType> =
  {
    type: T;
    recipientEmail: string;
    data: OnboardingEmailDataMap[T];
  };

/**
 * Browser-safe helper that posts to `/api/email/send`.
 * Never throws — returns `{ success: false }` on transport/API failure so
 * callers can decide (e.g. Explorer approval hard-fails; other flows may soft-continue).
 */
export async function requestOnboardingEmailSend<T extends OnboardingEmailType>(
  payload: ClientSendEmailRequest<T>,
): Promise<SendOnboardingEmailResult | { success: false; error: string }> {
  try {
    const response = await fetch("/api/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await response.json().catch(() => null)) as
      | SendOnboardingEmailResult
      | { success?: boolean; error?: string; simulated?: boolean; id?: string }
      | null;

    if (!response.ok || !json || json.success !== true) {
      return {
        success: false,
        error:
          (json && "error" in json && typeof json.error === "string"
            ? json.error
            : null) || `Email send failed (${response.status})`,
      };
    }

    return {
      success: true,
      simulated: Boolean(json.simulated),
      id: json.id,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Email send request failed.";
    if (typeof console !== "undefined") {
      console.error("[Email Client Response]:", { success: false, error: message });
    }
    return { success: false, error: message };
  }
}
