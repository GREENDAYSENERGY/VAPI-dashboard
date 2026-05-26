"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronRight, Phone, Clock, CheckCircle, VoicemailIcon, XCircle, Loader2 } from "lucide-react";
import type { VapiCampaign, VapiCampaignCall } from "@/lib/vapi";
import { getCampaignCallName, getCampaignCallDuration, parseCampaignCalls } from "@/lib/vapi";
import { formatDuration } from "@/lib/pricing";

interface Props {
  campaigns: VapiCampaign[];
}

// ── Outcome helpers ────────────────────────────────────────────────────────────

function outcomeFromCall(call: VapiCampaignCall): { label: string; color: string; bg: string } {
  const disposition = call.analysis?.structuredData?.disposition?.toUpperCase();
  const booked = call.analysis?.structuredData?.appointment_booked;

  if (booked || disposition === "BOOKED") return { label: "Booked", color: "#166534", bg: "#dcfce7" };
  if (disposition === "CB") return { label: "Callback", color: "#0079c1", bg: "var(--accent-soft)" };
  if (disposition === "DNC") return { label: "DNC", color: "#dc2626", bg: "#fee2e2" };
  if (disposition === "NQ") return { label: "Not Qualified", color: "#5e6a78", bg: "#f1f1f4" };

  const r = (call.endedReason ?? "").toLowerCase();
  if (r.includes("voicemail") || r.includes("machine")) return { label: "Voicemail", color: "#92400e", bg: "#fef3c7" };
  if (r.includes("silence")) return { label: "No Answer", color: "#6b7280", bg: "#f3f4f6" };
  if (r.includes("no-answer") || r.includes("did-not-answer") || r.includes("busy")) return { label: "No Answer", color: "#6b7280", bg: "#f3f4f6" };
  if (r.includes("customer-ended") || r.includes("assistant-ended")) return { label: "Completed", color: "#166534", bg: "#dcfce7" };
  if (r.includes("error") || r.includes("failed")) return { label: "Error", color: "#dc2626", bg: "#fee2e2" };
  if (r) return { label: r.replace(/-/g, " "), color: "#6b7280", bg: "#f3f4f6" };
  return { label: "Unknown", color: "#9ca3af", bg: "#f9fafb" };
}

function statusBadge(status: string) {
  const s = status.toLowerCase();
  if (s === "active" || s === "in_progress") return { label: "Active", color: "#166534", bg: "#dcfce7" };
  if (s === "ended" || s === "completed") return { label: "Ended", color: "#6b7280", bg: "#f3f4f6" };
  if (s === "paused") return { label: "Paused", color: "#92400e", bg: "#fef3c7" };
  return { label: status, color: "#6b7280", bg: "#f3f4f6" };
}

// ── Expanded row ───────────────────────────────────────────────────────────────

