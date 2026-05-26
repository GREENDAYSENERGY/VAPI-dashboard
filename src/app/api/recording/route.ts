import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * Proxy a VAPI recording URL so the browser downloads the file directly
 * instead of navigating to the storage URL.
 *
 * Usage: GET /api/recording?url=https://storage.vapi.ai/...&name=call-123.wav
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const url = searchParams.get("url");
  const name = searchParams.get("name") ?? "recording.wav";

  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Only proxy VAPI storage URLs
  if (!url.startsWith("https://storage.vapi.ai/")) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) {
      return NextResponse.json({ error: "Could not fetch recording" }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") ?? "audio/wav";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${name}"`,
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to proxy recording" }, { status: 500 });
  }
}
