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

export interface VapiStructuredOutputResult {
  callDisposition?: string;
  name?: string;
  lastName?: string;
  phone?: string;
  date?: string;
  start?: string;
  end?: string;
  summary?: string;
  hand_off?: boolean;
  areHappyWithSolar?: boolean | null;
  interestedInExpertFollowup?: boolean | null;
  [key: string]: unknown;
}

export interface VapiCall {
  id: string;
  assistantId?: string;
  type?: string;
  status?: string;
  endedReason?: string;

  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  updatedAt?: string;

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

  transcript?: string;
  recordingUrl?: string;
  stereoRecordingUrl?: string;
  messages?: VapiMessage[];

  customer?: {
    number?: string;
    name?: string;
  } | string;

  phoneNumber?: string | { number?: string; name?: string };

  analysis?: {
    summary?: string;
    successEvaluation?: string;
    structuredData?: {
      appointment_booked?: boolean;
      disposition?: string;
      [key: string]: unknown;
    };
  };

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
    structuredOutputs?: Record<string, {
      name?: string;
      result?: VapiStructuredOutputResult;
    }>;
  };

  webCallUrl?: string;

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

  durationSeconds?: number;
  summary?: string;
  metadata?: string;
}

// ─── Campaign Types ────────────────────────────────────────────────────────────

export interface VapiCampaignCall {
  id: string;
  status?: string;
  endedReason?: string;
  startedAt?: string;
  endedAt?: string;
  analysis?: {
    summary?: string;
    successEvaluation?: string;
    structuredData?: {
      appointment_booked?: boolean;
      disposition?: string;
      [key: string]: unknown;
    };
  };
  customer?: {
    number?: string;
    name?: string;
    assistantOverrides?: {
      variableValues?: {
        name?: string;
        phone?: string;
        address?: string;
        city?: string;
        zip?: number | string;
        "last-name"?: string;
        [key: string]: unknown;
      };
    };
  };
}

export interface VapiCampaign {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  endedReason?: string;
  assistantId?: string;
  phoneNumberId?: string;
  callsCounterScheduled?: number;
  callsCounterQueued?: number;
  callsCounterInProgress?: number;
  callsCounterEnded?: number;
  callsCounterEndedVoicemail?: number;
  customers?: Array<{ number?: string; name?: string }>;
  calls?: Record<string, string>; // values are JSON strings — use parseCampaignCalls()
}

// ─── Call Helpers ─────────────────────────────────────────────────────────────

/** Returns the first structured output result across all schema IDs */
export function getStructuredOutput(call: VapiCall): VapiStructuredOutputResult | null {
  const outputs = call.artifact?.structuredOutputs;
  if (!outputs) return null;
  const values = Object.values(outputs);
  return (values[0]?.result as VapiStructuredOutputResult) ?? null;
}

export function getDispositionKey(call: VapiCall): string {
  // Prefer structured output callDisposition
  const so = getStructuredOutput(call);
  if (so?.callDisposition) {
    switch (so.callDisposition.toUpperCase()) {
      case "HAND_OFF":    return "BOOKED";
      case "VM":          return "VM";
      case "DNC":         return "DNC";
      case "DISQUALIFIED":return "NQ";
      case "NA":
      case "BUSY_TONE":
      case "NO_CONN":     return "NO_ANSWER";
      case "TIMEOUT":
      case "ROBO_KILL":
      case "HUNG_UP":     return "COMPLETED";
    }
  }
  // Legacy fallback
  const d = call.analysis?.structuredData?.disposition;
  if (d) {
    const upper = d.toUpperCase();
    if (upper === "BOOKED" || call.analysis?.structuredData?.appointment_booked) return "BOOKED";
    return upper;
  }
  if (call.analysis?.structuredData?.appointment_booked) return "BOOKED";
  const r = (call.endedReason ?? "").toLowerCase();
  if (r.includes("voicemail") || r.includes("machine")) return "VM";
  if (r.includes("no-answer") || r.includes("not-answer") || r.includes("did-not-answer") || r.includes("busy")) return "NO_ANSWER";
  if (r.includes("silence")) return "NO_ANSWER";
  if (r.includes("customer-ended") || r.includes("assistant-ended")) return "COMPLETED";
  if (r.includes("do-not-call") || r.includes("dnc")) return "DNC";
  return "OTHER";
}

