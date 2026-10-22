import { acceptInboundUsage } from "@/lib/usage/inbound-usage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_CHARS = 512;

/**
 * Activity beacon. sendBeacon cannot call a server action.
 * Guests become a count. Signed-in learners get a usage_events row.
 * The response is empty either way.
 */
export async function POST(request: Request) {
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_CHARS) {
      return new Response(null, { status: 204 });
    }
    let body: unknown;
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      return new Response(null, { status: 204 });
    }
    await acceptInboundUsage(body, (name) => request.headers.get(name));
  } catch {
    // A beacon must not surface a storage failure.
  }
  return new Response(null, { status: 204 });
}
