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
  cohort?: "explorer" | "pathfinder" | "maverick";
  /** Parent master username (Explorer recovery). */
  masterUsername?: string;
  /** Linked Explorer usernames (Explorer recovery). */
  linkedUsernames?: string[];
};

export type CredentialRecoveryEmailData = {
  username: string;
  recoveryCode: string;
  /** Explorer uses parent-facing subject + masked username. */
  cohort?: "explorer" | "pathfinder" | "maverick";
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
  const privacyUrl = `${base}/privacy`;
  const learningPath = "Explorer - for learners aged 12 and under";
  const safeName = escapeHtml(username);
  const safePath = escapeHtml(learningPath);
  const safePrivacy = escapeHtml(privacyUrl);

  const subject =
    "Action required: Your child wants to join NextGenAchiever$ for learning essential money skills";
  const preheader =
    "Approve their profile to save progress and create your master account.";
  const header = "Welcome to NextGenAchiever$\u2122";

  const text = [
    "Hi there,",
    "",
    "Congratulations! Your child has started their journey of learning the essential money habits that can set them up for a life of financial freedom on the NextGenAchiever$ app.",
    "",
    "We know how much kids love screen time - so we made sure that time is spent mastering real-world money skills they will actually need.",
    "",
    "Don't worry! NextGenAchiever$ is strictly an educational tool - not a financial product.",
    "There are no real-money transactions, live bank links, or hidden micro-purchases. Everything happens inside a 100% safe, virtualized environment designed purely for learning and practice.",
    "",
    "To make their profile official and save their progress, they need a parent or guardian to approve.",
    `Profile name: ${username}`,
    `Learning path chosen: ${learningPath}`,
    "",
    "Once you approve, we will save their username, progress, achievements and activity in the app so they don't lose their work. You'll be able to view their progress and delete the account at any time. We do not sell or share your child's information with third parties for advertising.",
    "",
    `Full details on what we collect and how we use it are here: ${privacyUrl}`,
    "",
    "How to approve: Click the button below to create your master account. This lets you manage parental controls and track your learner's progress.",
    "",
    `APPROVE & CREATE ACCOUNT: ${approveUrl}`,
    "",
    "If you did not request this account, you can safely ignore this email or contact support@nextgenachievers.com.",
    "",
    "The Team at NextGenAchiever$",
  ].join("\n");

  const html = wrapHtml({
    header,
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">Hi there,</p>
      <p style="margin:0 0 16px;font-size:16px;">
        <strong>Congratulations! Your child has started their journey of learning the essential money habits
        that can set them up for a life of financial freedom on the NextGenAchiever$ app.</strong>
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        We know how much kids love screen time - so we made sure that time is spent mastering
        real-world money skills they will actually need.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        <strong>Don&apos;t worry! NextGenAchiever$ is strictly an educational tool - not a financial product.</strong>
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        There are no real-money transactions, live bank links, or hidden micro-purchases. Everything
        happens inside a 100% safe, virtualized environment designed purely for learning and practice.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        <strong>To make their profile official and save their progress, they need a parent or guardian to approve.</strong>
      </p>
      <p style="margin:0 0 8px;font-size:16px;">
        <strong>Profile name: ${safeName}</strong>
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        <strong>Learning path chosen: ${safePath}</strong>
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Once you approve, we will save their username, progress, achievements and activity in the app
        so they don&apos;t lose their work. You&apos;ll be able to view their progress and delete the
        account at any time. We do not sell or share your child&apos;s information with third parties
        for advertising.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Full details on what we collect and how we use it are here:
        <a href="${safePrivacy}" style="color:#0CC1E0;font-weight:700;">${safePrivacy}</a>
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        How to approve: Click the button below to create your master account. This lets you manage
        parental controls and track your learner&apos;s progress.
      </p>
      ${ctaButton("APPROVE & CREATE ACCOUNT", approveUrl)}
      <p style="margin:24px 0 0;font-size:12px;color:#5B6B7C;line-height:1.5;">
        If you did not request this account, you can safely ignore this email or contact
        support@nextgenachievers.com.
      </p>
      <p style="margin:24px 0 0;font-size:16px;">
        The Team at NextGenAchiever$
      </p>
    `,
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

  const subject = `${username} just started learning on NextGenAchiever$`;
  const preheader =
    "Claim your free Parent dashboard to follow their progress.";
  const header = "Welcome to NextGenAchiever$\u2122";

  const text = [
    "Hi there,",
    "",
    "Your teenager has created an account with us. This means they started their journey of learning the essential money habits that can set them up for a life of financial freedom.",
    "",
    "We know how much teens love screen time - so we made sure that time is spent mastering real-world money skills they will actually need.",
    "",
    "Don't worry! NextGenAchiever$\u2122 is strictly an educational tool - not a financial product.",
    "There are no real-money transactions, live bank links, or hidden micro-purchases. Everything happens inside a 100% safe, virtualized environment designed purely for learning and practice.",
    "",
    "Their account is active so they can start learning and playing right away. As a parent or guardian, you can claim your free Parent dashboard to follow their progress, see the skills they've learned and manage other permissions.",
    "",
    `Create Parent Login: ${dashboardClaimUrl}`,
    "",
    "- NextGenAchievers",
  ].join("\n");

  const html = wrapHtml({
    header,
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">Hi there,</p>
      <p style="margin:0 0 16px;font-size:16px;">
        Your teenager has created an account with us. This means they started their journey of
        learning the essential money habits that can set them up for a life of financial freedom.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        We know how much teens love screen time - so we made sure that time is spent mastering
        real-world money skills they will actually need.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Don&apos;t worry! NextGenAchiever$&trade; is strictly an educational tool - not a financial product.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        There are no real-money transactions, live bank links, or hidden micro-purchases. Everything
        happens inside a 100% safe, virtualized environment designed purely for learning and practice.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Their account is active so they can start learning and playing right away. As a parent or
        guardian, you can claim your free Parent dashboard to follow their progress, see the skills
        they&apos;ve learned and manage other permissions.
      </p>
      ${ctaButton("CREATE PARENT LOGIN", dashboardClaimUrl)}
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

  const subject = `Welcome to NextGenAchiever$, ${username}!`;
  const preheader = "Your account is ready - jump into Academy.";
  const header = "Welcome to NextGenAchiever$\u2122!";

  const text = [
    "Welcome to NextGenAchiever$\u2122!",
    "",
    "Your account is ready. Jump in to start building real-world financial skills. Complete modules, play with the advanced money tools and manage your (virtual) money in the Vault.",
    "",
    "NextGenAchiever$\u2122 is strictly an educational tool - not a financial product.",
    "There are no real-money transactions, live bank links, or hidden micro-purchases. Everything happens inside a 100% safe, virtualized environment designed purely for learning and practice.",
    "",
    "Congratulations, you're on your way to mastering your financial future!",
    "",
    `Launch Academy: ${academyUrl}`,
    "",
    "If you did not request this account, you can safely ignore this email or contact support@nextgenachievers.com.",
    "",
    "- NextGenAchievers",
  ].join("\n");

  const html = wrapHtml({
    header,
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">
        Your account is ready. Jump in to start building real-world financial skills. Complete
        modules, play with the advanced money tools and manage your (virtual) money in the Vault.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        NextGenAchiever$&trade; is strictly an educational tool - not a financial product.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        There are no real-money transactions, live bank links, or hidden micro-purchases. Everything
        happens inside a 100% safe, virtualized environment designed purely for learning and practice.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Congratulations, you&apos;re on your way to mastering your financial future!
      </p>
      ${ctaButton("LAUNCH ACADEMY", academyUrl)}
    `,
    footer:
      "If you did not request this account, you can safely ignore this email or contact support@nextgenachievers.com.",
  });

  return { subject, preheader, html, text };
}

