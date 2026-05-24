"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { format, parseISO } from "date-fns";
import type { VapiCall } from "@/lib/vapi";

interface Props {
  calls: VapiCall[];
}

export function CallsPerDayChart({ calls }: Props) {
  // Count calls per day (keep ISO date key for proper sort, display "MMM d")
  const counts: Record<string, { display: string; calls: number }> = {};
  for (const c of calls) {
    try {
      const iso = format(parseISO(c.createdAt), "yyyy-MM-dd");
      const display = format(parseISO(c.createdAt), "MMM d");
      if (!counts[iso]) counts[iso] = { display, calls: 0 };
      counts[iso].calls++;
    } catch {
      // skip malformed dates
    }
  }

  const data = Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ date: v.display, calls: v.calls }));

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-sm" style={{ color: "var(--text-4)" }}>
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="callsAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.22} />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="4 4"
          vertical={false}
          stroke="var(--line)"
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "var(--text-4)", fontFamily: "var(--font-sans)" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "var(--text-4)", fontFamily: "var(--font-sans)" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={32}
        />
        <Tooltip
          formatter={(v) => [`${v} calls`, "Volume"]}
          contentStyle={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--text-1)",
            boxShadow: "var(--shadow-sm)",
          }}
          itemStyle={{ color: "var(--accent)" }}
          cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="calls"
          stroke="var(--accent)"
          strokeWidth={2}
          fill="url(#callsAreaGrad)"
          dot={false}
          activeDot={{ r: 4, fill: "var(--accent)", stroke: "var(--surface)", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
