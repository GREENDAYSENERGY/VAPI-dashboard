// Mock VAPI-shaped call data for the operator console
// Modeled on the real VapiCall interface from the imported repo.

const FIRSTS = ["Marcus","Linda","David","Priya","Jennifer","Sam","Rachel","Daniel","Aisha","Carlos","Emily","Tom","Sophie","Brandon","Maria","Kevin","Ngozi","Ethan","Hannah","Wei","Felipe","Joanne","Reggie","Anika","Lucas","Yuki","Olivia","Diego","Maya","Theo"];
const LASTS  = ["Martinez","Hughes","Chen","Patel","Okafor","Park","Hernandez","Wallace","Kim","Brooks","Nguyen","Davis","Reyes","Torres","Mitchell","Singh","Adams","Schultz","Khan","Bauer","Lopez","Tanaka","Walker","Ali","Garcia","Vargas","Carter","Sullivan","Banks"];
const DISPOSITIONS = [
  { key:"BOOKED",     weight: 18, ended:"customer-ended-call", booked:true,  successProb: 0.95 },
  { key:"CB",         weight: 22, ended:"customer-ended-call", booked:false, successProb: 0.78 },
  { key:"NQ",         weight: 9,  ended:"customer-ended-call", booked:false, successProb: 0.35 },
  { key:"DNC",        weight: 5,  ended:"customer-ended-call", booked:false, successProb: 0.15 },
  { key:"VM",         weight: 22, ended:"voicemail-detected",  booked:false, successProb: null },
  { key:"NO_ANSWER",  weight: 24, ended:"no-answer",           booked:false, successProb: null },
];

const SUMMARIES = {
  BOOKED: [
    "Confirmed the homeowner's January production drop was seasonal (sunny-day deficit) and provided a $277 savings recap. Booked a service visit on the 19th for a panel inspection and battery quote.",
    "Customer reported intermittent inverter alerts. Walked through diagnostic readings (system at 96% expected output), reassured them, and booked an on-site review for Thursday 2pm.",
    "Roof-owner asked about adding battery storage after recent outage. Reviewed offset numbers and high daytime export. Booked a battery sizing consult with the energy advisor next Tuesday.",
    "Resolved a billing question about the SREC payout. Customer asked about EV charger add-on; agent booked the installer for a Wednesday quote visit.",
  ],
  CB: [
    "Called to confirm appointment status after a string drop alert. Customer wants to think it over — set a 48-hour callback.",
    "Customer asked about EV charger pricing — agent shared the standard package and offered a follow-up call once spouse is available.",
    "Discussed a battery upgrade. Customer interested but on holiday next week; rescheduled callback for the 22nd.",
  ],
  NQ: [
    "Homeowner is renting and not the system decision-maker. Marked as not-qualified; logged renter status.",
    "System is owned by a 3rd-party PPA — out of scope for service tier. Disposition recorded.",
  ],
  DNC: [
    "Customer requested to be removed from future outreach. Marked DNC and confirmed in the system.",
  ],
  VM: [
    "No live answer; reached voicemail and left a 22-second message referencing the January production summary and a callback number.",
    "Voicemail box full. Left no message; will retry tomorrow morning per the calling window rules.",
    "Left a callback message regarding a scheduled service visit reminder.",
  ],
  NO_ANSWER: [
    "Rang for 28 seconds — no answer, no voicemail prompt. Scheduled a retry in the afternoon window.",
    "Phone disconnected mid-ring. Will attempt again on next cycle.",
  ],
};

