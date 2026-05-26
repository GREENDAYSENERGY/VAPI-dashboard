"use client";

import { useEffect, useState, useCallback } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Radio, Phone, Clock, RefreshCw } from "lucide-react";
import type { VapiCall } from "@/lib/vapi";
import { getCustomerName, getCustomerPhone } from "@/lib/vapi";

const POLL_INTERVAL = 5000; // 5 seconds

// ── Live duration counter ──────────────────────────────────────────────────────
function LiveDuration({ startedAt }: { startedAt?: string }) {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setSecs(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return (
    <span className="font-mono tabular-nums" style={{ color: "#4ade80", fontWeight: 700, fontSize: 15 }}>
      {m}:{String(s).padStart(2, "0")}
    </span>
  );
}

// ── Active call card ───────────────────────────────────────────────────────────
function CallCard({ call }: { call: VapiCall }) {
  const name = getCustomerName(call);
  const phone = getCustomerPhone(call);
  const startedAgo = call.startedAt
    ? formatDistanceToNow(parseISO(call.startedAt), { addSuffix: true })
    : "just now";

  const statusColor =
    call.status === "in-progress" ? "#4ade80" :
    call.status === "ringing"     ? "#facc15" :
    "#94a3b8";

  const statusLabel =
    call.status === "in-progress" ? "Active" :
    call.status === "ringing"     ? "Ringing" :
    call.status === "queued"      ? "Queued" :
    call.status ?? "Unknown";

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: "var(--g-radius-md)",
        boxShadow: "var(--shadow-xs)",
        padding: "20px 24px",
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}
    >
      {/* Pulsing status dot */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div
          style={{
            width: 48, height: 48, borderRadius: "50%",
            background: "linear-gradient(135deg, #0a4a73 0%, #0563a8 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Phone size={20} color="#fff" />
        </div>
        {/* Pulse ring */}
        <span style={{
          position: "absolute", top: -4, left: -4, right: -4, bottom: -4,
          borderRadius: "50%", border: `2px solid ${statusColor}`,
          animation: "ringPulse 1.6s ease-in-out infinite",
          pointerEvents: "none",
        }} />
        {/* Status dot */}
        <span style={{
          position: "absolute", bottom: 2, right: 2,
          width: 12, height: 12, borderRadius: "50%",
          background: statusColor,
          border: "2px solid var(--surface)",
          animation: "livePulse 1.6s ease-in-out infinite",
        }} />
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="font-semibold truncate" style={{ fontSize: 15, color: "var(--text-1)", marginBottom: 2 }}>
          {name}
        </p>
        <p className="font-mono truncate" style={{ fontSize: 12, color: "var(--text-3)" }}>
          {phone}
        </p>
      </div>

      {/* Status badge */}
      <span
        style={{
          padding: "3px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
          background: statusColor === "#4ade80" ? "rgba(74,222,128,0.12)" :
                      statusColor === "#facc15" ? "rgba(250,204,21,0.12)" : "rgba(148,163,184,0.12)",
          color: statusColor,
        }}
      >
        ● {statusLabel}
      </span>

      {/* Duration */}
      <div className="text-right" style={{ flexShrink: 0 }}>
        <div className="flex items-center gap-1.5 justify-end mb-1">
          <Clock size={12} style={{ color: "var(--text-4)" }} />
          <LiveDuration startedAt={call.startedAt} />
        </div>
        <p style={{ fontSize: 11, color: "var(--text-4)" }}>Started {startedAgo}</p>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ padding: "64px 32px" }}
    >
      <div
        style={{
          width: 80, height: 80, borderRadius: "50%", marginBottom: 24,
          background: "var(--surface-2)", border: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <Radio size={34} style={{ color: "var(--text-4)" }} />
      </div>
      <h2 className="font-semibold" style={{ fontSize: 18, color: "var(--text-1)", marginBottom: 8 }}>
        No active calls right now
      </h2>
      <p style={{ fontSize: 13, color: "var(--text-3)", maxWidth: 360, lineHeight: 1.6 }}>
        This page updates every 5 seconds. Active calls will appear here as soon as they start.
      </p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function LivePage() {
  const [calls, setCalls] = useState<VapiCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch("/api/live");
      if (res.ok) {
        const data = await res.json();
        setCalls(Array.isArray(data) ? data : []);
        setLastUpdated(new Date());
      }
    } catch {
      // silently ignore — keep showing stale data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLive();
    const id = setInterval(fetchLive, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchLive]);

  const count = calls.length;

  return (
    <div style={{ padding: "var(--card-p)" }} className="space-y-5">

      {/* ── Hero band ──────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0a4a73 0%, #0563a8 100%)",
          borderRadius: "10px",
          padding: "24px 32px",
          boxShadow: "0 4px 12px rgba(10,74,115,0.18)",
        }}
      >
        <img
          src="/icon-dots-white.svg"
          alt=""
          aria-hidden
          style={{ position: "absolute", top: -20, right: -20, width: 180, opacity: 0.06, pointerEvents: "none" }}
        />

        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-4">
            {/* Big pulsing dot */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "rgba(255,255,255,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Radio size={26} color="#fff" />
              </div>
              {count > 0 && (
                <span style={{
                  position: "absolute", top: -3, left: -3, right: -3, bottom: -3,
                  borderRadius: "50%", border: "2px solid #4ade80",
                  animation: "ringPulse 1.6s ease-in-out infinite",
                  pointerEvents: "none",
                }} />
              )}
            </div>

            <div>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 4 }}>
                Real-time monitoring
              </p>
              <h1 style={{ fontSize: 22, fontWeight: 600, color: "#fff", lineHeight: 1.2, margin: 0 }}>
                {loading ? "Loading…" : count === 0 ? "No active calls" : `${count} call${count > 1 ? "s" : ""} active`}
              </h1>
            </div>
          </div>

          {/* Right: refresh indicator */}
          <div className="flex items-center gap-2 shrink-0" style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
            <RefreshCw size={12} style={{ animation: "spin 3s linear infinite" }} />
            {lastUpdated ? `Updated ${formatDistanceToNow(lastUpdated, { addSuffix: true })}` : "Updating…"}
            <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 999, background: "rgba(255,255,255,0.1)", color: "#fff", fontSize: 11 }}>
              Auto-refresh 5s
            </span>
          </div>
        </div>
      </div>

      {/* ── Calls list ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-4)", fontSize: 13 }}>
          Loading active calls…
        </div>
      ) : count === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "var(--g-radius-md)",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <EmptyState />
        </div>
      ) : (
        <div className="space-y-3">
          {calls.map((call) => (
            <CallCard key={call.id} call={call} />
          ))}
        </div>
      )}
    </div>
  );
}
