import { NextResponse } from "next/server";
import { getCalls } from "@/lib/vapi";
import { getSession } from "@/lib/auth";
import { subHours } from "date-fns";

/**
 * Returns currently in-progress calls.
 * VAPI doesn't support status filtering, so we fetch the last 24h and filter.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const calls = await getCalls({
    createdAtGt: subHours(new Date(), 24).toISOString(),
    limit: 200,
    // No assistantId filter — catch all active calls across assistants
  });

  const live = calls.filter(
    (c) => c.status === "in-progress" || c.status === "ringing" || c.status === "queued"
  );

  return NextResponse.json(live, {
    headers: { "Cache-Control": "no-store" },
  });
}
