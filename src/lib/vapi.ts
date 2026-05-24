const VAPI_BASE = "https://api.vapi.ai";

export interface VapiMessage {
  role: "assistant" | "user" | "bot" | "system" | "tool_calls" | "tool_call_result";
  message?: string;
  content?: string;
  secondsFromStart?: number;
  time?: number;
  duration?: number;
  endTime?: number;
  source?: string;
}

export interface VapiCall {
  id: string;
  assistantId?: string;
  type?: string; // "webCall" | "inboundPhoneCall" | "outboundPhoneCall"
  status?: string;
  endedReason?: string;

  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  updatedAt?: string;

  // Cost
  cost?: number;
  costBreakdown?: {
    transport?: number;
    stt?: number;
    llm?: number;
    tts?: number;
    vapi?: number;
    total?: number;
    llmPromptTokens?: number;
    llmCompletionTokens?: number;
    ttsCharacters?: number;
  };

  // Transcript (top-level plain text)
  transcript?: string;

  // Recording URLs (top-level shortcuts)
  recordingUrl?: string;
  stereoRecordingUrl?: string;

  // Messages (top-level array)
  messages?: VapiMessage[];

  // Customer info (populated for phone calls, empty for web calls)
  customer?: {
    number?: string;
    name?: string;
  } | string;

  // Phone number info
  phoneNumber?: string | { number?: string; name?: string };

  // Analysis (may be empty)
  analysis?: {
    summary?: string;
    successEvaluation?: string;
    structuredData?: {
      appointment_booked?: boolean;
      disposition?: string;
      [key: string]: unknown;
    };
  };

  // Artifact (mirrors top-level fields + structured recording URLs)
  artifact?: {
    transcript?: string;
    recordingUrl?: string;
    stereoRecordingUrl?: string;
    recording?: {
      stereoUrl?: string;
      mono?: {
        combinedUrl?: string;
        assistantUrl?: string;
        customerUrl?: string;
      };
    };
    messages?: VapiMessage[];
  };

  // Web call
  webCallUrl?: string;

  // Variable values passed to the assistant (name, phone, address, city)
  assistantOverrides?: {
    variableValues?: {
      name?: string;
      phone?: string;
      address?: string;
      city?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };

  // Legacy / not always populated
  durationSeconds?: number;
  summary?: string;
  metadata?: string;
}

/**
 * Get a normalized disposition key for a call.
 * Returns: BOOKED | CB | VM | DNC | NQ | NO_ANSWER | COMPLETED | OTHER
 */
export function getDispositionKey(call: VapiCall): string {
  const d = call.analysis?.structuredData?.disposition;
  if (d) {
    const upper = d.toUpperCase();
    if (upper === "BOOKED" || call.analysis?.structuredData?.appointment_booked) return "BOOKED";
    return upper;
  }
  if (call.analysis?.structuredData?.appointment_booked) return "BOOKED";
  const r = (call.endedReason ?? "").toLowerCase();
  if (r.includes("voicemail") || r.includes("machine")) return "VM";
  if (r.includes("no-answer") || r.includes("busy")) return "NO_ANSWER";
  if (r.includes("customer-ended") || r.includes("assistant-ended")) return "COMPLETED";
  if (r.includes("do-not-call") || r.includes("dnc")) return "DNC";
  return "OTHER";
}

/** Calculate duration in seconds from startedAt / endedAt */
export function getCallDuration(call: VapiCall): number {
  if (call.durationSeconds) return call.durationSeconds;
  if (call.startedAt && call.endedAt) {
    return Math.round(
      (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
    );
  }
  return 0;
}

/** Get customer display name — works for phone calls and web calls */
export function getCustomerName(call: VapiCall): string {
  // Variable values passed to assistant (e.g. {{name}})
  const vars = call.assistantOverrides?.variableValues;
  if (vars?.name) return vars.name;

  // Phone call customer object
  if (call.customer && typeof call.customer === "object") {
    return call.customer.name ?? call.customer.number ?? "—";
  }

  return "Web Call";
}

/** Get customer phone number */
export function getCustomerPhone(call: VapiCall): string {
  const vars = call.assistantOverrides?.variableValues;
  if (vars?.phone) return String(vars.phone);
  if (call.customer && typeof call.customer === "object") {
    return call.customer.number ?? "—";
  }
  return "—";
}

/** Get the plain-text transcript regardless of where VAPI puts it */
export function getTranscript(call: VapiCall): string {
  return call.transcript ?? call.artifact?.transcript ?? "";
}

/** Get messages array */
export function getMessages(call: VapiCall): VapiMessage[] {
  return (
    call.messages?.filter((m) => m.role === "user" || m.role === "bot" || m.role === "assistant") ??
    call.artifact?.messages?.filter((m) => m.role === "user" || m.role === "bot" || m.role === "assistant") ??
    []
  );
}

/** Get best recording URL */
export function getRecordingUrl(call: VapiCall): string | undefined {
  return (
    call.artifact?.recording?.mono?.combinedUrl ??
    call.recordingUrl ??
    call.artifact?.recordingUrl
  );
}

// ─── API Client ───────────────────────────────────────────────────────────────

interface GetCallsParams {
  createdAtGt?: string;
  createdAtLt?: string;
  limit?: number;
  assistantId?: string;
}

function buildQs(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  return qs.toString();
}

function vapiHeaders() {
  return {
    Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
    "Content-Type": "application/json",
  };
}

export async function getCalls(params: GetCallsParams = {}): Promise<VapiCall[]> {
  const qs = buildQs({
    createdAtGt: params.createdAtGt,
    createdAtLt: params.createdAtLt,
    limit: params.limit ?? 1000,
    ...(params.assistantId ? { assistantId: params.assistantId } : {}),
  });

  const url = `${VAPI_BASE}/call${qs ? `?${qs}` : ""}`;
  const res = await fetch(url, {
    headers: vapiHeaders(),
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    console.error("VAPI getCalls error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return Array.isArray(data) ? data : (data.calls ?? data.data ?? []);
}

export async function getCall(id: string): Promise<VapiCall | null> {
  const res = await fetch(`${VAPI_BASE}/call/${id}`, {
    headers: vapiHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}
