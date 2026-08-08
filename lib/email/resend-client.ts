import {
  buildOnboardingEmail,
  type OnboardingEmailDataMap,
  type OnboardingEmailType,
} from "@/lib/email/templates";
import { EMAIL_PATTERN } from "@/lib/validation/email";

export type SendOnboardingEmailInput<T extends OnboardingEmailType = OnboardingEmailType> =
  {
    type: T;
    recipientEmail: string;
    data: OnboardingEmailDataMap[T];
    /**
     * Origin that issued the consent token. Approval CTAs must use this host
     * (localhost / preview / production) so signature verification succeeds.
     */
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
 * - Missing API key in development: simulated success for local handoff.
 * - Missing API key in production: hard failure.
 * - Resend / network errors: always hard failure (never masked as success).
 */
export async function sendOnboardingEmail<T extends OnboardingEmailType>(
  input: SendOnboardingEmailInput<T>,
): Promise<SendOnboardingEmailResult> {
  const recipientEmail = input.recipientEmail.trim().toLowerCase();
  if (!recipientEmail || !EMAIL_PATTERN.test(recipientEmail)) {
    throw new Error("A valid recipientEmail is required.");
  }

  const built = buildOnboardingEmail(input.type, input.data, input.appUrl);
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        `[Resend Dispatch] RESEND_API_KEY missing in production.`,
        { type: input.type, subject: built.subject },
      );
      return {
        success: false,
        error: "Email service is not configured.",
      };
    }

    console.error(
      `[Resend Simulation] No RESEND_API_KEY found in process.env, skipping live HTTP call.`,
      { type: input.type, subject: built.subject },
    );
    return { success: true, simulated: true };
  }

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
      return { success: false, error: message };
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
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Email send failed unexpectedly.",
    };
  }
}
