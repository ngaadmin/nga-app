export type OnboardingEmailType =
  | "EXPLORER_PARENT"
  | "PATHFINDER_PARENT"
  | "MAVERICK_WELCOME"
  | "USERNAME_RECOVERY"
  | "CREDENTIAL_RECOVERY";

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

export type UsernameRecoveryEmailData = {
  username: string;
};

export type CredentialRecoveryEmailData = {
  username: string;
  recoveryCode: string;
};

export type OnboardingEmailDataMap = {
  EXPLORER_PARENT: ExplorerParentEmailData;
  PATHFINDER_PARENT: PathfinderParentEmailData;
  MAVERICK_WELCOME: MaverickWelcomeEmailData;
  USERNAME_RECOVERY: UsernameRecoveryEmailData;
  CREDENTIAL_RECOVERY: CredentialRecoveryEmailData;
};

export type BuiltEmail = {
  subject: string;
  html: string;
  text: string;
  preheader?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Live production origin used for every onboarding/consent email CTA. */
export const PRODUCTION_APP_URL = "https://nga-app-three.vercel.app";

/**
 * Email CTAs always point at the live production app - never localhost,
 * preview hosts, or the request Origin, regardless of where send was triggered.
 */
function resolveAppUrl(_appUrl?: string): string {
  return PRODUCTION_APP_URL;
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

function wrapHtml(options: {
  header: string;
  bodyInner: string;
  preheader?: string;
  footer?: string;
}): string {
  const preheader = options.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        ${escapeHtml(options.preheader)}
      </div>`
    : "";
  const footer = options.footer
    ? `<p style="margin:24px 0 0;font-size:12px;color:#5B6B7C;line-height:1.5;">
        ${options.footer}
      </p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:0;background:#F7F7F7;">
    ${preheader}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F7F7F7;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:28px 24px;font-family:Arial, Helvetica, sans-serif;color:#1E3A5F;line-height:1.55;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#0CC1E0;">
                  NextGenAchievers
                </p>
                <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:#031F82;">
                  ${escapeHtml(options.header)}
                </h1>
                ${options.bodyInner}
                ${footer}
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

  const subject =
    "Action Required: Your child wants to save their progress on NextGenAchiever$";
  const preheader =
    "Approve their account and help them build practical money habits safely.";
  const header = "Welcome to NextGenAchiever$";

  const text = [
    "Hi there,",
    "",
    "Your child has just jumped into NextGenAchiever$\u2122 - an interactive, hands-on app that turns essential money habits and real-world budgeting into an engaging learning experience.",
    "",
    "Kids spend plenty of time on screens, but this time it's spent building practical skills that set them up for life.",
    "",
    "NextGenAchiever$ is strictly an educational tool - not a financial product. There are no real-money transactions, live bank links, or hidden micro-purchases. Everything happens inside a 100% safe, virtualized environment designed purely for learning and practice.",
    "",
    "To back up their earned points, streaks, and badges across devices, they need a parent or guardian to approve their profile:",
    `Selected Username: ${username} (We strictly advise anonymous handles so your child's real name and personal information stay completely safe online).`,
    "",
    `How to approve: Click the button below to approve ${username}'s profile and set your 4-digit Parent PIN so you can manage their account settings and oversight options.`,
    "",
    `Approve Account & Set Parent PIN: ${approveUrl}`,
    "",
    "If you did not request this account, you can safely ignore this email or contact support@nextgenachievers.com.",
    "",
    "- NextGenAchievers",
  ].join("\n");

  const html = wrapHtml({
    header,
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">Hi there,</p>
      <p style="margin:0 0 16px;font-size:16px;">
        Your child has just jumped into NextGenAchiever$&trade; - an interactive, hands-on app that turns
        essential money habits and real-world budgeting into an engaging learning experience.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Kids spend plenty of time on screens, but this time it&apos;s spent building practical skills
        that set them up for life.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        NextGenAchiever$ is strictly an educational tool - not a financial product. There are no
        real-money transactions, live bank links, or hidden micro-purchases. Everything happens inside
        a 100% safe, virtualized environment designed purely for learning and practice.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        To back up their earned points, streaks, and badges across devices, they need a parent or
        guardian to approve their profile:
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        <strong>Selected Username: ${safeName}</strong>
        (We strictly advise anonymous handles so your child&apos;s real name and personal information
        stay completely safe online).
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        How to approve: Click the button below to approve ${safeName}&apos;s profile and set your
        4-digit Parent PIN so you can manage their account settings and oversight options.
      </p>
      ${ctaButton("Approve Account & Set Parent PIN", approveUrl)}
    `,
    footer:
      "If you did not request this account, you can safely ignore this email or contact support@nextgenachievers.com.",
  });

  return { subject, preheader, html, text };
}

export function buildPathfinderParentEmail(
  data: PathfinderParentEmailData,
  appUrl?: string,
): BuiltEmail {
  const username = data.username.trim() || "Your learner";
  const base = resolveAppUrl(appUrl);
  const dashboardClaimUrl = `${base}/onboarding/parent-consent?username=${encodeURIComponent(username)}`;
  const safeName = escapeHtml(username);

  const subject = `${username} just started learning on NextGenAchiever$`;
  const preheader =
    "Set up your Parent Dashboard to follow their practical money journey.";
  const header = "Welcome to NextGenAchiever$\u2122";

  const text = [
    "Hi there,",
    "",
    `Your teenager has created a Pathfinder account on NextGenAchiever$\u2122 using the username ${username} to learn practical, real-world skills in earning, saving, and smart spending.`,
    "",
    "We know how much teens love screen time - so we made sure that time is spent mastering real-world skills they will actually use. NextGenAchiever$ is strictly an educational tool, not a financial product. There are no real-money transactions or financial risks - just interactive, gamified learning in a completely safe, virtualized environment.",
    "",
    "Their account is active so they can start learning right away. As a parent or guardian, you can claim your free Parent Dashboard to follow their progress, see their earned badges, and manage Vault permissions.",
    "",
    `Create Parent Dashboard: ${dashboardClaimUrl}`,
    "",
    "- NextGenAchievers",
  ].join("\n");

  const html = wrapHtml({
    header,
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">Hi there,</p>
      <p style="margin:0 0 16px;font-size:16px;">
        Your teenager has created a Pathfinder account on NextGenAchiever$&trade; using the username
        <strong>${safeName}</strong> to learn practical, real-world skills in earning, saving, and
        smart spending.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        We know how much teens love screen time - so we made sure that time is spent mastering
        real-world skills they will actually use. NextGenAchiever$ is strictly an educational tool,
        not a financial product. There are no real-money transactions or financial risks - just
        interactive, gamified learning in a completely safe, virtualized environment.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Their account is active so they can start learning right away. As a parent or guardian, you
        can claim your free Parent Dashboard to follow their progress, see their earned badges, and
        manage Vault permissions.
      </p>
      ${ctaButton("Create Parent Dashboard", dashboardClaimUrl)}
    `,
  });

  return { subject, preheader, html, text };
}

export function buildMaverickWelcomeEmail(
  data: MaverickWelcomeEmailData,
  appUrl?: string,
): BuiltEmail {
  const username = data.username.trim() || "Maverick";
  const base = resolveAppUrl(appUrl);
  const academyUrl = `${base}/dashboard/academy`;

  const subject = `Welcome to NextGenAchievers, ${username}!`;

  const text = [
    "Welcome to NextGenAchievers! Your account is ready. Jump in to start building real-world financial skills, completing modules, and mastering your financial future.",
    "",
    `Launch Academy: ${academyUrl}`,
    "",
    "- NextGenAchievers",
  ].join("\n");

  const html = wrapHtml({
    header: `Welcome to NextGenAchievers, ${username}!`,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">
        Welcome to NextGenAchievers! Your account is ready. Jump in to start building real-world
        financial skills, completing modules, and mastering your financial future.
      </p>
      ${ctaButton("Launch Academy", academyUrl)}
    `,
  });

  return { subject, html, text };
}

export function buildUsernameRecoveryEmail(
  data: UsernameRecoveryEmailData,
  appUrl?: string,
): BuiltEmail {
  const username = data.username.trim() || "learner";
  const base = resolveAppUrl(appUrl);
  const signInUrl = `${base}/onboarding/sign-in`;

  const subject = "Your NextGenAchievers username";
  const text = [
    `Here's the username linked to this email: ${username}`,
    "",
    `Log back in: ${signInUrl}`,
    "",
    "- NextGenAchievers",
  ].join("\n");

  const html = wrapHtml({
    header: "Your username is ready",
    preheader: `Username reminder for ${username}`,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">
        Here's the username linked to this email:
      </p>
      <p style="margin:0 0 16px;font-size:20px;font-weight:700;color:#031F82;">
        ${escapeHtml(username)}
      </p>
      ${ctaButton("Log Back In", signInUrl)}
    `,
  });

  return { subject, html, text, preheader: `Username reminder for ${username}` };
}

export function buildCredentialRecoveryEmail(
  data: CredentialRecoveryEmailData,
  appUrl?: string,
): BuiltEmail {
  const username = data.username.trim() || "learner";
  const recoveryCode = data.recoveryCode.trim();
  const base = resolveAppUrl(appUrl);
  const signInUrl = `${base}/onboarding/sign-in`;

  const subject = "Reset your NextGenAchievers password";
  const text = [
    `Hi - a password reset was requested for ${username}.`,
    "",
    `Temporary recovery code: ${recoveryCode}`,
    `Use this code as your current password, then change it after you log in.`,
    "",
    `Reset / log in: ${signInUrl}`,
    "",
    "- NextGenAchievers",
  ].join("\n");

  const html = wrapHtml({
    header: "Password reset",
    preheader: "Your temporary recovery code is inside",
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">
        A password reset was requested for
        <strong>${escapeHtml(username)}</strong>.
      </p>
      <p style="margin:0 0 8px;font-size:16px;">
        Temporary recovery code:
      </p>
      <p style="margin:0 0 16px;font-size:28px;font-weight:700;letter-spacing:0.2em;color:#031F82;">
        ${escapeHtml(recoveryCode)}
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#5B6B7C;">
        Use this as your current password, then set a new one after you log in.
      </p>
      ${ctaButton("Log Back In", signInUrl)}
    `,
  });

  return {
    subject,
    html,
    text,
    preheader: "Your temporary recovery code is inside",
  };
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
    case "USERNAME_RECOVERY":
      return buildUsernameRecoveryEmail(
        data as UsernameRecoveryEmailData,
        appUrl,
      );
    case "CREDENTIAL_RECOVERY":
      return buildCredentialRecoveryEmail(
        data as CredentialRecoveryEmailData,
        appUrl,
      );
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unsupported email type: ${_exhaustive}`);
    }
  }
}
