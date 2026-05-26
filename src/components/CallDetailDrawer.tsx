"use client";

import { useState, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Sparkles,
  Headphones,
  Tag,
  FileText,
  DollarSign,
  MessageSquare,
  Download,
  Play,
  Pause,
  CheckCircle,
} from "lucide-react";
import type { VapiCall } from "@/lib/vapi";
import {
  getCallDuration,
  getCustomerName,
  getCustomerPhone,
  getTranscript,
  getMessages,
  getRecordingUrl,
  getDispositionKey,
  getStructuredOutput,
} from "@/lib/vapi";
import { calcCost, formatDuration } from "@/lib/pricing";
import { format, parseISO } from "date-fns";
import { CallDispositionChip } from "./DispositionChip";

interface Props {
  call: VapiCall | null;
  open: boolean;
  onClose: () => void;
}

// ─── Section wrapper ─────────────────────────────────────────────────────────
function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: "var(--accent)" }}>{icon}</span>
        <h3
          className="font-semibold"
          style={{ fontSize: 13, color: "var(--text-2)" }}
        >
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

// ─── KV row ──────────────────────────────────────────────────────────────────
function KV({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1.5" style={{ borderBottom: "1px solid var(--line-soft)" }}>
      <span
        className="shrink-0 font-medium"
        style={{ width: 140, fontSize: 12, color: "var(--text-3)" }}
      >
        {label}
      </span>
      <span className="flex-1 font-medium" style={{ fontSize: 12, color: "var(--text-1)" }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

// ─── Audio player ─────────────────────────────────────────────────────────────
function AudioPlayer({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  }

  function fmt(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  }

  const pct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}
    >
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)}
      />
      <button
        onClick={toggle}
        className="flex items-center justify-center shrink-0 rounded-full transition-opacity hover:opacity-80"
        style={{
          width: 36,
          height: 36,
          background: "var(--accent)",
          color: "#fff",
        }}
      >
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>

      {/* Progress bar */}
      <div className="flex-1 min-w-0">
        <div
          className="relative rounded-full overflow-hidden cursor-pointer"
          style={{ height: 4, background: "var(--surface-3)" }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            if (audioRef.current) {
              audioRef.current.currentTime = ratio * duration;
              setCurrentTime(ratio * duration);
            }
          }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${pct}%`, background: "var(--accent)" }}
          />
        </div>
        <div
          className="flex justify-between mt-1 font-mono"
          style={{ fontSize: 10, color: "var(--text-4)" }}
        >
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      <a
        href={url}
        download
        className="shrink-0 rounded-lg p-1.5 transition-colors hover:opacity-70"
        style={{ color: "var(--text-3)" }}
        title="Download recording"
      >
        <Download size={15} />
      </a>
    </div>
  );
}

// ─── Cost stacked bar ─────────────────────────────────────────────────────────
const COST_SEGMENTS = [
  { key: "stt",       label: "STT",       color: "#60a5fa" },
  { key: "llm",       label: "LLM",       color: "#2563eb" },
  { key: "tts",       label: "TTS",       color: "#1d4ed8" },
  { key: "transport", label: "Telephony", color: "#bfdbfe" },
  { key: "vapi",      label: "Platform",  color: "#93c5fd" },
];

function CostBar({ call }: { call: VapiCall }) {
  const cb = call.costBreakdown;
  const total = call.cost ?? 0;
  if (!cb || total === 0) return null;

  return (
    <div className="mt-2">
      {/* Stacked bar */}
      <div className="flex rounded-lg overflow-hidden" style={{ height: 10 }}>
        {COST_SEGMENTS.map(({ key, color }) => {
          const v = (cb as Record<string, number | undefined>)[key] ?? 0;
          const pct = total > 0 ? (v / total) * 100 : 0;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              style={{ width: `${pct}%`, background: color }}
              title={`${key}: $${v.toFixed(4)}`}
            />
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2">
        {COST_SEGMENTS.map(({ key, label, color }) => {
          const v = (cb as Record<string, number | undefined>)[key] ?? 0;
          if (v === 0) return null;
          return (
            <div key={key} className="flex items-center gap-1.5">
              <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>{label}</span>
              <span style={{ fontSize: 11, color: "var(--text-2)", fontFamily: "var(--font-mono)" }}>
                ${v.toFixed(4)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main drawer ──────────────────────────────────────────────────────────────
export function CallDetailDrawer({ call, open, onClose }: Props) {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  if (!call) return null;

  const dispKey = getDispositionKey(call);
  const duration = getCallDuration(call);
  const customerName = getCustomerName(call);
  const customerPhone = getCustomerPhone(call);
  const messages = getMessages(call);
  const transcript = getTranscript(call);
  const recordingUrl = getRecordingUrl(call);
  const aiCost = calcCost(duration);

  const createdDisplay = call.createdAt
    ? format(parseISO(call.createdAt), "PPp")
    : "—";

  async function handleSaveNote() {
    if (!call) return;
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: call.id, note }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      // silent fail
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        className="overflow-y-auto"
        style={{ width: "min(720px, 92vw)", background: "var(--surface)", borderLeft: "1px solid var(--line)" }}
      >
        <SheetHeader className="mb-6">
          {/* ── 1. Header ── */}
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle
              className="font-semibold"
              style={{ fontSize: 18, color: "var(--text-1)", fontFamily: "var(--font-sans)" }}
            >
              {customerName}
            </SheetTitle>
            <CallDispositionChip call={call} />
            {getStructuredOutput(call)?.hand_off && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ background: "var(--pos-soft)", color: "var(--pos)", fontSize: 11, fontWeight: 600 }}
              >
                <CheckCircle size={11} />
                Hand-off Scheduled
              </span>
            )}
          </div>

          {/* Meta row */}
          <div
            className="flex flex-wrap gap-x-4 gap-y-1 mt-2"
            style={{ fontSize: 12, color: "var(--text-3)" }}
          >
            {customerPhone !== "—" && <span>📞 {customerPhone}</span>}
            <span>📅 {createdDisplay}</span>
            <span>⏱ {formatDuration(duration)}</span>
            <span>💵 ${aiCost.toFixed(3)}</span>
          </div>
        </SheetHeader>

        {/* ── 2. AI Summary ── */}
        {(getStructuredOutput(call)?.summary ?? call.analysis?.summary) && (
          <Section icon={<Sparkles size={15} />} title="AI Summary">
            <div
              className="p-3 rounded-xl text-sm leading-relaxed"
              style={{
                background: "var(--accent-soft)",
                borderLeft: "3px solid var(--accent)",
                color: "var(--text-1)",
              }}
            >
              {getStructuredOutput(call)?.summary ?? call.analysis?.summary}
            </div>
          </Section>
        )}

        {/* ── 3. Recording ── */}
        {recordingUrl && (
          <Section icon={<Headphones size={15} />} title="Recording">
            <AudioPlayer url={recordingUrl} />
          </Section>
        )}

        {/* ── 4. Structured Data ── */}
        {(() => {
          const so = getStructuredOutput(call);
          const DISP_LABEL: Record<string, string> = {
            HAND_OFF: "Hand-off Scheduled",
            HUNG_UP: "Hung Up",
            VM: "Voicemail",
            NA: "No Answer",
            BUSY_TONE: "Busy Tone",
            NO_CONN: "No Connection",
            TIMEOUT: "Timeout",
            ROBO_KILL: "Call Ended by Bot",
            DNC: "Do Not Call",
            DISQUALIFIED: "Disqualified",
          };
          const fmt = (v: boolean | null | undefined) =>
            v === true ? "Yes" : v === false ? "No" : "—";

          return (
            <Section icon={<Tag size={15} />} title="Call Details">
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--line)" }}>
                <div style={{ padding: "4px 12px" }}>
                  <KV label="Disposition" value={<CallDispositionChip call={call} />} />
                  {so?.callDisposition && (
                    <KV label="Call outcome" value={DISP_LABEL[so.callDisposition] ?? so.callDisposition} />
                  )}
                  <KV label="Hand-off scheduled" value={fmt(so?.hand_off)} />
                  <KV label="Interested in follow-up" value={fmt(so?.interestedInExpertFollowup)} />
                  {so?.areHappyWithSolar !== null && so?.areHappyWithSolar !== undefined && (
                    <KV label="Happy with solar" value={fmt(so.areHappyWithSolar)} />
                  )}
                  <KV label="Ended reason" value={call.endedReason ?? "—"} />
                </div>
              </div>
            </Section>
          );
        })()}

        {/* ── 5. Transcript ── */}
        {(messages.length > 0 || transcript) && (
          <Section icon={<FileText size={15} />} title="Transcript">
            {messages.length > 0 ? (
              <div
                className="space-y-2 overflow-y-auto pr-1"
                style={{
                  maxHeight: 360,
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  padding: "12px",
                }}
              >
                {messages.map((m, i) => {
                  const isAI = m.role === "assistant" || m.role === "bot";
                  const text = m.message ?? m.content ?? "";
                  if (!text) return null;
                  const ts = m.secondsFromStart != null ? `${Math.floor(m.secondsFromStart)}s` : null;
                  return (
                    <div key={i} className="flex gap-3">
                      {/* Role pill */}
                      <div className="shrink-0 pt-0.5">
                        <span
                          className="inline-block px-1.5 py-0.5 rounded font-semibold uppercase tracking-wide"
                          style={{
                            fontSize: 9,
                            background: isAI ? "var(--accent-soft)" : "var(--surface-3)",
                            color: isAI ? "var(--accent)" : "var(--text-3)",
                          }}
                        >
                          {isAI ? "Agent" : "Customer"}
                        </span>
                        {ts && (
                          <div
                            className="text-center font-mono mt-0.5"
                            style={{ fontSize: 9, color: "var(--text-4)" }}
                          >
                            {ts}
                          </div>
                        )}
                      </div>
                      {/* Message */}
                      <p
                        className="flex-1 leading-relaxed"
                        style={{ fontSize: 12, color: "var(--text-1)" }}
                      >
                        {text}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="rounded-xl p-3 text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto"
                style={{
                  maxHeight: 360,
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  color: "var(--text-1)",
                }}
              >
                {transcript}
              </div>
            )}
          </Section>
        )}

        {/* ── 6. Cost Breakdown ── */}
        {call.costBreakdown && (
          <Section icon={<DollarSign size={15} />} title="Cost Breakdown">
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className="font-mono font-semibold"
                style={{ fontSize: 20, color: "var(--text-1)" }}
              >
                ${(call.cost ?? 0).toFixed(4)}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                VAPI internal cost
              </span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>·</span>
              <span
                className="font-mono font-semibold"
                style={{ fontSize: 14, color: "var(--accent)" }}
              >
                ${aiCost.toFixed(3)}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                billed
              </span>
            </div>
            <CostBar call={call} />
          </Section>
        )}

        {/* ── 7. Notes ── */}
        <Section icon={<MessageSquare size={15} />} title="Notes">
          <textarea
            className="w-full rounded-xl resize-none focus:outline-none"
            rows={3}
            placeholder="Add a note about this call…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{
              border: "1px solid var(--line)",
              background: "var(--surface-2)",
              color: "var(--text-1)",
              fontSize: 13,
              padding: "10px 12px",
              fontFamily: "var(--font-sans)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--accent)";
              e.currentTarget.style.boxShadow = "var(--shadow-focus)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--line)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <div className="flex justify-end items-center gap-3 mt-2">
            {saved && (
              <span
                className="inline-flex items-center gap-1 text-xs font-medium"
                style={{ color: "var(--pos)" }}
              >
                <CheckCircle size={12} />
                Saved
              </span>
            )}
            <button
              onClick={handleSaveNote}
              className="px-4 py-1.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-85"
              style={{
                background: "var(--accent)",
                color: "#fff",
              }}
            >
              Save Note
            </button>
          </div>
        </Section>
      </SheetContent>
    </Sheet>
  );
}
