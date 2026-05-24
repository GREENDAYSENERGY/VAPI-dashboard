"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { VapiCall } from "@/lib/vapi";

interface Props {
  calls: VapiCall[];
}

const COLORS: Record<string, string> = {
  CB: "#22c55e",
  VM: "#f59e0b",
  "No Answer": "#94a3b8",
  DNC: "#ef4444",
  NQ: "#8b5cf6",
  Booked: "#0ea5e9",
  Other: "#6b7280",
};

function getDisposition(call: VapiCall): string {
  const d = call.analysis?.structuredData?.disposition;
  if (d) return d.toUpperCase();

  const reason = (call.endedReason ?? "").toLowerCase();
  if (reason.includes("voicemail") || reason.includes("machine")) return "VM";
  if (reason.includes("no-answer") || reason.includes("busy")) return "No Answer";
  if (call.analysis?.structuredData?.appointment_booked) return "Booked";
  return "Other";
}

export function OutcomesChart({ calls }: Props) {
  const counts: Record<string, number> = {};
  for (const c of calls) {
    const d = getDisposition(c);
    counts[d] = (counts[d] ?? 0) + 1;
  }

  const data = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={({ name, percent }) =>
            `${name} ${Math.round((percent ?? 0) * 100)}%`
          }
          labelLine={false}
        >
          {data.map((entry) => (
            <Cell
              key={entry.name}
              fill={COLORS[entry.name] ?? COLORS.Other}
            />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [`${v} calls`, ""]} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
