"use client";

import { useState } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import type { VapiCall } from "@/lib/vapi";
import { getCustomerName, getDispositionKey, getCallDuration } from "@/lib/vapi";
import { formatDuration } from "@/lib/pricing";
import { CallDispositionChip } from "./DispositionChip";
import { CallDetailDrawer } from "./CallDetailDrawer";

const DISP_BG: Record<string, string> = {
  BOOKED:    "var(--pos-soft)",
  CB:        "var(--accent-soft)",
  VM:        "var(--warn-soft)",
  DNC:       "var(--neg-soft)",
  NQ:        "#f1f1f4",
  NO_ANSWER: "var(--surface-3)",
  COMPLETED: "var(--surface-3)",
  OTHER:     "var(--surface-3)",
};

const DISP_FG: Record<string, string> = {
  BOOKED: "var(--pos)",
  CB:     "var(--accent)",
  VM:     "var(--warn)",
  DNC:    "var(--neg)",
  NQ:     "#5e6a78",
  NO_ANSWER: "var(--text-3)",
  COMPLETED: "var(--text-3)",
  OTHER:  "var(--text-3)",
};

const DISP_INITIAL: Record<string, string> = {
  BOOKED: "B", CB: "C", VM: "V", DNC: "D", NQ: "N", NO_ANSWER: "—", COMPLETED: "✓", OTHER: "?",
};

export function OverviewActivitySection({ calls }: { calls: VapiCall[] }) {
  const [selected, setSelected] = useState<VapiCall | null>(null);

  return (
    <>
      <div className="divide-y" style={{ "--tw-divide-opacity": 1 } as React.CSSProperties}>
        {calls.map((call) => {
          const dispKey = getDispositionKey(call);
          const name = getCustomerName(call);
          const duration = getCallDuration(call);
          const timeAgo = call.createdAt
            ? formatDistanceToNow(parseISO(call.createdAt), { addSuffix: true })
            : "";

          return (
            <div
              key={call.id}
              onClick={() => setSelected(call)}
              className="flex items-center gap-3 py-3 cursor-pointer transition-colors hover:bg-[var(--surface-2)] -mx-4 px-4"
            >
              {/* Disposition icon circle */}
              <div
                className="shrink-0 flex items-center justify-center rounded-full font-semibold"
                style={{
                  width: 36,
                  height: 36,
                  background: DISP_BG[dispKey] ?? "var(--surface-3)",
                  color: DISP_FG[dispKey] ?? "var(--text-3)",
                  fontSize: 14,
                }}
              >
                {DISP_INITIAL[dispKey] ?? "?"}
              </div>

              {/* Name + excerpt */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-medium truncate"
                  style={{ fontSize: 13, color: "var(--text-1)" }}
                >
                  {name}
                </p>
                <p className="truncate" style={{ fontSize: 11, color: "var(--text-4)" }}>
                  {formatDuration(duration)} · {timeAgo}
                </p>
              </div>

              {/* Chip */}
              <CallDispositionChip call={call} />
            </div>
          );
        })}

        {calls.length === 0 && (
          <p style={{ fontSize: 13, color: "var(--text-4)", padding: "16px 0" }}>No recent calls.</p>
        )}
      </div>

      <CallDetailDrawer
        call={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