export function buildUsernameRecoveryEmail(
  data: UsernameRecoveryEmailData,
  appUrl?: string,
): BuiltEmail {
  const username = data.username.trim() || "learner";
  const isExplorer = data.cohort === "explorer";
  const base = resolveAppUrl(appUrl);
  const signInUrl = `${base}/onboarding/sign-in`;

  if (isExplorer) {
    const masterUsername =
      (data.masterUsername?.trim() || username) || "Master";
    const linked = (
      data.linkedUsernames?.length
        ? data.linkedUsernames
        : [username]
    )
      .map((name) => name.trim())
      .filter(Boolean);

    const subject = "Your NextGenAchiever$ usernames";
    const preheader = "Your Master and Explorer usernames are inside";

    const linkedLines = linked.map((name) => `- ${name}`);
    const text = [
      "Here are the usernames linked to this email:",
      "",
      `Master: ${masterUsername}`,
      "Explorer accounts:",
      ...linkedLines,
      "",
      `Log back in: ${signInUrl}`,
      "",
      "- NextGenAchievers",
    ].join("\n");

    const linkedHtml = linked
      .map(
        (name) =>
          `<li style="margin:0 0 6px;font-size:16px;font-weight:700;color:#031F82;">${escapeHtml(name)}</li>`,
      )
      .join("");

    const html = wrapHtml({
      header: subject,
      preheader,
      bodyInner: `
        <p style="margin:0 0 16px;font-size:16px;">
          Here are the usernames linked to this email:
        </p>
        <p style="margin:0 0 8px;font-size:16px;">
          <strong>Master:</strong>
          <span style="font-size:18px;font-weight:700;color:#031F82;">
            ${escapeHtml(masterUsername)}
          </span>
        </p>
        <p style="margin:0 0 8px;font-size:16px;">
          <strong>Explorer accounts:</strong>
        </p>
        <ul style="margin:0 0 16px;padding-left:20px;">
          ${linkedHtml}
        </ul>
        ${ctaButton("Log Back In", signInUrl)}
      `,
    });

    return { subject, html, text, preheader };
  }

  const subject = "Your NextGenAchiever$ username";
  const preheader = `Username reminder for ${username}`;
  const text = [
    `Here's the username linked to this email: ${username}`,
    "",
    `Log back in: ${signInUrl}`,
    "",
    "- NextGenAchievers",
  ].join("\n");

  const html = wrapHtml({
    header: subject,
    preheader,
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

  return { subject, html, text, preheader };
}

function maskUsernameForParent(username: string): string {
  const trimmed = username.trim();
  if (trimmed.length <= 3) return trimmed;
  const middleCount = Math.max(trimmed.length - 3, 1);
  return `${trimmed[0]}${"•".repeat(middleCount)}${trimmed.slice(-2)}`;
}

export function buildCredentialRecoveryEmail(
  data: CredentialRecoveryEmailData,
  appUrl?: string,
): BuiltEmail {
  const rawUsername = data.username.trim() || "learner";
  const isExplorer = data.cohort === "explorer";
  const displayUsername = isExplorer
    ? maskUsernameForParent(rawUsername)
    : rawUsername;
  const recoveryCode = data.recoveryCode.trim();
  const base = resolveAppUrl(appUrl);
  const signInUrl = `${base}/onboarding/sign-in`;

  const subject = isExplorer
    ? "Reset your child's NextGenAchiever$ password"
    : "Reset your NextGenAchiever$ password";
  const preheader = "Your temporary password is inside";

  const text = [
    `Hi - a password reset was requested for ${displayUsername}.`,
    "",
    `Temporary password: ${recoveryCode}`,
    `Use this as the current password, then set a new one after you log in.`,
    "",
    `Reset / log in: ${signInUrl}`,
    "",
    "- NextGenAchievers",
  ].join("\n");

  const html = wrapHtml({
    header: "Password reset",
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">
        A password reset was requested for
        <strong>${escapeHtml(displayUsername)}</strong>.
      </p>
      <p style="margin:0 0 8px;font-size:16px;">
        Temporary password:
      </p>
      <p style="margin:0 0 16px;font-size:28px;font-weight:700;letter-spacing:0.2em;color:#031F82;">
        ${escapeHtml(recoveryCode)}
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#5B6B7C;">
        Use this as the current password, then set a new one after you log in.
      </p>
      ${ctaButton("Log Back In", signInUrl)}
    `,
  });

  return {
    subject,
    html,
    text,
    preheader,
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
