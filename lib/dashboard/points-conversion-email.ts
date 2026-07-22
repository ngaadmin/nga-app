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
  const subject = `${safeName} cashed in XP in NextGenAchievers`;

  const body = [
    "Hi,",
    "",
    `${safeName} converted ${payload.pointsClaimed.toLocaleString()} XP to ${payload.amountFormatted} in NextGenAchievers.`,
    "",
    `Conversion rate: ${payload.conversionRateLabel}`,
    "",
    "This is a virtual learning balance. If you agreed to a real-world payout, fulfill it through cash, allowance, or your preferred banking app.",
    "",
    "- NextGenAchievers",
  ].join("\n");

  return { subject, body };
}

/**
 * Simulated parent notification when a child cashes in XP to the Save Jar.
 */
export async function dispatchPointsConversionParentEmail(
  payload: PointsConversionEmailPayload,
): Promise<PointsConversionEmailDispatch> {
  const { subject, body } = buildPointsConversionParentEmail(payload);

  await new Promise((resolve) => {
    window.setTimeout(resolve, 350);
  });

  if (typeof console !== "undefined") {
    console.info(
      `[NGA Points Cash-In] Parent notification dispatched to ${payload.parentEmail}`,
      { subject, body },
    );
  }

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
