/**
 * Server-safe environment accessors.
 * Supabase and Grok keys will be validated here in later milestones.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Call only when the integration is wired — avoids failing the Milestone 1 scaffold. */
export function getOptionalEnv(name: string): string | undefined {
  return process.env[name];
}

export { requireEnv };
