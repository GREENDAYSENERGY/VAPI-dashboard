"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, parseISO, subDays, eachDayOfInterval } from "date-fns";
import type { VapiCall } from "@/lib/vapi";
import { getCallDuration, getDispositionKey } from "@/lib/vapi";
import { calcCost, calcBlocks, formatDuration, RATE_PER_BLOCK, RATE_PER_MINUTE, BLOCK_SECONDS } from "@/lib/pricing";
import { KpiCard } from "@/components/KpiCard";
import { OutcomesChart } from "@/components/OutcomesChart";
import { HourlyHeatmap } from "@/components/HourlyHeatmap";
import { DispositionChip } from "@/components/DispositionChip";
import { Brain, Calculator } from "lucide-react";

function pct(n: number, d: number) { return d === 0 ? 0 : Math.round((n / d) * 100); }
function delta(curr: number, prev: number) {
  if (prev === 0) return undefined;
  return Math.round(((curr - prev) / prev) * 100);
}

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--g-radius-md)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      {title && (
        <div
          style={{
            padding: "14px 18px 0",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--text-3)",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
      )}
      <div style={{ padding: "14px 18px 18px" }}>{children}</div>
    </div>
  );
}

type TrendKey = "calls" | "bookings" | "cost";

interface Props {
  calls: VapiCall[];
  priorCalls: VapiCall[];
}

