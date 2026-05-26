import { getCalls } from "@/lib/vapi";
import { CallsTable } from "@/components/CallsTable";
import { subDays } from "date-fns";

export const revalidate = 60;

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function CallsPage({ searchParams }: Props) {
  const params = await searchParams;

  const defaultFrom = subDays(new Date(), 14).toISOString();

  const calls = await getCalls({
    createdAtGt: params.from ?? defaultFrom,
    createdAtLt: params.to,
    assistantId: process.env.VAPI_ASSISTANT_ID || undefined,
    limit: 1000,
  });

  return (
    <div style={{ padding: "var(--card-p)" }}>
      {/* Page header */}
      <div className="mb-6">
        <h1
          className="font-semibold"
          style={{ fontSize: 22, color: "var(--text-1)", fontFamily: "var(--font-sans)" }}
        >
          Call Logs
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-3)", marginTop: 2 }}>
          {calls.length.toLocaleString()} calls in the last 14 days
        </p>
      </div>

      <CallsTable calls={calls} />
    </div>
  );
}