export function getCallDuration(call: VapiCall): number {
  if (call.durationSeconds) return call.durationSeconds;
  if (call.startedAt && call.endedAt) {
    return Math.round(
      (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
    );
  }
  return 0;
}

export function getCustomerName(call: VapiCall): string {
  const vars = call.assistantOverrides?.variableValues;
  if (vars?.name) return vars.name;
  if (call.customer && typeof call.customer === "object") {
    return call.customer.name ?? call.customer.number ?? "—";
  }
  return "Web Call";
}

export function getCustomerPhone(call: VapiCall): string {
  const vars = call.assistantOverrides?.variableValues;
  if (vars?.phone) return String(vars.phone);
  if (call.customer && typeof call.customer === "object") {
    return call.customer.number ?? "—";
  }
  return "—";
}

export function getTranscript(call: VapiCall): string {
  return call.transcript ?? call.artifact?.transcript ?? "";
}

export function getMessages(call: VapiCall): VapiMessage[] {
  return (
    call.messages?.filter((m) => m.role === "user" || m.role === "bot" || m.role === "assistant") ??
    call.artifact?.messages?.filter((m) => m.role === "user" || m.role === "bot" || m.role === "assistant") ??
    []
  );
}

export function getRecordingUrl(call: VapiCall): string | undefined {
  return (
    call.artifact?.recording?.mono?.combinedUrl ??
    call.recordingUrl ??
    call.artifact?.recordingUrl
  );
}

// ─── Campaign Helpers ─────────────────────────────────────────────────────────

export function parseCampaignCalls(campaign: VapiCampaign): VapiCampaignCall[] {
  if (!campaign.calls) return [];
  return Object.values(campaign.calls).map((raw) => {
    try { return JSON.parse(raw) as VapiCampaignCall; } catch { return null; }
  }).filter(Boolean) as VapiCampaignCall[];
}

export function getCampaignCallName(call: VapiCampaignCall): string {
  const vars = call.customer?.assistantOverrides?.variableValues;
  if (vars?.name) {
    const last = vars["last-name"] ? ` ${vars["last-name"]}` : "";
    return `${vars.name}${last}`;
  }
  return call.customer?.name ?? call.customer?.number ?? "—";
}

export function getCampaignCallDuration(call: VapiCampaignCall): number {
  if (call.startedAt && call.endedAt) {
    return Math.max(0, Math.round(
      (new Date(call.endedAt).getTime() - new Date(call.startedAt).getTime()) / 1000
    ));
  }
  return 0;
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
    next: { revalidate: 60, tags: ["vapi-calls"] },
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

export async function getCampaigns(assistantId?: string): Promise<VapiCampaign[]> {
  const res = await fetch(`${VAPI_BASE}/campaign?limit=100`, {
    headers: vapiHeaders(),
    next: { revalidate: 60, tags: ["vapi-campaigns"] },
  });
  if (!res.ok) {
    console.error("VAPI getCampaigns error:", res.status, await res.text());
    return [];
  }
  const data = await res.json();
  let results: VapiCampaign[] = Array.isArray(data) ? data : (data.results ?? data.data ?? []);
  if (assistantId) {
    results = results.filter((c) => c.assistantId === assistantId);
  }
  return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getCampaign(id: string): Promise<VapiCampaign | null> {
  const res = await fetch(`${VAPI_BASE}/campaign/${id}`, {
    headers: vapiHeaders(),
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}