export function AnalyticsContent({ calls, priorCalls }: Props) {
  const [trendKey, setTrendKey] = useState<TrendKey>("calls");
  const [calcInput, setCalcInput] = useState("");

  // ── KPIs ────────────────────────────────────────────────────────────────
  const totalCalls = calls.length;
  const priorTotal = priorCalls.length;

  const booked = calls.filter((c) => getDispositionKey(c) === "BOOKED").length;
  const priorBooked = priorCalls.filter((c) => getDispositionKey(c) === "BOOKED").length;

  const connected = calls.filter((c) => { const d = getDispositionKey(c); return d !== "NO_ANSWER" && d !== "VM"; }).length;
  const priorConnected = priorCalls.filter((c) => { const d = getDispositionKey(c); return d !== "NO_ANSWER" && d !== "VM"; }).length;
  const connectRate = pct(connected, totalCalls);
  const priorConnectRate = pct(priorConnected, priorTotal);

  const totalRevenue = calls.reduce((s, c) => s + calcCost(getCallDuration(c)), 0);
  const priorRevenue = priorCalls.reduce((s, c) => s + calcCost(getCallDuration(c)), 0);

  const totalAiCost = calls.reduce((s, c) => s + (c.cost ?? 0), 0);
  const priorAiCost = priorCalls.reduce((s, c) => s + (c.cost ?? 0), 0);

  const grossMargin = totalRevenue - totalAiCost;
  const priorMargin = priorRevenue - priorAiCost;

  const costPerBooking = booked > 0 ? totalAiCost / booked : 0;
  const priorCostPerBooking = priorBooked > 0 ? priorAiCost / priorBooked : 0;

  // ── Trend data: last 14 days ─────────────────────────────────────────────
  const trendData = useMemo(() => {
    const now = new Date();
    const days = eachDayOfInterval({ start: subDays(now, 13), end: now });
    const dayMap: Record<string, { calls: number; bookings: number; cost: number }> = {};
    for (const d of days) {
      dayMap[format(d, "yyyy-MM-dd")] = { calls: 0, bookings: 0, cost: 0 };
    }
    for (const c of calls) {
      try {
        const k = format(parseISO(c.createdAt), "yyyy-MM-dd");
        if (dayMap[k]) {
          dayMap[k].calls++;
          if (getDispositionKey(c) === "BOOKED") dayMap[k].bookings++;
          dayMap[k].cost += calcCost(getCallDuration(c));
        }
      } catch { /* skip */ }
    }
    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => ({ date: format(parseISO(k), "MMM d"), ...v }));
  }, [calls]);

  // ── Disposition breakdown ────────────────────────────────────────────────
  const dispMap: Record<string, { count: number; duration: number; revenue: number; cost: number }> = {};
  for (const c of calls) {
    const k = getDispositionKey(c);
    if (!dispMap[k]) dispMap[k] = { count: 0, duration: 0, revenue: 0, cost: 0 };
    const dur = getCallDuration(c);
    dispMap[k].count++;
    dispMap[k].duration += dur;
    dispMap[k].revenue += calcCost(dur);
    dispMap[k].cost += c.cost ?? 0;
  }
  const dispRows = Object.entries(dispMap).sort(([, a], [, b]) => b.count - a.count);
  const totalDuration = calls.reduce((s, c) => s + getCallDuration(c), 0);

  // ── Calculator ──────────────────────────────────────────────────────────
  const inputSec = parseInt(calcInput, 10) || 0;
  const calcB = calcBlocks(inputSec);
  const calcC = calcCost(inputSec);

  const TREND_LABELS: Record<TrendKey, string> = { calls: "Calls", bookings: "Bookings", cost: "Cost ($)" };

  return (
    <div style={{ padding: "var(--card-p)", maxWidth: 1280 }} className="space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-2">
        <span style={{ color: "var(--accent)" }}><Brain size={22} /></span>
        <div>
          <h1 className="font-semibold" style={{ fontSize: 22, color: "var(--text-1)" }}>
            Big Brain Analytics
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>
            ${RATE_PER_MINUTE.toFixed(2)}/min · {BLOCK_SECONDS}s billing increments · Last 14 days
          </p>
        </div>
      </div>

      {/* ── 5 KPI cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Booked"
          value={booked.toString()}
          featured
          delta={delta(booked, priorBooked)}
          sub="vs prior 14d"
        />
        <KpiCard
          label="Connect Rate"
          value={`${connectRate}`}
          unit="%"
          delta={delta(connectRate, priorConnectRate)}
          sub="vs prior 14d"
        />
        <KpiCard
          label="Cost / Booking"
          value={`$${costPerBooking.toFixed(3)}`}
          delta={delta(costPerBooking, priorCostPerBooking)}
          deltaInverse
          sub="lower is better"
        />
        <KpiCard
          label="Total AI Cost"
          value={`$${totalAiCost.toFixed(3)}`}
          delta={delta(totalAiCost, priorAiCost)}
          deltaInverse
          sub="VAPI internal"
        />
        <KpiCard
          label="Gross Margin"
          value={`$${grossMargin.toFixed(3)}`}
          delta={delta(grossMargin, priorMargin)}
          sub={`${totalRevenue > 0 ? pct(grossMargin, totalRevenue) : 0}% margin`}
        />
      </div>

      {/* ── Trend chart ─────────────────────────────────────────────────────── */}
      <Card title="Trend">
        {/* Toggle pills */}
        <div className="flex gap-2 mb-4">
          {(["calls", "bookings", "cost"] as TrendKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setTrendKey(k)}
              className="px-3 py-1 rounded-full text-xs font-semibold transition-all"
              style={{
                background: trendKey === k ? "var(--accent)" : "var(--surface-2)",
                color: trendKey === k ? "#fff" : "var(--text-3)",
                border: `1px solid ${trendKey === k ? "var(--accent)" : "var(--line)"}`,
              }}
            >
              {TREND_LABELS[k]}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={trendData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#0079c1" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#0079c1" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e8" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#a3a3a3" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "#a3a3a3" }} axisLine={false} tickLine={false} width={36} />
            <Tooltip
              formatter={(v) => [trendKey === "cost" && typeof v === "number" ? `$${v.toFixed(3)}` : v, TREND_LABELS[trendKey]]}
              contentStyle={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 8, fontSize: 12, color: "#1a2530", boxShadow: "0 2px 8px rgba(10,74,115,0.08)" }}
              itemStyle={{ color: "#0079c1" }}
            />
            <Area
              type="monotone"
              dataKey={trendKey}
              stroke="#0079c1"
              strokeWidth={2.5}
              fill="url(#trendGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#0079c1", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* ── 2-up: Donut + Heatmap ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Outcome Distribution">
          <OutcomesChart calls={calls} />
        </Card>
        <Card title="Call Volume by Hour">
          <HourlyHeatmap calls={calls} />
        </Card>
      </div>

      {/* ── Pricing calculator ─────────────────────────────────────────────── */}
      <Card title="Pricing Calculator">
        <div className="flex items-center gap-3 mb-1">
          <Calculator size={15} style={{ color: "var(--accent)" }} />
          <span style={{ fontSize: 13, color: "var(--text-2)" }}>
            Enter a call duration to calculate billing
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3">
          <div>
            <label style={{ fontSize: 11, color: "var(--text-3)", display: "block", marginBottom: 4 }}>
              Duration (seconds)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 90"
              value={calcInput}
              onChange={(e) => setCalcInput(e.target.value)}
              className="font-mono rounded-lg px-3 outline-none"
              style={{
                width: 120,
                height: 36,
                border: "1px solid var(--line)",
                background: "var(--surface-2)",
                fontSize: 14,
                color: "var(--text-1)",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
            />
          </div>
          {inputSec > 0 && (
            <>
              <div style={{ color: "var(--text-4)", fontSize: 18 }}>→</div>
              <div className="text-center">
                <p style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 2 }}>Duration</p>
                <p className="font-mono font-semibold" style={{ color: "var(--text-1)" }}>{formatDuration(inputSec)}</p>
              </div>
              <div style={{ color: "var(--text-4)", fontSize: 18 }}>→</div>
              <div className="text-center">
                <p style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 2 }}>Blocks</p>
                <p className="font-mono font-semibold" style={{ color: "var(--text-1)" }}>{calcB} × {BLOCK_SECONDS}s</p>
              </div>
              <div style={{ color: "var(--text-4)", fontSize: 18 }}>→</div>
              <div className="text-center">
                <p style={{ fontSize: 10, color: "var(--text-4)", marginBottom: 2 }}>Revenue</p>
                <p className="font-mono font-bold" style={{ fontSize: 20, color: "var(--pos)" }}>${calcC.toFixed(3)}</p>
              </div>
            </>
          )}
        </div>
        {inputSec > 0 && (
          <p style={{ fontSize: 11, color: "var(--text-4)", marginTop: 8 }}>
            {inputSec}s ÷ {BLOCK_SECONDS}s = {(inputSec / BLOCK_SECONDS).toFixed(2)} → round → {calcB} blocks × ${RATE_PER_BLOCK.toFixed(3)} = ${calcC.toFixed(3)}
          </p>
        )}
      </Card>

      {/* ── Disposition breakdown table ─────────────────────────────────────── */}
      <Card title="Breakdown by Disposition">
        <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--line)" }}>
          <table className="w-full" style={{ fontSize: 13, borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
                {["Disposition", "Calls", "Duration", "Revenue", "AI Cost", "Margin"].map((h) => (
                  <th
                    key={h}
                    className="font-semibold uppercase text-left tracking-wider"
                    style={{ padding: "10px 14px", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dispRows.map(([k, s]) => (
                <tr
                  key={k}
                  className="hover:bg-[var(--surface-2)] transition-colors"
                  style={{ borderBottom: "1px solid var(--line-soft)" }}
                >
                  <td style={{ padding: "10px 14px" }}>
                    <DispositionChip disposition={k} />
                  </td>
                  <td className="font-mono" style={{ padding: "10px 14px", color: "var(--text-2)" }}>{s.count}</td>
                  <td className="font-mono" style={{ padding: "10px 14px", color: "var(--text-2)" }}>{formatDuration(s.duration)}</td>
                  <td className="font-mono" style={{ padding: "10px 14px", color: "var(--pos)", fontWeight: 600 }}>${s.revenue.toFixed(3)}</td>
                  <td className="font-mono" style={{ padding: "10px 14px", color: "var(--text-3)" }}>${s.cost.toFixed(3)}</td>
                  <td
                    className="font-mono font-semibold"
                    style={{ padding: "10px 14px", color: s.revenue - s.cost >= 0 ? "var(--pos)" : "var(--neg)" }}
                  >
                    {s.revenue - s.cost >= 0 ? "+" : ""}${(s.revenue - s.cost).toFixed(3)}
                  </td>
                </tr>
              ))}
              {/* Total row */}
              <tr style={{ background: "var(--surface-2)", borderTop: `2px solid var(--line)`, fontWeight: 600 }}>
                <td style={{ padding: "10px 14px", color: "var(--text-1)", fontSize: 12 }}>TOTAL</td>
                <td className="font-mono" style={{ padding: "10px 14px", color: "var(--text-1)" }}>{calls.length}</td>
                <td className="font-mono" style={{ padding: "10px 14px", color: "var(--text-1)" }}>{formatDuration(totalDuration)}</td>
                <td className="font-mono" style={{ padding: "10px 14px", color: "var(--pos)" }}>${totalRevenue.toFixed(3)}</td>
                <td className="font-mono" style={{ padding: "10px 14px", color: "var(--text-3)" }}>${totalAiCost.toFixed(3)}</td>
                <td className="font-mono" style={{ padding: "10px 14px", color: "var(--pos)" }}>+${grossMargin.toFixed(3)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
