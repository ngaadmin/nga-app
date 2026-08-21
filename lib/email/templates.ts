export type OnboardingEmailType =
  | "EXPLORER_PARENT"
  | "EXPLORER_PARENT_RESEND"
  | "PATHFINDER_PARENT"
  | "PATHFINDER_PARENT_LINKED"
  | "PATHFINDER_WELCOME"
  | "MAVERICK_WELCOME"
  | "PARENT_WELCOME"
  | "USERNAME_RECOVERY"
  | "CREDENTIAL_RECOVERY"
  | "ACCOUNT_DELETED_MASTER"
  | "ACCOUNT_DELETED_CHILD";

export type ExplorerParentEmailData = {
  username: string;
  token: string;
};

/** Same payload shape as the initial Explorer parent approval email. */
export type ExplorerParentResendEmailData = ExplorerParentEmailData;

/** FYI / claim-dashboard email when no master account exists yet. */
export type PathfinderParentEmailData = {
  username: string;
  /** Portable claim token for optional Create Master Profile. */
  token: string;
};

/** Short notice when a Pathfinder is auto-linked to an existing master. */
export type PathfinderParentLinkedEmailData = {
  username: string;
  masterUsername?: string;
};

/** Welcome email to the Pathfinder learner after signup. */
export type PathfinderWelcomeEmailData = {
  username: string;
};

export type MaverickWelcomeEmailData = {
  username: string;
};

/** Welcome email after a parent / master account is created. */
export type ParentWelcomeEmailData = {
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
  label: string;
  token: string;
  kind?: "parent" | "child";
};

export type AccountDeletedMasterEmailData = {
  childUsernames?: string[];
};

export type AccountDeletedChildEmailData = {
  username: string;
};

export type OnboardingEmailDataMap = {
  EXPLORER_PARENT: ExplorerParentEmailData;
  EXPLORER_PARENT_RESEND: ExplorerParentResendEmailData;
  PATHFINDER_PARENT: PathfinderParentEmailData;
  PATHFINDER_PARENT_LINKED: PathfinderParentLinkedEmailData;
  PATHFINDER_WELCOME: PathfinderWelcomeEmailData;
  MAVERICK_WELCOME: MaverickWelcomeEmailData;
  PARENT_WELCOME: ParentWelcomeEmailData;
  USERNAME_RECOVERY: UsernameRecoveryEmailData;
  CREDENTIAL_RECOVERY: CredentialRecoveryEmailData;
  ACCOUNT_DELETED_MASTER: AccountDeletedMasterEmailData;
  ACCOUNT_DELETED_CHILD: AccountDeletedChildEmailData;
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

/** Last-resort host when NEXT_PUBLIC_APP_URL is unset (local/misconfigured). */
const FALLBACK_APP_URL = "https://nga-app-three.vercel.app";

/**
 * Canonical app origin for email CTAs and allowlisting.
 * Prefers `NEXT_PUBLIC_APP_URL`, then the hardcoded production fallback.
 */
export function getDefaultAppUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) {
    try {
      return new URL(fromEnv).origin;
    } catch {
      // fall through
    }
  }
  return FALLBACK_APP_URL;
}

/**
 * @deprecated Prefer {@link getDefaultAppUrl}. Kept for existing imports.
 * Resolves to the same env-aware origin.
 */
export const PRODUCTION_APP_URL = getDefaultAppUrl();

/**
 * Consent/approval links must use the same origin that signed the token.
 * Prefer the send-route appUrl (request host); fall back to env/default.
 */
