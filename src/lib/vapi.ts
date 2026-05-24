const VAPI_BASE = "https://api.vapi.ai";

export interface VapiCall {
  id: string;
  status: string;
  endedReason?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  costBreakdown?: Record<string, number>;
  durationSeconds?: number;
  type?: string;
  phoneNumberId?: string;
  assistantId?: string;
  customer?: {
    number?: string;
    name?: string;
  };
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
    messages?: Array<{
      role: "assistant" | "user" | "system" | "tool";
      message?: string;
      content?: string;
      time?: number;
      endTime?: number;
      secondsFromStart?: number;
    }>;
  };
}

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
  // VAPI returns array directly or { calls: [...] }
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
