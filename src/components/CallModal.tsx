"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { VapiCall } from "@/lib/vapi";
import { formatDuration } from "@/lib/pricing";
import { format, parseISO } from "date-fns";

interface Props {
  call: VapiCall | null;
  open: boolean;
  onClose: () => void;
}

const DISPOSITION_COLORS: Record<string, string> = {
  CB: "bg-green-100 text-green-800",
  VM: "bg-yellow-100 text-yellow-800",
  DNC: "bg-red-100 text-red-800",
  NQ: "bg-purple-100 text-purple-800",
  Booked: "bg-blue-100 text-blue-800",
  Other: "bg-gray-100 text-gray-700",
};

export function CallModal({ call, open, onClose }: Props) {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  if (!call) return null;

  const disposition =
    call.analysis?.structuredData?.disposition?.toUpperCase() ?? "—";
  const colorClass =
    DISPOSITION_COLORS[disposition] ?? DISPOSITION_COLORS.Other;

  const messages = call.artifact?.messages ?? [];

  async function handleSaveNote() {
    if (!call) return;
    try {
      await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callId: call.id, note }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // silent fail
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <span>{call.customer?.name ?? call.customer?.number ?? "Unknown"}</span>
            <Badge className={`text-xs font-medium ${colorClass}`}>
              {disposition}
            </Badge>
            {call.analysis?.structuredData?.appointment_booked && (
              <Badge className="bg-blue-100 text-blue-800 text-xs">Booked ✓</Badge>
            )}
          </SheetTitle>
          <div className="text-sm text-gray-500 space-y-0.5 mt-1">
            <p>📞 {call.customer?.number ?? "—"}</p>
            <p>
              🕐 {call.createdAt ? format(parseISO(call.createdAt), "PPp") : "—"} ·{" "}
              ⏱ {formatDuration(call.durationSeconds ?? 0)}
            </p>
            <p>💵 VAPI cost: ${(call.cost ?? 0).toFixed(4)}</p>
          </div>
        </SheetHeader>

        {/* AI Summary */}
        {call.analysis?.summary && (
          <section className="mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">📝 AI Summary</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 leading-relaxed">
              {call.analysis.summary}
            </div>
          </section>
        )}

        {/* Recording */}
        {call.artifact?.recordingUrl && (
          <section className="mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">🎙 Recording</h3>
            <audio
              controls
              src={call.artifact.recordingUrl}
              className="w-full rounded-lg"
            />
          </section>
        )}

        {/* Transcript */}
        {messages.length > 0 && (
          <section className="mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">💬 Transcript</h3>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {messages
                .filter((m) => m.role === "assistant" || m.role === "user")
                .map((m, i) => {
                  const isAI = m.role === "assistant";
                  const text = m.message ?? m.content ?? "";
                  if (!text) return null;
                  return (
                    <div
                      key={i}
                      className={`flex ${isAI ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-snug ${
                          isAI
                            ? "bg-green-50 text-gray-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <p className="text-[10px] font-semibold text-gray-400 mb-0.5 uppercase">
                          {isAI ? "Agent" : "Customer"}
                        </p>
                        {text}
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* Plain transcript fallback */}
        {messages.length === 0 && call.artifact?.transcript && (
          <section className="mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">💬 Transcript</h3>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
              {call.artifact.transcript}
            </div>
          </section>
        )}

        {/* Notes */}
        <section>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Notes</h3>
          <textarea
            className="w-full rounded-lg border border-gray-200 p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-green-200"
            rows={3}
            placeholder="Add a note about this call…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="flex justify-end mt-2 gap-2">
            {saved && (
              <span className="text-xs text-green-600 self-center">Saved ✓</span>
            )}
            <Button
              size="sm"
              onClick={handleSaveNote}
              style={{ backgroundColor: "#166534" }}
            >
              Save Note
            </Button>
          </div>
        </section>
      </SheetContent>
    </Sheet>
  );
}
