"use server";

import { headers } from "next/headers";
import { acceptInboundUsage } from "@/lib/usage/inbound-usage";

/**
 * Persist one activity report.
 * Signed-in learners insert usage_events as themselves.
 * Guests increment a daily count. They never write usage_events.
 * Any failure is swallowed.
 */
export async function submitUsageEvent(input: unknown): Promise<void> {
  try {
    const headerList = await headers();
    await acceptInboundUsage(input, (name) => headerList.get(name));
  } catch {
    // Table not migrated yet, Supabase not configured, or the network failed.
  }
}
