"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { VapiCall } from "@/lib/vapi";
import { getDispositionKey } from "@/lib/vapi";

const DISP_COLORS: Record<string, string> = {
  BOOKED:    "#16a34a",
  CB:        "#0079c1",
  VM:        "#d97706",
  DNC:       "#dc2626",
  NQ:        "#5e6a78",
  NO_ANSWER: "#a3a3a3",
  COMPLETED: "#737373",
  OTHER:     "#a3a3a3",
};

const DISP_LABEL: Record<string, string> = {
  BOOKED: "Booked", CB: "Callback", VM: "Voicemail",
  DNC: "Do-not-call", NQ: "Not qualified", NO_ANSWER: "No answer",
  COMPLETED: "Completed", OTHER: "Other",
};

export function OutcomesChart({ calls }: { calls: VapiCall[] }) {
  const counts: Record<string, number> = {};
  for (const c of calls) { const k = getDispositionKey(c); counts[k] = (counts[k] ?? 0) + 1; }

  const data = Object.entries(counts)
    .map(([k, v]) => ({ key: k, name: DISP_LABEL[k] ?? k, value: v, color: DISP_COLORS[k] ?? "#a3a3a3" }))
    .sort((a, b) => b.value - a.value);

  const total = calls.length;
  const booked = counts["BOOKED"] ?? 0;

  if (data.length === 0) return <div className="flex items-center justify-center h-40 text-sm" style={{ color: "var(--text-4)" }}>No data</div>;

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={52} outerRadius={74} dataKey="value" strokeWidth={2} stroke="var(--surface)">
              {data.map(e => <Cell key={e.key} fill={e.color} />)}
            </Pie>
            <Tooltip formatter={(v) => [`${v} calls`, ""]} contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="font-semibold tabular-nums" style={{ fontSize: 22, color: "var(--text-1)", lineHeight: 1 }}>{booked}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "var(--text-3)" }}>Booked</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {data.map(e => (
          <div key={e.key} className="flex items-center gap-2">
            <span className="shrink-0" style={{ width: 8, height: 8, borderRadius: 2, background: e.color, display: "inline-block" }} />
            <span className="flex-1 text-[12px] font-medium truncate" style={{ color: "var(--text-1)" }}>{e.name}</span>
            <span className="text-[12px] font-mono shrink-0" style={{ color: "var(--text-2)" }}>{e.value}</span>
            <span className="text-[11px] font-mono shrink-0 w-9 text-right" style={{ color: "var(--text-3)" }}>
              {total > 0 ? Math.round((e.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
