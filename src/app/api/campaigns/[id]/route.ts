import { NextResponse } from "next/server";
import { getCampaign } from "@/lib/vapi";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(campaign);
}