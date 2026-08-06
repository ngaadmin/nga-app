import {
  buildOnboardingEmail,
  PRODUCTION_APP_URL,
  type OnboardingEmailDataMap,
  type OnboardingEmailType,
} from "@/lib/email/templates";

export type SendOnboardingEmailInput<T extends OnboardingEmailType = OnboardingEmailType> =
  {
    type: T;
    recipientEmail: string;
    data: OnboardingEmailDataMap[T];
    /** Ignored for CTA links - production URL is always used. Kept for call-site compat. */
    appUrl?: string;
  };

export type SendOnboardingEmailResult =
  | {
      success: true;
      simulated: boolean;
      id?: string;
    }
  | {
      success: false;
      error: string;
      simulated?: boolean;
    };

const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Verified Resend sending domain - must match resend.com/domains. */
const DEFAULT_FROM_ADDRESS =
  "NextGenAchievers <onboarding@mail.nextgenachievers.com>";

function resolveFromAddress(): string {
  const configured = process.env.RESEND_FROM_EMAIL?.trim();
  if (configured) return configured;
  return DEFAULT_FROM_ADDRESS;
}

/**
 * Sends a transactional onboarding email via Resend's HTTP API.
 *
 * - Missing API key: simulated success (local/dev handoff).
 * - CREDENTIAL_RECOVERY: hard-fail on Resend/network errors (no hash rotation without send).
 * - Other types: soft-fail so signup UX stays green.
 */
export async function sendOnboardingEmail<T extends OnboardingEmailType>(
  input: SendOnboardingEmailInput<T>,
): Promise<SendOnboardingEmailResult> {
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  if (!recipientEmail || !EMAIL_PATTERN.test(recipientEmail)) {
    throw new Error("A valid recipientEmail is required.");
  }

  // CTA links always use the live production origin.
  const built = buildOnboardingEmail(
    input.type,
    input.data,
    PRODUCTION_APP_URL,
  );
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const hardFailOnSendError = input.type === "CREDENTIAL_RECOVERY";

  if (!apiKey) {
    console.error(
      `[Resend Simulation] No RESEND_API_KEY found in process.env, skipping live HTTP call.`,
      { type: input.type, subject: built.subject },
    );
    return { success: true, simulated: true };
  }

  console.log(`[Resend Dispatch] Attempting live send.`, {
    type: input.type,
    subject: built.subject,
  });

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resolveFromAddress(),
        to: [recipientEmail],
        subject: built.subject,
        html: built.html,
        text: built.text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      const message = `Resend API error (${response.status}): ${detail || response.statusText}`;
      console.error(`[Resend Dispatch] ${message}`);
      if (hardFailOnSendError) {
        return { success: false, error: message };
      }
      // Soft-fail: signup / resend UX stays green.
      return { success: true, simulated: true };
    }

    const payload = (await response.json().catch(() => null)) as {
      id?: string;
    } | null;

    return {
      success: true,
      simulated: false,
      id: typeof payload?.id === "string" ? payload.id : undefined,
    };
  } catch (error) {
    console.error("[Resend Dispatch] Network or unexpected failure", error);
    if (hardFailOnSendError) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Email send failed unexpectedly.",
      };
    }
    return { success: true, simulated: true };
  }
}
