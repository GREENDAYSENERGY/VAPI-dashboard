import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

/**
 * VAPI Webhook handler
 *
 * Configure in VAPI dashboard → Assistant → Server URL:
 *   https://yourdomain.com/api/webhooks/vapi?secret=YOUR_VAPI_WEBHOOK_SECRET
 *
 * Events handled:
 *   end-of-call-report  → revalidates /overview, /calls, /campaigns, /analytics
 *   status-update       → revalidates when call status changes to "ended"
 */
export async function POST(req: Request) {
  // ── Auth: verify secret token ─────────────────────────────────────────────
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const expectedSecret = process.env.VAPI_WEBHOOK_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    console.warn("VAPI webhook: unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message as Record<string, unknown> | undefined;
  const type = message?.type as string | undefined;

  console.log(`VAPI webhook received: ${type}`);

  // ── Handle events ─────────────────────────────────────────────────────────
  switch (type) {
    case "end-of-call-report": {
      // Full call + analysis are ready — refresh all data pages
      revalidatePath("/overview", "page");
      revalidatePath("/calls", "page");
      revalidatePath("/campaigns", "page");
      revalidatePath("/analytics", "page");
      console.log("VAPI webhook: revalidated all dashboard pages");
      break;
    }

    case "status-update": {
      const status = message?.status as string | undefined;
      if (status === "ended") {
        revalidatePath("/overview", "page");
        revalidatePath("/calls", "page");
        console.log(`VAPI webhook: revalidated overview + calls (status: ${status})`);
      }
      break;
    }

    // These don't require page revalidation
    case "transcript":
    case "speech-update":
    case "function-call":
    case "assistant-request":
    case "hang":
      break;

    default:
      console.log(`VAPI webhook: unhandled event type "${type}"`);
  }

  // VAPI expects a fast 200 response
  return NextResponse.json({ received: true });
}
