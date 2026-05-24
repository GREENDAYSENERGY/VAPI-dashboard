import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCalls } from "@/lib/vapi";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const createdAtGt = searchParams.get("createdAtGt") ?? undefined;
  const createdAtLt = searchParams.get("createdAtLt") ?? undefined;
  const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 1000;

  const calls = await getCalls({
    createdAtGt,
    createdAtLt,
    limit,
    assistantId: process.env.VAPI_ASSISTANT_ID || undefined,
  });

  return NextResponse.json(calls);
}
