export type OnboardingEmailType =
  | "EXPLORER_PARENT"
  | "PATHFINDER_PARENT"
  | "MAVERICK_WELCOME";

export type ExplorerParentEmailData = {
  username: string;
  token: string;
};

export type PathfinderParentEmailData = {
  username: string;
};

export type MaverickWelcomeEmailData = {
  username: string;
};

export type OnboardingEmailDataMap = {
  EXPLORER_PARENT: ExplorerParentEmailData;
  PATHFINDER_PARENT: PathfinderParentEmailData;
  MAVERICK_WELCOME: MaverickWelcomeEmailData;
};

export type BuiltEmail = {
  subject: string;
  html: string;
  text: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function resolveAppUrl(appUrl?: string): string {
  const raw =
    appUrl?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

function ctaButton(label: string, href: string): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
    <p style="margin: 28px 0;">
      <a
        href="${safeHref}"
        style="
          display: inline-block;
          background: #FFA503;
          color: #031F82;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 15px;
          font-weight: 700;
          text-decoration: none;
          padding: 14px 22px;
          border-radius: 10px;
          border-bottom: 3px solid #C88202;
        "
      >${safeLabel}</a>
    </p>
  `;
}

function wrapHtml(bodyInner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#F7F7F7;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F7F7F7;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:28px 24px;font-family:Arial, Helvetica, sans-serif;color:#1E3A5F;line-height:1.55;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#0CC1E0;">
                  NextGenAchievers
                </p>
                ${bodyInner}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function buildExplorerParentEmail(
  data: ExplorerParentEmailData,
  appUrl?: string,
): BuiltEmail {
  const username = data.username.trim() || "your learner";
  const base = resolveAppUrl(appUrl);
  const approveUrl = `${base}/onboarding/parent-consent?token=${encodeURIComponent(data.token)}`;
  const safeName = escapeHtml(username);

  const subject = `Action Required: Approve ${username}'s NextGenAchievers Account`;

  const text = [
    "Hi there,",
    "",
    `Your child (username: ${username}) wants to save their progress on NextGenAchievers — the fun, real-world way to learn money skills.`,
    "",
    "Because they are under 14, COPPA & privacy guidelines require your permission before we can sync their badges, streaks, and Vault savings across devices.",
    "",
    `Approve ${username}'s Profile: ${approveUrl}`,
    "",
    "When you click to approve, you'll set up a 4-digit Parent PIN to manage master account settings.",
    "",
    "Your email stays private and is never used for marketing unless you give us explicit permission.",
    "",
    "- NextGenAchievers",
  ].join("\n");

  const html = wrapHtml(`
    <p style="margin:0 0 16px;font-size:16px;">Hi there,</p>
    <p style="margin:0 0 16px;font-size:16px;">
      Your child (username: <strong>${safeName}</strong>) wants to save their progress on
      NextGenAchievers — the fun, real-world way to learn money skills.
    </p>
    <p style="margin:0 0 16px;font-size:16px;">
      Because they are under 14, COPPA &amp; privacy guidelines require your permission
      before we can sync their badges, streaks, and Vault savings across devices.
    </p>
    ${ctaButton(`Approve ${username}'s Profile`, approveUrl)}
    <p style="margin:0 0 16px;font-size:15px;">
      When you click to approve, you&apos;ll set up a 4-digit Parent PIN to manage master
      account settings.
    </p>
    <p style="margin:0;font-size:13px;color:#5B6B7C;">
      Your email stays private and is never used for marketing unless you give us
      explicit permission.
    </p>
  `);

  return { subject, html, text };
}

export function buildPathfinderParentEmail(
  data: PathfinderParentEmailData,
  appUrl?: string,
): BuiltEmail {
  const username = data.username.trim() || "Your learner";
  const base = resolveAppUrl(appUrl);
  const dashboardClaimUrl = `${base}/onboarding/parent-consent?username=${encodeURIComponent(username)}`;
  const safeName = escapeHtml(username);

  const subject = `${username} just created a NextGenAchievers Account`;

  const text = [
    "Hi there,",
    "",
    `${username} (ages 13–15) has created a Pathfinder account on NextGenAchievers to master real-world financial literacy.`,
    "",
    "As a parent or guardian, you can set up a Parent Dashboard to view their progress, manage Vault controls, and support their journey.",
    "",
    `Claim Parent Dashboard: ${dashboardClaimUrl}`,
    "",
    "Your email stays private and is never used for marketing unless you give us explicit permission.",
    "",
    "- NextGenAchievers",
  ].join("\n");

  const html = wrapHtml(`
    <p style="margin:0 0 16px;font-size:16px;">Hi there,</p>
    <p style="margin:0 0 16px;font-size:16px;">
      <strong>${safeName}</strong> (ages 13–15) has created a Pathfinder account on
      NextGenAchievers to master real-world financial literacy.
    </p>
    <p style="margin:0 0 16px;font-size:16px;">
      As a parent or guardian, you can set up a Parent Dashboard to view their progress,
      manage Vault controls, and support their journey.
    </p>
    ${ctaButton("Claim Parent Dashboard", dashboardClaimUrl)}
    <p style="margin:0;font-size:13px;color:#5B6B7C;">
      Your email stays private and is never used for marketing unless you give us
      explicit permission.
    </p>
  `);

  return { subject, html, text };
}

export function buildMaverickWelcomeEmail(
  data: MaverickWelcomeEmailData,
  appUrl?: string,
): BuiltEmail {
  const username = data.username.trim() || "Maverick";
  const base = resolveAppUrl(appUrl);
  const dashboardUrl = `${base}/dashboard`;
  const safeName = escapeHtml(username);

  const subject = `Welcome to NextGenAchievers, ${username}!`;

  const text = [
    `Welcome aboard, ${username}!`,
    "",
    "You're now on the Maverick track (16+). Get ready to master cash flow, investment strategies, and real-world business building.",
    "",
    `Go to Dashboard: ${dashboardUrl}`,
    "",
    "- NextGenAchievers",
  ].join("\n");

  const html = wrapHtml(`
    <p style="margin:0 0 16px;font-size:16px;">
      Welcome aboard, <strong>${safeName}</strong>!
    </p>
    <p style="margin:0 0 16px;font-size:16px;">
      You&apos;re now on the Maverick track (16+). Get ready to master cash flow,
      investment strategies, and real-world business building.
    </p>
    ${ctaButton("Go to Dashboard", dashboardUrl)}
  `);

  return { subject, html, text };
}

export function buildOnboardingEmail<T extends OnboardingEmailType>(
  type: T,
  data: OnboardingEmailDataMap[T],
  appUrl?: string,
): BuiltEmail {
  switch (type) {
    case "EXPLORER_PARENT":
      return buildExplorerParentEmail(
        data as ExplorerParentEmailData,
        appUrl,
      );
    case "PATHFINDER_PARENT":
      return buildPathfinderParentEmail(
        data as PathfinderParentEmailData,
        appUrl,
      );
    case "MAVERICK_WELCOME":
      return buildMaverickWelcomeEmail(
        data as MaverickWelcomeEmailData,
        appUrl,
      );
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unsupported email type: ${_exhaustive}`);
    }
  }
}
