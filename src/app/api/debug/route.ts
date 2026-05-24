import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const res = await fetch(
    `https://api.vapi.ai/call?assistantId=${process.env.VAPI_ASSISTANT_ID}&limit=3`,
    {
      headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` },
      cache: "no-store",
    }
  );

  const raw = await res.json();
  const calls = Array.isArray(raw) ? raw : (raw.calls ?? raw.data ?? raw);

  // Return the FULL first call so we can see every field VAPI sends
  return NextResponse.json({
    httpStatus: res.status,
    totalReturned: calls.length,
    firstCallRaw: calls[0] ?? null,
    allCallIds: calls.map((c: Record<string, unknown>) => c.id),
  });
}
