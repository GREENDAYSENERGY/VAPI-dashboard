import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { callNotes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { callId, note, disposition } = await req.json();
  if (!callId) {
    return NextResponse.json({ error: "callId required" }, { status: 400 });
  }

  // Upsert note
  try {
    await db
      .insert(callNotes)
      .values({ callId, note, disposition })
      .onConflictDoUpdate({
        target: callNotes.callId,
        set: { note, disposition },
      });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("notes upsert error:", err);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const callId = req.nextUrl.searchParams.get("callId");
  if (!callId) {
    return NextResponse.json({ error: "callId required" }, { status: 400 });
  }

  const notes = await db
    .select()
    .from(callNotes)
    .where(eq(callNotes.callId, callId));

  return NextResponse.json(notes[0] ?? null);
}