const TRANSCRIPT_TEMPLATES = {
  BOOKED: [
    { r:"assistant", t:"Hi, this is Sunny from Sunrise Solar — I'm an AI assistant. I'm following up on your January production summary. Is now an okay time to talk for about 90 seconds?" },
    { r:"user",      t:"Yeah, that's fine. I actually had a question about my numbers." },
    { r:"assistant", t:"Of course. Looking at your system this month: you generated 928 kWh and saved $277 — that's about 5% higher than last January, and the drop you may have noticed is consistent with fewer sunny days this month, not a system issue. Did anything specific concern you?" },
    { r:"user",      t:"I just saw the dashboard was a little red on the 11th and 12th." },
    { r:"assistant", t:"Great catch. Those were the two cloudiest days in your region — your panels actually outperformed the cohort by 3% on both. I'd be happy to book a free inspection if you'd like reassurance, no charge for existing customers." },
    { r:"user",      t:"Sure, let's do it. What's available?" },
    { r:"assistant", t:"How does Thursday the 19th between 1pm and 3pm sound?" },
    { r:"user",      t:"That works." },
    { r:"assistant", t:"Confirmed — I'll send a text and email reminder 24 hours before. Anything else I can help with today?" },
    { r:"user",      t:"No, that's it. Thanks." },
    { r:"assistant", t:"Thanks for being a Sunrise customer. Have a great day." },
  ],
  CB: [
    { r:"assistant", t:"Hi, this is Sunny from Sunrise Solar — quick check-in on your system. Got a minute?" },
    { r:"user",      t:"I'm walking into a meeting actually." },
    { r:"assistant", t:"No problem — when would be a better time to reach you?" },
    { r:"user",      t:"Try me tomorrow afternoon, after 2." },
    { r:"assistant", t:"Got it. I'll call back tomorrow between 2 and 4. Thanks for your time." },
  ],
  NQ: [
    { r:"assistant", t:"Hi, this is Sunny from Sunrise Solar — calling about the system at this address." },
    { r:"user",      t:"Oh, I'm just renting here. I don't own the panels." },
    { r:"assistant", t:"Understood — thanks for letting me know. I'll update our records. Have a great day." },
  ],
  DNC: [
    { r:"assistant", t:"Hi, this is Sunny from Sunrise Solar—" },
    { r:"user",      t:"Please take me off your list. I don't want any more calls." },
    { r:"assistant", t:"Absolutely — I'll remove you from outreach right now. Sorry to bother you. Have a good day." },
  ],
  VM: [
    { r:"assistant", t:"Hi, this is Sunny from Sunrise Solar with a quick update on your January production. You generated 928 kWh and saved $277 — about 5% better than last year. If you'd like to chat, give us a call back at 555-0119. Have a great day." },
  ],
  NO_ANSWER: [],
};

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const i of items) { r -= i.weight; if (r <= 0) return i; }
  return items[0];
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pad(n) { return n.toString().padStart(2, "0"); }
function fmtPhone() {
  return `+1 (${200 + Math.floor(Math.random()*700)}) ${100 + Math.floor(Math.random()*900)}-${pad(Math.floor(Math.random()*10000)).padStart(4,"0")}`;
}

// Deterministic RNG so the demo is stable across reloads
let _seed = 42;
function rand() {
  _seed = (_seed * 9301 + 49297) % 233280;
  return _seed / 233280;
}
function pickWeightedDet(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rand() * total;
  for (const i of items) { r -= i.weight; if (r <= 0) return i; }
  return items[0];
}
function pickDet(arr) { return arr[Math.floor(rand() * arr.length)]; }

