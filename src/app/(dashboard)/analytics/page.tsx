import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { getCalls } from "@/lib/vapi";
import { AnalyticsContent } from "./AnalyticsContent";
import { subDays } from "date-fns";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function AnalyticsPage({ searchParams }: Props) {
  // Auth guard — @gadi.ai only
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) redirect("/login");
  const session = await verifyToken(token);
  if (!session || !session.email.endsWith("@gadi.ai")) redirect("/overview");

  const params = await searchParams;
  const defaultFrom = subDays(new Date(), 14).toISOString();

  const [calls, priorCalls] = await Promise.all([
    getCalls({
      createdAtGt: params.from ?? defaultFrom,
      createdAtLt: params.to,
      assistantId: process.env.VAPI_ASSISTANT_ID || undefined,
      limit: 1000,
    }),
    getCalls({
      createdAtGt: subDays(new Date(), 28).toISOString(),
      createdAtLt: params.from ?? defaultFrom,
      assistantId: process.env.VAPI_ASSISTANT_ID || undefined,
      limit: 1000,
    }),
  ]);

  return <AnalyticsContent calls={calls} priorCalls={priorCalls} />;
}
