import {
  buildOnboardingEmail,
  type OnboardingEmailDataMap,
  type OnboardingEmailType,
} from "@/lib/email/templates";

export type SendOnboardingEmailInput<T extends OnboardingEmailType = OnboardingEmailType> =
  {
    type: T;
    recipientEmail: string;
    data: OnboardingEmailDataMap[T];
    /** Optional absolute app origin for CTA links. */
    appUrl?: string;
  };

export type SendOnboardingEmailResult = {
  success: true;
  simulated: boolean;
  id?: string;
};

const RESEND_API_URL = "https://api.resend.com/emails";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function resolveFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "NextGenAchievers <onboarding@nextgenachievers.app>"
  );
}

/**
 * Sends a transactional onboarding email via Resend's HTTP API.
 * When `RESEND_API_KEY` is missing, logs a development simulation and succeeds.
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
    console.error(
      `[Resend Simulation] No RESEND_API_KEY found in process.env, skipping live HTTP call.`,
      {
        type: input.type,
        recipientEmail,
        subject: built.subject,
      },
    );
    return { success: true, simulated: true };
  }

  console.log(
    `[Resend Dispatch] Attempting live send to ${recipientEmail}...`,
    { type: input.type, subject: built.subject },
  );

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
    throw new Error(message);
  }

  const payload = (await response.json().catch(() => null)) as {
    id?: string;
  } | null;

  return {
    success: true,
    simulated: false,
    id: typeof payload?.id === "string" ? payload.id : undefined,
  };
}
