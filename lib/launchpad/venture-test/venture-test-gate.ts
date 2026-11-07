/**
 * The Launchpad venture flow is a TEST-ONLY build. It renders on Vercel
 * preview deployments and in local `next dev`, and returns 404 in production.
 */
export function isVentureTestEnabled(env: {
  VERCEL_ENV?: string;
  NODE_ENV?: string;
} = process.env): boolean {
  if (env.VERCEL_ENV === "production") return false;
  if (env.VERCEL_ENV === "preview") return true;
  return env.NODE_ENV === "development";
}

export const VENTURE_TEST_PATH = "/test-launchpad-venture";
