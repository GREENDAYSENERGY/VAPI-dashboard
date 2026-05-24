import { getCalls } from "@/lib/vapi";
import { StatsCards } from "@/components/StatsCards";
import { OutcomesChart } from "@/components/OutcomesChart";
import { CallsPerDayChart } from "@/components/CallsPerDayChart";
import { CallsTable } from "@/components/CallsTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await searchParams;

  const calls = await getCalls({
    createdAtGt: params.from,
    createdAtLt: params.to,
    assistantId: process.env.VAPI_ASSISTANT_ID || undefined,
    limit: 1000,
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {calls.length.toLocaleString()} calls loaded
        </p>
      </div>

      <StatsCards calls={calls} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Call Dispositions</CardTitle>
          </CardHeader>
          <CardContent>
            <OutcomesChart calls={calls} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-700">Calls per Day</CardTitle>
          </CardHeader>
          <CardContent>
            <CallsPerDayChart calls={calls} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-gray-700">All Calls</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
            <CallsTable calls={calls} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
