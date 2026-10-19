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
  const subject = `${safeName} cashed in XP`;

  const body = [
    "Hi,",
    "",
    `${safeName} cashed in ${payload.pointsClaimed.toLocaleString()} XP for ${payload.amountFormatted} in the app.`,
    "",
    `Rate: ${payload.conversionRateLabel}`,
    "",
    "That cash is a number in their Vault. It is not real money, and the app does not pay it out.",
    "",
    "- NextGenAchievers",
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
