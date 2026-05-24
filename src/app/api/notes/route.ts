import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

// In-memory fallback when no DB is configured (notes lost on restart, but everything else works)
const memoryNotes: Record<string, { note: string; disposition?: string }> = {};

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { callId, note, disposition } = await req.json();
  if (!callId) {
    return NextResponse.json({ error: "callId required" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    memoryNotes[callId] = { note, disposition };
    return NextResponse.json({ ok: true, storage: "memory" });
  }

  try {
    const { db } = await import("@/lib/db");
    const { callNotes } = await import("@/db/schema");
    await db
      .insert(callNotes)
      .values({ callId, note, disposition })
      .onConflictDoUpdate({
        target: callNotes.callId,
        set: { note, disposition },
      });
    return NextResponse.json({ ok: true, storage: "db" });
  } catch (err) {
    console.error("notes db error:", err);
    memoryNotes[callId] = { note, disposition };
    return NextResponse.json({ ok: true, storage: "memory" });
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

  if (!process.env.DATABASE_URL) {
    return NextResponse.json(memoryNotes[callId] ?? null);
  }

  try {
    const { db } = await import("@/lib/db");
    const { callNotes } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const notes = await db
      .select()
      .from(callNotes)
      .where(eq(callNotes.callId, callId));
    return NextResponse.json(notes[0] ?? null);
  } catch {
    return NextResponse.json(memoryNotes[callId] ?? null);
  }
}