function resolveAppUrl(appUrl?: string): string {
  const trimmed = appUrl?.trim();
  if (trimmed) {
    try {
      return new URL(trimmed).origin;
    } catch {
      // fall through
    }
  }
  return getDefaultAppUrl();
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

const PENNY_IMAGE_PATH = "/assets/illustrations/website/Penny.png";
const PRIVACY_POLICY_URL = "https://www.nextgenachievers.com/privacy";
const SUPPORT_EMAIL = "support@nextgenachievers.com";

function pennyIllustration(appUrl?: string): string {
  const src = `${resolveAppUrl(appUrl)}${PENNY_IMAGE_PATH}`;
  return `
    <p style="margin:20px 0;text-align:center;">
      <img
        src="${escapeHtml(src)}"
        alt="Penny"
        width="160"
        height="160"
        style="display:inline-block;max-width:160px;width:100%;height:auto;border:0;"
      />
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
  const approveUrl = `${base}/onboarding/sign-up?role=parent_master&token=${encodeURIComponent(data.token)}`;
  const safeName = escapeHtml(username);

  const subject = `Your child ${username} wants to build money skills - approval needed`;
  const preheader =
    "One quick approval saves their progress and opens your parent view";
  const header = "Their journey to financial freedom starts here";

  const text = [
    "Hi there,",
    "",
    `${username} wants to save their progress on NextGenAchiever$.`,
    "",
    "It's a free app that turns screen time into money sense (but don't worry, no real cash or bank accounts involved).",
    "",
    "Did you know? Kids who learn to save and grow money in their early teens can end up $100,000s ahead of peers who start later, by middle age.",
    "",
    "Your child has chosen the Explorer track, for kids aged 10-12. And to make their profile official, we need a parent/guardian's approval.",
    "",
    `Approve & create account: ${approveUrl}`,
    "",
    "Create your parent account to follow what they learn and achieve. You can even set an exchange rate so the points they earn can turn into real pocket money at home.",
    "",
    "If you didn't expect this, you can ignore it. The approval link expires and no account is created without you.",
    "",
    "Here's to them owning their future,",
    "",
    "The Team at NextGenAchiever$",
  ].join("\n");

  const html = wrapHtml({
    header,
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">Hi there,</p>
      <p style="margin:0 0 16px;font-size:16px;">
        ${safeName} wants to save their progress on NextGenAchiever$.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        It&apos;s a free app that <strong>turns screen time into money sense</strong>
        (but don&apos;t worry, no real cash or bank accounts involved).
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Did you know? Kids who learn to save and grow money in their early teens can
        end up $100,000s ahead of peers who start later, by middle age.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Your child has chosen the Explorer track, for kids aged 10-12. And to make
        their profile official, we need a parent/guardian&apos;s approval.
      </p>
      ${ctaButton("Approve & create account", approveUrl)}
      <p style="margin:0 0 16px;font-size:16px;">
        Create your parent account to follow what they learn and achieve. You can even
        set an exchange rate so the points they earn can turn into real pocket money
        at home.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        If you didn&apos;t expect this, you can ignore it. The approval link expires
        and no account is created without you.
      </p>
      <p style="margin:0 0 8px;font-size:16px;">
        Here&apos;s to them owning their future,
      </p>
      ${pennyIllustration(appUrl)}
      <p style="margin:0;font-size:16px;">
        The Team at NextGenAchiever$
      </p>
    `,
  });

  return { subject, preheader, html, text };
}