function CampaignCallsRow({ campaignId }: { campaignId: string }) {
  const [calls, setCalls] = useState<VapiCampaignCall[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  if (!fetched && !loading) {
    setLoading(true);
    setFetched(true);
    fetch(`/api/campaigns/${campaignId}`)
      .then((r) => r.json())
      .then((data: VapiCampaign) => {
        setCalls(parseCampaignCalls(data));
        setLoading(false);
      })
      .catch(() => { setCalls([]); setLoading(false); });
  }

  if (loading) {
    return (
      <tr>
        <td colSpan={7} style={{ padding: "16px 24px 16px 56px", background: "var(--surface-2)" }}>
          <div className="flex items-center gap-2" style={{ color: "var(--text-3)", fontSize: 13 }}>
            <Loader2 size={14} className="animate-spin" />
            Loading calls…
          </div>
        </td>
      </tr>
    );
  }

  if (!calls || calls.length === 0) {
    return (
      <tr>
        <td colSpan={7} style={{ padding: "16px 24px 16px 56px", background: "var(--surface-2)" }}>
          <p style={{ fontSize: 13, color: "var(--text-4)" }}>No calls recorded for this campaign.</p>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={7} style={{ padding: 0, background: "var(--surface-2)" }}>
        <table className="w-full" style={{ fontSize: 12, borderCollapse: "collapse" }}>
          {/* Sub-header */}
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              {["Customer", "Phone", "Duration", "Outcome", "Date"].map((h) => (
                <th
                  key={h}
                  className="text-left font-semibold uppercase tracking-wider"
                  style={{ padding: "8px 14px 8px", fontSize: 10, color: "var(--text-4)", letterSpacing: "0.08em" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {calls.map((call) => {
              const outcome = outcomeFromCall(call);
              const duration = getCampaignCallDuration(call);
              const name = getCampaignCallName(call);
              const phone = call.customer?.number ?? call.customer?.assistantOverrides?.variableValues?.phone ?? "—";
              const date = call.startedAt
                ? format(parseISO(call.startedAt), "MMM d, h:mm a")
                : "—";

              return (
                <tr
                  key={call.id}
                  style={{ borderBottom: "1px solid var(--line-soft)" }}
                >
                  <td style={{ padding: "9px 14px", color: "var(--text-1)", fontWeight: 500 }}>
                    {name}
                  </td>
                  <td className="font-mono" style={{ padding: "9px 14px", color: "var(--text-3)" }}>
                    {String(phone)}
                  </td>
                  <td className="font-mono" style={{ padding: "9px 14px", color: "var(--text-2)" }}>
                    {duration > 0 ? formatDuration(duration) : <span style={{ color: "var(--text-4)" }}>—</span>}
                  </td>
                  <td style={{ padding: "9px 14px" }}>
                    <span
                      className="font-medium"
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 999,
                        fontSize: 11,
                        background: outcome.bg,
                        color: outcome.color,
                      }}
                    >
                      {outcome.label}
                    </span>
                  </td>
                  <td style={{ padding: "9px 14px", color: "var(--text-3)" }}>
                    {date}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </td>
    </tr>
  );
}

// ── Main table ─────────────────────────────────────────────────────────────────

export function CampaignsTable({ campaigns }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: "1px solid var(--line)", background: "var(--surface)", boxShadow: "var(--shadow-xs)" }}
    >
      <div className="overflow-x-auto">
        <table className="w-full" style={{ fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
              <th style={{ width: 40 }} />
              {["Campaign", "Date", "Status", "Scheduled", "Connected", "Voicemail", "Ended"].map((h) => (
                <th
                  key={h}
                  className="text-left font-semibold uppercase tracking-wider"
                  style={{ padding: "10px 14px", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.06em" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: 32, textAlign: "center", color: "var(--text-4)", fontSize: 13 }}>
                  No campaigns found.
                </td>
              </tr>
            )}
            {campaigns.map((c) => {
              const isOpen = expanded.has(c.id);
              const badge = statusBadge(c.status);
              const scheduled = c.callsCounterScheduled ?? 0;
              const ended = c.callsCounterEnded ?? 0;
              const vm = c.callsCounterEndedVoicemail ?? 0;
              const connected = ended - vm;
              const date = format(parseISO(c.createdAt), "MMM d, yyyy");

              return (
                <>
                  <tr
                    key={c.id}
                    onClick={() => toggle(c.id)}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom: isOpen ? "none" : "1px solid var(--line-soft)",
                      background: isOpen ? "var(--accent-soft)" : undefined,
                    }}
                    onMouseEnter={(e) => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = "var(--surface-2)"; }}
                    onMouseLeave={(e) => { if (!isOpen) (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    {/* Chevron */}
                    <td style={{ padding: "12px 0 12px 16px", width: 40 }}>
                      <span style={{ color: "var(--text-3)" }}>
                        {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </span>
                    </td>

                    {/* Name */}
                    <td style={{ padding: "12px 14px" }}>
                      <span className="font-semibold" style={{ color: "var(--text-1)" }}>{c.name}</span>
                    </td>

                    {/* Date */}
                    <td style={{ padding: "12px 14px", color: "var(--text-3)" }}>{date}</td>

                    {/* Status */}
                    <td style={{ padding: "12px 14px" }}>
                      <span
                        className="font-medium"
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 999,
                          fontSize: 11,
                          background: badge.bg,
                          color: badge.color,
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>

                    {/* Scheduled */}
                    <td style={{ padding: "12px 14px" }}>
                      <span className="flex items-center gap-1.5 font-mono" style={{ color: "var(--text-2)" }}>
                        <Phone size={12} style={{ color: "var(--text-4)" }} />
                        {scheduled}
                      </span>
                    </td>

                    {/* Connected */}
                    <td style={{ padding: "12px 14px" }}>
                      <span className="flex items-center gap-1.5 font-mono" style={{ color: connected > 0 ? "var(--pos)" : "var(--text-4)" }}>
                        <CheckCircle size={12} />
                        {connected}
                      </span>
                    </td>

                    {/* Voicemail */}
                    <td style={{ padding: "12px 14px" }}>
                      <span className="flex items-center gap-1.5 font-mono" style={{ color: vm > 0 ? "var(--warn)" : "var(--text-4)" }}>
                        <VoicemailIcon size={12} />
                        {vm}
                      </span>
                    </td>

                    {/* Ended */}
                    <td style={{ padding: "12px 14px" }}>
                      <span className="flex items-center gap-1.5 font-mono" style={{ color: "var(--text-3)" }}>
                        <Clock size={12} style={{ color: "var(--text-4)" }} />
                        {ended}
                      </span>
                    </td>
                  </tr>

                  {/* Expanded calls */}
                  {isOpen && <CampaignCallsRow key={`${c.id}-calls`} campaignId={c.id} />}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
