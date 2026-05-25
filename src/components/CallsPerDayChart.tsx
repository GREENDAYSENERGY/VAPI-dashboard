"use client";

import {
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

// Hardcoded brand colors — CSS variables don't resolve in SVG presentation attributes
const ACCENT   = "#0079c1";
const GRAD_ID  = "callsAreaGrad";

interface Props {
  calls: VapiCall[];
}

export function CallsPerDayChart({ calls }: Props) {
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
      <AreaChart data={data} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={GRAD_ID} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={ACCENT} stopOpacity={0.28} />
            <stop offset="100%" stopColor={ACCENT} stopOpacity={0.04} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e8" />

        <XAxis
          dataKey="date"
          tick={{ fontSize: 10, fill: "#a3a3a3" }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#a3a3a3" }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          width={32}
        />

        <Tooltip
          formatter={(v) => [`${v} calls`, "Volume"]}
          contentStyle={{
            background: "#fff",
            border: "1px solid #e8e8e8",
            borderRadius: 8,
            fontSize: 12,
            color: "#1a2530",
            boxShadow: "0 2px 8px rgba(10,74,115,0.08)",
          }}
          itemStyle={{ color: ACCENT }}
          cursor={{ stroke: "#d1d1d1", strokeWidth: 1 }}
        />

        <Area
          type="monotone"
          dataKey="calls"
          stroke={ACCENT}
          strokeWidth={2.5}
          fill={`url(#${GRAD_ID})`}
          dot={false}
          activeDot={{ r: 5, fill: ACCENT, stroke: "#fff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
