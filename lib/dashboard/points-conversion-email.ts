import { coinWord } from "@/lib/copy/coin-word";
import { resolveSimulatedParentEmail } from "@/lib/dashboard/parent-pin";

export type PointsConversionEmailPayload = {
  parentEmail: string;
  childUsername: string;
  amountFormatted: string;
  pointsClaimed: number;
  conversionRateLabel: string;
};

export type PointsConversionEmailDispatch = PointsConversionEmailPayload & {
  dispatched: true;
  subject: string;
  body: string;
};

export function buildPointsConversionParentEmail(
  payload: PointsConversionEmailPayload,
): { subject: string; body: string } {
  const safeName = payload.childUsername.trim() || "Your child";
  const subject = `${safeName} cashed in coins`;

  const body = [
    "Hi,",
    "",
    `${safeName} cashed in ${payload.pointsClaimed.toLocaleString()} ${coinWord(payload.pointsClaimed)} for ${payload.amountFormatted} at the rate you agreed. That's what you owe them. Pay it however you like. The app doesn't move any money.`,
  ].join("\n");

  return { subject, body };
}

/**
 * Simulated parent notification when a child cashes XP into Vault cash.
 */
export async function dispatchPointsConversionParentEmail(
  payload: PointsConversionEmailPayload,
): Promise<PointsConversionEmailDispatch> {
  const { subject, body } = buildPointsConversionParentEmail(payload);

  await new Promise((resolve) => {
    window.setTimeout(resolve, 350);
  });

  return {
    dispatched: true,
    ...payload,
    subject,
    body,
  };
}

export function resolveParentEmailForChild(username: string): string {
  return resolveSimulatedParentEmail(username);
}
