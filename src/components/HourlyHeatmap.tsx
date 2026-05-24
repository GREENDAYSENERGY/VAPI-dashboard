"use client";

import type { VapiCall } from "@/lib/vapi";
import { parseISO } from "date-fns";

interface Props {
  calls: VapiCall[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function HourlyHeatmap({ calls }: Props) {
  // Build 7×24 grid indexed [dayOfWeek(0=Mon)][hour]
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));

  for (const call of calls) {
    if (!call.createdAt) continue;
    try {
      const d = parseISO(call.createdAt);
      const dow = (d.getDay() + 6) % 7; // 0=Mon..6=Sun
      const hour = d.getHours();
      grid[dow][hour]++;
    } catch { /* skip */ }
  }

  const maxCount = Math.max(...grid.flat(), 1);

  function cellBg(count: number): string {
    if (count === 0) return "var(--surface-3)";
    const pct = Math.round((count / maxCount) * 100);
    return `color-mix(in srgb, var(--accent) ${pct}%, var(--surface-3))`;
  }

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const labelHours = [0, 6, 12, 18];

  return (
    <div>
      {/* Header: hour labels */}
      <div className="flex mb-1" style={{ paddingLeft: 34 }}>
        {hours.map(h => (
          <div
            key={h}
            className="flex-1 text-center"
            style={{ fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-4)" }}
          >
            {labelHours.includes(h) ? `${String(h).padStart(2, "0")}` : ""}
          </div>
        ))}
      </div>

      {/* Rows */}
      {DAYS.map((day, di) => (
        <div key={day} className="flex items-center gap-0.5 mb-0.5">
          <div
            className="shrink-0 text-right pr-1.5"
            style={{ width: 32, fontSize: 9, fontFamily: "var(--font-mono)", color: "var(--text-4)" }}
          >
            {day}
          </div>
          {hours.map(h => {
            const count = grid[di][h];
            return (
              <div
                key={h}
                className="flex-1"
                title={`${day} ${h}:00 — ${count} call${count !== 1 ? "s" : ""}`}
                style={{
                  height: 14,
                  borderRadius: 2,
                  background: cellBg(count),
                  transition: "opacity 0.12s",
                  cursor: count > 0 ? "default" : undefined,
                }}
              />
            );
          })}
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px]" style={{ color: "var(--text-4)" }}>Fewer</span>
        {[0, 25, 50, 75, 100].map(pct => (
          <div
            key={pct}
            style={{
              width: 12, height: 12, borderRadius: 2,
              background: pct === 0
                ? "var(--surface-3)"
                : `color-mix(in srgb, var(--accent) ${pct}%, var(--surface-3))`,
            }}
          />
        ))}
        <span className="text-[10px]" style={{ color: "var(--text-4)" }}>More</span>
      </div>
    </div>
  );
}