function buildCalls(n = 184) {
  const out = [];
  const now = new Date("2026-05-25T16:42:00Z").getTime();
  for (let i = 0; i < n; i++) {
    const minutesAgo = Math.floor(rand() * 14 * 24 * 60); // last 14 days
    const created = new Date(now - minutesAgo * 60_000);
    const disp = pickWeightedDet(DISPOSITIONS);
    let duration;
    if (disp.key === "NO_ANSWER") duration = 12 + Math.floor(rand() * 18);
    else if (disp.key === "VM") duration = 22 + Math.floor(rand() * 25);
    else if (disp.key === "DNC") duration = 14 + Math.floor(rand() * 12);
    else if (disp.key === "NQ") duration = 30 + Math.floor(rand() * 40);
    else if (disp.key === "CB") duration = 45 + Math.floor(rand() * 120);
    else duration = 110 + Math.floor(rand() * 220); // BOOKED

    const ratePerSec = 0.0028 + rand() * 0.001;
    const cost = +(duration * ratePerSec).toFixed(4);

    const fn = pickDet(FIRSTS);
    const ln = pickDet(LASTS);
    const transcript = TRANSCRIPT_TEMPLATES[disp.key] || [];
    const summary = pickDet(SUMMARIES[disp.key] || ["—"]);

    out.push({
      id: `call_${1000 + i}`,
      status: "ended",
      endedReason: disp.ended,
      createdAt: created.toISOString(),
      durationSeconds: duration,
      cost,
      costBreakdown: {
        stt: +(cost * 0.18).toFixed(4),
        llm: +(cost * 0.32).toFixed(4),
        tts: +(cost * 0.40).toFixed(4),
        transport: +(cost * 0.10).toFixed(4),
      },
      type: "outboundPhoneCall",
      assistantId: rand() > 0.5 ? "sunny-v3" : "sunny-v3-warm",
      customer: {
        name: `${fn} ${ln}`,
        number: fmtPhone(),
      },
      analysis: {
        summary,
        successEvaluation: disp.successProb !== null
          ? (disp.successProb > 0.65 ? "true" : "false")
          : undefined,
        structuredData: {
          disposition: disp.key,
          appointment_booked: disp.booked,
        },
      },
      artifact: {
        recordingUrl: "#",
        messages: transcript.map((m, idx) => ({
          role: m.r,
          message: m.t,
          secondsFromStart: idx * (4 + Math.floor(rand()*8)),
        })),
      },
    });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const CALLS = buildCalls(184);

// A handful of "live" calls — currently in progress
const LIVE_CALLS = [
  {
    id: "live_1",
    customer: { name: "Marcus Hughes", number: "+1 (512) 555-0192" },
    assistantId: "sunny-v3",
    startedAt: new Date(Date.now() - 142_000).toISOString(),
    elapsedSeconds: 142,
    status: "in-progress",
    sentiment: 0.62,
    intent: "Service inquiry — production drop",
    livePartial: "…that's why your January numbers look lower than December. Would you like to book a free panel inspection?",
    queue: 0,
  },
  {
    id: "live_2",
    customer: { name: "Aisha Khan", number: "+1 (480) 555-0144" },
    assistantId: "sunny-v3-warm",
    startedAt: new Date(Date.now() - 38_000).toISOString(),
    elapsedSeconds: 38,
    status: "in-progress",
    sentiment: 0.81,
    intent: "Battery upgrade — qualified",
    livePartial: "Great — I can check available consultation slots. Are weekday afternoons usually better, or weekends?",
    queue: 0,
  },
  {
    id: "live_3",
    customer: { name: "Theo Banks", number: "+1 (303) 555-0118" },
    assistantId: "sunny-v3",
    startedAt: new Date(Date.now() - 11_000).toISOString(),
    elapsedSeconds: 11,
    status: "ringing",
    sentiment: null,
    intent: null,
    livePartial: null,
    queue: 1,
  },
];

window.VAPI_DATA = { CALLS, LIVE_CALLS, DISPOSITIONS, SUMMARIES, TRANSCRIPT_TEMPLATES };

// Helpers
window.fmtDuration = (s) => {
  if (!s || s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.round(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
};
window.fmtMoney = (n, d = 2) => `$${(n ?? 0).toFixed(d)}`;
window.fmtMoneyCompact = (n) => {
  if (n == null) return "$0";
  if (n >= 1000) return `$${(n/1000).toFixed(1)}k`;
  if (n >= 10) return `$${n.toFixed(0)}`;
  return `$${n.toFixed(2)}`;
};
window.fmtNumber = (n) => (n ?? 0).toLocaleString("en-US");
window.getDispositionKey = (call) => {
  const d = call?.analysis?.structuredData?.disposition;
  if (d) return d.toUpperCase();
  const r = (call?.endedReason ?? "").toLowerCase();
  if (r.includes("voicemail") || r.includes("machine")) return "VM";
  if (r.includes("no-answer") || r.includes("busy")) return "NO_ANSWER";
  return "OTHER";
};
window.isConnected = (call) => {
  const k = window.getDispositionKey(call);
  return k !== "VM" && k !== "NO_ANSWER" && k !== "OTHER";
};
