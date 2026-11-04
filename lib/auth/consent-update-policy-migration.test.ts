import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const dir = path.join(process.cwd(), "supabase/migrations");
const file = "20261103180000_auth_rate_limits_and_consent_update_policy.sql";
const sql = readFileSync(path.join(dir, file), "utf8");

describe("security review migration (findings 4 and 5)", () => {
  it("runs after the migrations that created the policy and the PIN lockout table", () => {
    const all = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    expect(all.indexOf(file)).toBeGreaterThan(all.indexOf("20260815000000_auth_layer_schema.sql"));
    expect(all.indexOf(file)).toBeGreaterThan(all.indexOf("20261103120000_parent_pin_lockouts.sql"));
  });

  it("drops the parent UPDATE policy on consent_requests", () => {
    expect(sql).toMatch(/drop policy if exists consent_requests_update_parent on public\.consent_requests;/);
    expect(sql).not.toMatch(/create policy/i);
  });

  it("creates auth_rate_limits as a server-only table", () => {
    expect(sql).toMatch(/create table if not exists public\.auth_rate_limits/);
    expect(sql).toMatch(/alter table public\.auth_rate_limits enable row level security;/);
    expect(sql).toMatch(/revoke all on public\.auth_rate_limits from anon, authenticated;/);
    expect(sql).not.toMatch(/grant [^;]* to (anon|authenticated)/i);
  });
});