export function buildExplorerParentResendEmail(
  data: ExplorerParentResendEmailData,
  appUrl?: string,
): BuiltEmail {
  const username = data.username.trim() || "your learner";
  const base = resolveAppUrl(appUrl);
  const approveUrl = `${base}/onboarding/sign-up?role=parent_master&token=${encodeURIComponent(data.token)}`;
  const safeName = escapeHtml(username);

  const subject = "Here's your NextGenAchiever$ approval link again";
  const preheader = "Your previous approval link expired. Use this fresh link.";
  const header = "Your approval link is ready";

  const text = [
    "Hi there,",
    "",
    `The previous approval link for ${username}'s NextGenAchiever$ profile expired.`,
    "Use this fresh link to approve their Explorer profile. Nothing else has changed.",
    "",
    `APPROVE PROFILE: ${approveUrl}`,
    "",
    "If you did not request this, you can ignore this email.",
    "",
    "The Team at NextGenAchiever$",
  ].join("\n");

  const html = wrapHtml({
    header,
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">Hi there,</p>
      <p style="margin:0 0 16px;font-size:16px;">
        The previous approval link for <strong>${safeName}</strong>&apos;s NextGenAchiever$
        profile expired. Use this fresh link to approve their Explorer profile.
        Nothing else has changed.
      </p>
      ${ctaButton("APPROVE PROFILE", approveUrl)}
      <p style="margin:24px 0 0;font-size:12px;color:#5B6B7C;line-height:1.5;">
        If you did not request this, you can ignore this email.
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
  const username = data.username.trim() || "your learner";
  const base = resolveAppUrl(appUrl);
  const claimUrl = `${base}/onboarding/sign-up?role=parent_master&token=${encodeURIComponent(data.token)}`;
  const learningPath = "Pathfinder - ages 13-15";
  const safeName = escapeHtml(username);
  const safePath = escapeHtml(learningPath);
  const safePrivacy = escapeHtml(PRIVACY_POLICY_URL);

  const subject = `${username} just started learning on NextGenAchiever$`;
  const preheader =
    "No approval needed. Optionally create a free parent account to follow along.";
  const header = "A Pathfinder profile is now active";

  const text = [
    "Hi there,",
    "",
    `${username} just created a Pathfinder profile on NextGenAchiever$.`,
    "No approval is needed - their account is already active.",
    "",
    "NextGenAchiever$ turns screen time into money sense. It is an educational tool - not a financial product. No real-money transactions, live bank links, or hidden micro-purchases.",
    "",
    `Profile name: ${username}`,
    `Learning path: ${learningPath}`,
    "",
    "As a parent/guardian, you can optionally create a free master account to follow their progress and manage permissions. You can delete accounts at any time. We do not sell or share your child's information with third parties for advertising.",
    "",
    `CREATE PARENT ACCOUNT (optional): ${claimUrl}`,
    "",
    `Privacy Policy: ${PRIVACY_POLICY_URL}`,
    "",
    `If you did not expect this email, ignore it or contact ${SUPPORT_EMAIL}.`,
    "",
    "The Team at NextGenAchiever$",
  ].join("\n");

  const html = wrapHtml({
    header,
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">Hi there,</p>
      <p style="margin:0 0 16px;font-size:16px;">
        <strong>${safeName}</strong> just created a Pathfinder profile on NextGenAchiever$.
        <strong>No approval is needed</strong> - their account is already active.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        NextGenAchiever$ turns screen time into money sense. It is an educational tool - not a
        financial product. No real-money transactions, live bank links, or hidden micro-purchases.
      </p>
      <p style="margin:0 0 8px;font-size:16px;">
        <strong>Profile name: ${safeName}</strong>
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        <strong>Learning path: ${safePath}</strong>
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        As a parent/guardian, you can optionally create a free master account to follow their
        progress and manage permissions. You can delete accounts at any time. We do not sell or
        share your child&apos;s information with third parties for advertising.
      </p>
      ${ctaButton("CREATE PARENT ACCOUNT", claimUrl)}
      <p style="margin:0 0 16px;font-size:16px;">
        <a href="${safePrivacy}" style="color:#0CC1E0;font-weight:700;">Privacy Policy</a>
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#5B6B7C;line-height:1.5;">
        If you did not expect this email, ignore it or contact ${escapeHtml(SUPPORT_EMAIL)}.
      </p>
      ${pennyIllustration(appUrl)}
      <p style="margin:24px 0 0;font-size:16px;">
        The Team at NextGenAchiever$
      </p>
    `,
  });

  return { subject, preheader, html, text };
}

export function buildPathfinderParentLinkedEmail(
  data: PathfinderParentLinkedEmailData,
  _appUrl?: string,
): BuiltEmail {
  const username = data.username.trim() || "your learner";
  const masterLabel = data.masterUsername?.trim();

  const subject = `${username} was added to your NextGenAchiever$ parent dashboard`;
  const preheader = "A new Pathfinder profile is linked to your parent account.";
  const header = "New profile linked";

  const text = [
    "Hi there,",
    "",
    `${username} just created a Pathfinder profile on NextGenAchiever$.`,
    masterLabel
      ? `They've been linked to your parent account (${masterLabel}).`
      : "They've been linked to your parent account.",
    "",
    "No action is needed - their account is already active. Sign in anytime to follow their progress.",
    "",
    "The Team at NextGenAchiever$",
  ].join("\n");

  const html = wrapHtml({
    header,
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">Hi there,</p>
      <p style="margin:0 0 16px;font-size:16px;">
        <strong>${escapeHtml(username)}</strong> just created a Pathfinder profile on NextGenAchiever$.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        ${
          masterLabel
            ? `They&apos;ve been linked to your parent account (<strong>${escapeHtml(masterLabel)}</strong>).`
            : "They&apos;ve been linked to your parent account."
        }
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        <strong>No action is needed</strong> - their account is already active. Sign in anytime to
        follow their progress.
      </p>
      <p style="margin:24px 0 0;font-size:16px;">
        The Team at NextGenAchiever$
      </p>
    `,
  });

  return { subject, preheader, html, text };
}

export function buildPathfinderWelcomeEmail(
  data: PathfinderWelcomeEmailData,
  appUrl?: string,
): BuiltEmail {
  const username = data.username.trim() || "Pathfinder";
  const base = resolveAppUrl(appUrl);
  const academyUrl = `${base}/dashboard/academy`;

  const subject = `Welcome to NextGenAchiever$, ${username}`;
  const preheader = "Your Pathfinder account is ready. Jump into Academy.";
  const header = "You're in";

  const text = [
    `Hi ${username},`,
    "",
    "Congratulations! You're officially on your way to financial independence.",
    "",
    "Did you know? Teens who build money skills early can end up $100,000s ahead of peers who start later.",
    "",
    "Get smart with money in the Academy, start your own business in days with Launchpad, or beat your friends in the monthly challenges.",
    "",
    "And yes, you can even negotiate with your parents to get paid for the points you earn in the app.",
    "",
    "Let's go!",
    "",
    `Launch Academy: ${academyUrl}`,
    "",
    "The Team at NextGenAchiever$",
  ].join("\n");

  const html = wrapHtml({
    header,
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">
        Hi ${escapeHtml(username)},
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Congratulations! You&apos;re officially on your way to financial independence.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Did you know? Teens who build money skills early can end up $100,000s ahead of
        peers who start later.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Get smart with money in the Academy, start your own business in days with Launchpad,
        or beat your friends in the monthly challenges.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        And yes, you can even negotiate with your parents to get paid for the points you
        earn in the app.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">Let&apos;s go!</p>
      ${ctaButton("Launch Academy", academyUrl)}
      <p style="margin:24px 0 0;font-size:16px;">
        The Team at NextGenAchiever$
      </p>
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

  const subject = `Welcome to NextGenAchiever$, ${username}`;
  const preheader = "Your Maverick account is ready. Jump into Academy.";
  const header = "You're in";

  const text = [
    `Hi ${username},`,
    "",
    "Congratulations! You're officially on your way to financial independence.",
    "",
    "Did you know? Teens who build money skills early can end up $100,000s ahead of peers who start later.",
    "",
    "Get smart with money in the Academy, start your own business in days with Launchpad, or beat your friends in the monthly challenges.",
    "",
    "And yes, you can even negotiate with your parents to get paid for the points you earn in the app.",
    "",
    "Let's go!",
    "",
    `Launch Academy: ${academyUrl}`,
    "",
    "The Team at NextGenAchiever$",
  ].join("\n");

  const html = wrapHtml({
    header,
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">
        Hi ${escapeHtml(username)},
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Congratulations! You&apos;re officially on your way to financial independence.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Did you know? Teens who build money skills early can end up $100,000s ahead of
        peers who start later.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Get smart with money in the Academy, start your own business in days with Launchpad,
        or beat your friends in the monthly challenges.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        And yes, you can even negotiate with your parents to get paid for the points you
        earn in the app.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">Let&apos;s go!</p>
      ${ctaButton("Launch Academy", academyUrl)}
      <p style="margin:24px 0 0;font-size:16px;">
        The Team at NextGenAchiever$
      </p>
    `,
  });

  return { subject, preheader, html, text };
}

export function buildParentWelcomeEmail(
  data: ParentWelcomeEmailData,
  appUrl?: string,
): BuiltEmail {
  const username = data.username.trim();
  const greeting = username ? `Hi ${username},` : "Hi there,";
  const base = resolveAppUrl(appUrl);
  const accountUrl = `${base}/dashboard/settings/account`;

  const subject = "Welcome to NextGenAchiever$";
  const preheader = "The road to financial freedom for your child starts here";
  const header = "Let's get them started!";

  const text = [
    greeting,
    "",
    "Your NextGenAchiever$ parent account is ready.",
    "",
    "Follow your child's progress. And if you want to, jump in yourself.",
    "",
    "It's never too late to build stronger money habits. Use the same app to sharpen your own skills, explore new ideas, and even test a side hustle if you're curious.",
    "",
    `Open account settings: ${accountUrl}`,
    "",
    "The Team at NextGenAchiever$",
  ].join("\n");

  const html = wrapHtml({
    header,
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">
        ${escapeHtml(greeting)}
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Your NextGenAchiever$ parent account is ready.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Follow your child&apos;s progress. And if you want to, jump in yourself.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        It&apos;s never too late to build stronger money habits. Use the same app to
        sharpen your own skills, explore new ideas, and even test a side hustle if
        you&apos;re curious.
      </p>
      ${ctaButton("Open account settings", accountUrl)}
      <p style="margin:24px 0 0;font-size:16px;">
        The Team at NextGenAchiever$
      </p>
    `,
  });

  return { subject, preheader, html, text };
}

export function buildUsernameRecoveryEmail(
  data: UsernameRecoveryEmailData,
  appUrl?: string,
): BuiltEmail {
  const base = resolveAppUrl(appUrl);
  const signInUrl = `${base}/onboarding/sign-in`;
  const linked = (data.linkedUsernames ?? [])
    .map((name) => name.trim())
    .filter(Boolean);
  if (linked.length > 0) {
    const subject = "Your NextGenAchiever$ learner usernames";
    const preheader = "Learner usernames linked to this parent email";
    const textLines = [
      "Parents log in with this email. These usernames are linked to it:",
      "",
      ...linked.map((name) => `- ${name}`),
      "",
      `Log back in: ${signInUrl}`,
      "",
      "The Team at NextGenAchiever$",
    ];
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
          Parents log in with this email. These usernames are linked to it:
        </p>
        <ul style="margin:0 0 16px;padding-left:20px;">
          ${linkedHtml}
        </ul>
        ${ctaButton("Log Back In", signInUrl)}
        <p style="margin:24px 0 0;font-size:16px;">
          The Team at NextGenAchiever$
        </p>
      `,
    });
    return { subject, html, text: textLines.join("\n"), preheader };
  }

  const username = data.username.trim() || "learner";
  const isExplorer = data.cohort === "explorer";

  if (isExplorer) {
    const masterUsername = data.masterUsername?.trim() || "";
    const linked = (data.linkedUsernames ?? [])
      .map((name) => name.trim())
      .filter(Boolean);
    // Fallback when callers omit household fields: treat `username` as an Explorer.
    const explorerNames =
      linked.length > 0 ? linked : masterUsername ? [] : [username];

    const subject = "Your NextGenAchiever$ usernames";
    const preheader = "Your Master and Explorer usernames are inside";

    const textLines = [
      "Here are the usernames linked to this email:",
      "",
      masterUsername ? `Master: ${masterUsername}` : "Master: (not set up yet)",
      "Explorer accounts:",
      ...(explorerNames.length > 0
        ? explorerNames.map((name) => `- ${name}`)
        : ["- (none on file)"]),
      "",
      `Log back in: ${signInUrl}`,
      "",
      "The Team at NextGenAchiever$",
    ];

    const linkedHtml =
      explorerNames.length > 0
        ? explorerNames
            .map(
              (name) =>
                `<li style="margin:0 0 6px;font-size:16px;font-weight:700;color:#031F82;">${escapeHtml(name)}</li>`,
            )
            .join("")
        : `<li style="margin:0 0 6px;font-size:16px;color:#5B6B7C;">(none on file)</li>`;

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
            ${escapeHtml(masterUsername || "(not set up yet)")}
          </span>
        </p>
        <p style="margin:0 0 8px;font-size:16px;">
          <strong>Explorer accounts:</strong>
        </p>
        <ul style="margin:0 0 16px;padding-left:20px;">
          ${linkedHtml}
        </ul>
        ${ctaButton("Log Back In", signInUrl)}
        <p style="margin:24px 0 0;font-size:16px;">
          The Team at NextGenAchiever$
        </p>
      `,
    });

    return { subject, html, text: textLines.join("\n"), preheader };
  }

  const subject = "Your NextGenAchiever$ username";
  const preheader = `Username reminder for ${username}`;
  const text = [
    `Here's the username linked to this email: ${username}`,
    "",
    `Log back in: ${signInUrl}`,
    "",
    "The Team at NextGenAchiever$",
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
      <p style="margin:24px 0 0;font-size:16px;">
        The Team at NextGenAchiever$
      </p>
    `,
  });

  return { subject, html, text, preheader };
}

export function buildCredentialRecoveryEmail(
  data: CredentialRecoveryEmailData,
  _appUrl?: string,
): BuiltEmail {
  const base = getDefaultAppUrl();
  const label = data.label.trim();
  const token = data.token.trim();
  const kind = data.kind === "parent" ? "parent" : "child";
  const caption = kind === "parent" ? "Parent login" : "Username";
  const resetUrl = `${base}/onboarding/reset-password?token=${encodeURIComponent(token)}`;
  const subject = "Reset your NextGenAchiever$ password";
  const preheader =
    "Use the link to set a new password. Your current password stays the same until you do.";

  const text = [
    `A password reset was requested for ${label || "your login"}.`,
    "",
    "Your password is not changed until you open this link and save a new one.",
    "This link resets only that one account.",
    "",
    `${caption}: ${label}`,
    `Set a new password: ${resetUrl}`,
    "",
    "If you did not ask for this, you can ignore this email.",
    "",
    "The Team at NextGenAchiever$",
  ].join("\n");

  const html = wrapHtml({
    header: "Password reset",
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">
        A password reset was requested for <strong>${escapeHtml(label || "your login")}</strong>.
      </p>
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:#5B6B7C;">
        ${escapeHtml(caption)}
      </p>
      <p style="margin:0 0 16px;font-size:18px;font-weight:700;color:#031F82;word-break:break-word;">
        ${escapeHtml(label)}
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Your current password stays the same until you open this link and save a new one.
      </p>
      ${ctaButton("Set a new password", resetUrl)}
      <p style="margin:16px 0 0;font-size:14px;color:#5B6B7C;">
        If you did not ask for this, you can ignore this email.
      </p>
      <p style="margin:24px 0 0;font-size:16px;">
        The Team at NextGenAchiever$
      </p>
    `,
  });

  return {
    subject,
    html,
    text,
    preheader,
  };
}

export function buildAccountDeletedMasterEmail(
  data: AccountDeletedMasterEmailData,
  _appUrl?: string,
): BuiltEmail {
  const children = (data.childUsernames ?? [])
    .map((name) => name.trim())
    .filter(Boolean);
  const subject = "Your NextGenAchiever$ household has been deleted";
  const preheader = "Your parent account and linked profiles have been removed.";
  const header = "Household deleted";

  const childLines =
    children.length > 0
      ? ["", "Linked profiles removed:", ...children.map((name) => `- ${name}`), ""]
      : [""];

  const text = [
    "Hi there,",
    "",
    "Your NextGenAchiever$ parent account has been deleted.",
    "This permanently removed linked profiles, progress, and account data. This cannot be undone.",
    ...childLines,
    `If you did not do this, contact ${SUPPORT_EMAIL}.`,
    "",
    "The Team at NextGenAchiever$",
  ].join("\n");

  const childHtml =
    children.length > 0
      ? `<p style="margin:0 0 8px;font-size:16px;"><strong>Linked profiles removed:</strong></p>
         <ul style="margin:0 0 16px;padding-left:20px;">
           ${children
             .map(
               (name) =>
                 `<li style="margin:0 0 6px;font-size:16px;font-weight:700;color:#031F82;">${escapeHtml(name)}</li>`,
             )
             .join("")}
         </ul>`
      : "";

  const html = wrapHtml({
    header,
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">Hi there,</p>
      <p style="margin:0 0 16px;font-size:16px;">
        Your NextGenAchiever$ parent account has been deleted.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        This permanently removed linked profiles, progress, and account data.
        This cannot be undone.
      </p>
      ${childHtml}
      <p style="margin:24px 0 0;font-size:12px;color:#5B6B7C;line-height:1.5;">
        If you did not do this, contact ${escapeHtml(SUPPORT_EMAIL)}.
      </p>
      <p style="margin:24px 0 0;font-size:16px;">
        The Team at NextGenAchiever$
      </p>
    `,
  });

  return { subject, preheader, html, text };
}

export function buildAccountDeletedChildEmail(
  data: AccountDeletedChildEmailData,
  _appUrl?: string,
): BuiltEmail {
  const username = data.username.trim() || "this profile";
  const subject = `${username}'s NextGenAchiever$ account has been deleted`;
  const preheader = "This profile and its progress have been permanently removed.";
  const header = "Profile deleted";

  const text = [
    "Hi there,",
    "",
    `The NextGenAchiever$ profile ${username} has been deleted.`,
    "Progress, achievements, and activity for this profile have been permanently removed. This cannot be undone.",
    "",
    `If you did not do this, contact ${SUPPORT_EMAIL}.`,
    "",
    "The Team at NextGenAchiever$",
  ].join("\n");

  const html = wrapHtml({
    header,
    preheader,
    bodyInner: `
      <p style="margin:0 0 16px;font-size:16px;">Hi there,</p>
      <p style="margin:0 0 16px;font-size:16px;">
        The NextGenAchiever$ profile <strong>${escapeHtml(username)}</strong> has been deleted.
      </p>
      <p style="margin:0 0 16px;font-size:16px;">
        Progress, achievements, and activity for this profile have been permanently removed.
        This cannot be undone.
      </p>
      <p style="margin:24px 0 0;font-size:12px;color:#5B6B7C;line-height:1.5;">
        If you did not do this, contact ${escapeHtml(SUPPORT_EMAIL)}.
      </p>
      <p style="margin:24px 0 0;font-size:16px;">
        The Team at NextGenAchiever$
      </p>
    `,
  });

  return { subject, preheader, html, text };
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
    case "EXPLORER_PARENT_RESEND":
      return buildExplorerParentResendEmail(
        data as ExplorerParentResendEmailData,
        appUrl,
      );
    case "PATHFINDER_PARENT":
      return buildPathfinderParentEmail(
        data as PathfinderParentEmailData,
        appUrl,
      );
    case "PATHFINDER_PARENT_LINKED":
      return buildPathfinderParentLinkedEmail(
        data as PathfinderParentLinkedEmailData,
        appUrl,
      );
    case "PATHFINDER_WELCOME":
      return buildPathfinderWelcomeEmail(
        data as PathfinderWelcomeEmailData,
        appUrl,
      );
    case "MAVERICK_WELCOME":
      return buildMaverickWelcomeEmail(
        data as MaverickWelcomeEmailData,
        appUrl,
      );
    case "PARENT_WELCOME":
      return buildParentWelcomeEmail(
        data as ParentWelcomeEmailData,
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
    case "ACCOUNT_DELETED_MASTER":
      return buildAccountDeletedMasterEmail(
        data as AccountDeletedMasterEmailData,
        appUrl,
      );
    case "ACCOUNT_DELETED_CHILD":
      return buildAccountDeletedChildEmail(
        data as AccountDeletedChildEmailData,
        appUrl,
      );
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unsupported email type: ${_exhaustive}`);
    }
  }
}
