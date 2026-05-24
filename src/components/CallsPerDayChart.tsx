"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { VapiCall } from "@/lib/vapi";

interface Props {
  calls: VapiCall[];
}

export function CallsPerDayChart({ calls }: Props) {
  // Count calls per day
  const counts: Record<string, number> = {};
  for (const c of calls) {
    try {
      const day = format(parseISO(c.createdAt), "MMM d");
      counts[day] = (counts[day] ?? 0) + 1;
    } catch {
      // skip malformed dates
    }
  }

  const data = Object.entries(counts).map(([date, calls]) => ({
    date,
    calls,
  }));

  // Sort chronologically (approximate — sorts by string which works for "Jan 1" etc)
  data.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11 }}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          formatter={(v) => [`${v} calls`, "Volume"]}
          contentStyle={{ fontSize: 12 }}
        />
        <Bar dataKey="calls" fill="#166534" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
