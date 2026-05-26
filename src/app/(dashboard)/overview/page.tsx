import { getCalls, getCallDuration, getCustomerName, getDispositionKey } from "@/lib/vapi";
import { calcCost, formatDuration } from "@/lib/pricing";
import { KpiCard } from "@/components/KpiCard";
import { CallsPerDayChart } from "@/components/CallsPerDayChart";
import { OutcomesChart } from "@/components/OutcomesChart";
import { HourlyHeatmap } from "@/components/HourlyHeatmap";
import { OverviewActivitySection } from "@/components/OverviewActivitySection";
import { Phone, Percent, CalendarCheck, Clock } from "lucide-react";
import { subDays, format } from "date-fns";

// Pages revalidate automatically via the vapi-calls webhook tag
export const revalidate = 60; // fallback: refresh every 60s even without webhook

function pct(n: number, d: number) {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function delta(curr: number, prev: number) {
  if (prev === 0) return undefined;
  return Math.round(((curr - prev) / prev) * 100);
}

function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
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

export default async function OverviewPage() {
  const now = new Date();
  const sub14 = subDays(now, 14).toISOString();
  const sub28 = subDays(now, 28).toISOString();

  const [calls, priorCalls] = await Promise.all([
    getCalls({ createdAtGt: sub14, limit: 1000, assistantId: process.env.VAPI_ASSISTANT_ID || undefined }),
    getCalls({ createdAtGt: sub28, createdAtLt: sub14, limit: 1000, assistantId: process.env.VAPI_ASSISTANT_ID || undefined }),
  ]);

  // ── Current period metrics ───────────────────────────────────────────────
  const totalCalls = calls.length;
  const booked = calls.filter((c) => getDispositionKey(c) === "BOOKED").length;
  const connected = calls.filter((c) => {
    const d = getDispositionKey(c);
    return d !== "NO_ANSWER" && d !== "VM";
  }).length;
  const connectRate = pct(connected, totalCalls);
  const bookRate = pct(booked, totalCalls);
  const avgDuration = totalCalls === 0 ? 0 : Math.round(calls.reduce((s, c) => s + getCallDuration(c), 0) / totalCalls);
  const totalSpend = calls.reduce((s, c) => s + calcCost(getCallDuration(c)), 0);

  // ── Prior period metrics ─────────────────────────────────────────────────
  const priorTotal = priorCalls.length;
  const priorBooked = priorCalls.filter((c) => getDispositionKey(c) === "BOOKED").length;
  const priorConnected = priorCalls.filter((c) => {
    const d = getDispositionKey(c);
    return d !== "NO_ANSWER" && d !== "VM";
  }).length;
  const priorConnectRate = pct(priorConnected, priorTotal);
  const priorAvg = priorTotal === 0 ? 0 : Math.round(priorCalls.reduce((s, c) => s + getCallDuration(c), 0) / priorTotal);

  // Spark data: calls per day for last 14 days
  const dayMap: Record<string, number> = {};
  for (const c of calls) {
    try {
      const d = format(new Date(c.createdAt), "yyyy-MM-dd");
      dayMap[d] = (dayMap[d] ?? 0) + 1;
    } catch { /* */ }
  }
  const sparkCalls = Object.keys(dayMap).sort().map((k) => dayMap[k]);

  // Today's spend
  const todayStr = format(now, "yyyy-MM-dd");
  const todaySpend = calls
    .filter((c) => c.createdAt?.startsWith(todayStr))
    .reduce((s, c) => s + calcCost(getCallDuration(c)), 0);

  // Disposition counts for the outcomes mini-bars
  const dispCounts: Record<string, number> = {};
  for (const c of calls) {
    const k = getDispositionKey(c);
    dispCounts[k] = (dispCounts[k] ?? 0) + 1;
  }

  const DISP_LABEL: Record<string, string> = {
    BOOKED: "Booked", CB: "Callback", VM: "Voicemail",
    DNC: "Do-not-call", NQ: "Not qualified", NO_ANSWER: "No answer",
    COMPLETED: "Completed", OTHER: "Other",
  };
  const DISP_COLOR: Record<string, string> = {
    BOOKED: "var(--pos)", CB: "var(--accent)", VM: "var(--warn)",
    DNC: "var(--neg)", NQ: "#5e6a78", NO_ANSWER: "var(--text-4)",
    COMPLETED: "var(--text-3)", OTHER: "var(--text-4)",
  };

  const maxDisp = Math.max(...Object.values(dispCounts), 1);

  return (
    <div style={{ padding: "var(--card-p)" }} className="space-y-5">

      {/* ── Hero band ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a4a73 0%, #0563a8 100%)",
          borderRadius: "10px",
          padding: "28px 32px",
          boxShadow: "0 4px 12px rgba(10,74,115,0.18), 0 2px 4px rgba(10,74,115,0.08)",
        }}
      >
        {/* Watermark */}
        <img
          src="/icon-dots-white.svg"
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            top: -20,
            right: -20,
            width: 220,
            opacity: 0.06,
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          {/* Left: greeting */}
          <div style={{ minWidth: 220 }}>
            <p
              style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 6 }}
            >
              Operations · Go Green Builders
            </p>
            <h1
              style={{ fontSize: 24, fontWeight: 600, color: "#fff", lineHeight: 1.2, fontFamily: "var(--font-sans)", margin: 0 }}
            >
              Good {now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"} 👋
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 6 }}>
              {totalCalls} calls · {booked} booked · ${totalSpend.toFixed(2)} spend — last 14 days
            </p>
          </div>

          {/* Right: hero stats */}
          <div style={{ display: "flex", gap: 28, flexShrink: 0 }}>
            {[
              { label: "Live now",    value: "0",                           icon: "●" },
              { label: "Queued",      value: "0",                           icon: null },
              { label: "Today spend", value: `$${todaySpend.toFixed(2)}`,   icon: null },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 22, fontWeight: 700, color: "#fff", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {icon && <span style={{ fontSize: 10, color: "#4ade80", lineHeight: 1 }}>{icon}</span>}
                  {value}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 4 KPI cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Calls Placed"
          value={totalCalls.toLocaleString()}
          featured
          icon={<Phone size={14} />}
          delta={delta(totalCalls, priorTotal)}
          sub="vs prior 14d"
          sparkData={sparkCalls}
        />
        <KpiCard
          label="Connect Rate"
          value={`${connectRate}`}
          unit="%"
          icon={<Percent size={14} />}
          delta={delta(connectRate, priorConnectRate)}
          sub="vs prior 14d"
        />
        <KpiCard
          label="Booked"
          value={booked.toLocaleString()}
          sub={`${bookRate}% book rate`}
          icon={<CalendarCheck size={14} />}
          delta={delta(booked, priorBooked)}
        />
        <KpiCard
          label="Avg Handle Time"
          value={formatDuration(avgDuration)}
          icon={<Clock size={14} />}
          delta={delta(avgDuration, priorAvg)}
          deltaInverse
          sub="vs prior 14d"
        />
      </div>

      {/* ── Row: Calls/Day chart + Outcomes mix + Heatmap ─────────────────── */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1.6fr 1fr 1fr" }}>
        <Card title="Calls per Day">
          <CallsPerDayChart calls={calls} />
        </Card>

        <Card title="Outcomes Mix">
          <div className="space-y-2">
            {Object.entries(dispCounts)
              .sort(([, a], [, b]) => b - a)
              .map(([k, v]) => (
                <div key={k} className="flex items-center gap-2">
                  <span style={{ fontSize: 11, color: "var(--text-3)", width: 72, flexShrink: 0 }}>
                    {DISP_LABEL[k] ?? k}
                  </span>
                  <div
                    className="flex-1 overflow-hidden rounded-full"
                    style={{ height: 8, background: "var(--surface-3)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(v / maxDisp) * 100}%`,
                        background: DISP_COLOR[k] ?? "var(--text-4)",
                        transition: "width 0.4s ease",
                      }}
                    />
                  </div>
                  <span
                    className="font-mono shrink-0"
                    style={{ fontSize: 11, color: "var(--text-2)", width: 28, textAlign: "right" }}
                  >
                    {v}
                  </span>
                </div>
              ))}
          </div>
        </Card>

        <Card title="Donut Breakdown">
          <OutcomesChart calls={calls} />
        </Card>
      </div>

      {/* ── Recent Activity (full width) ──────────────────────────────────── */}
      <Card title="Recent Activity">
        <OverviewActivitySection calls={calls.slice(0, 8)} />
      </Card>

      {/* ── Call Volume Heatmap (full width, bottom) ───────────────────────── */}
      <Card title="Call Volume Heatmap">
        <HourlyHeatmap calls={calls} />
      </Card>

    </div>
  );
}
