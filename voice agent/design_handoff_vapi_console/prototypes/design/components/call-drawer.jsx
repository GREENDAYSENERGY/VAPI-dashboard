/* Call detail drawer — opens from logs / overview */

function CallDetailDrawer({ call, onClose }) {
  const [note, setNote] = React.useState("");
  const [playing, setPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0.0);

  React.useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 1) { setPlaying(false); return 1; }
        return p + 0.012;
      });
    }, 200);
    return () => clearInterval(id);
  }, [playing]);

  if (!call) return null;

  const disp = window.getDispositionKey(call);
  const msgs = (call.artifact?.messages || []).filter(m => m.role === "assistant" || m.role === "user");
  const totalSec = call.durationSeconds || 0;
  const totalMs = totalSec * 1000;
  const cb = call.costBreakdown || {};

  const fmtTs = (sec) => {
    if (sec == null) return "";
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2,"0")}`;
  };
  const initials = (call.customer?.name || "?").split(" ").map(s => s[0]).slice(0,2).join("");

  return (
    <div className="drawer-mask" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="drawer">
        <div className="drawer-head">
          <div>
            <h2>
              {call.customer?.name || "Unknown caller"}
              <DispositionChip k={disp}/>
              {call.analysis?.structuredData?.appointment_booked && disp !== "BOOKED" && (
                <span className="chip disp-BOOKED">Booked</span>
              )}
            </h2>
            <div className="meta">
              <span><Icons.Phone size={12}/> {call.customer?.number}</span>
              <span><Icons.Calendar size={12}/> {new Date(call.createdAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span>
              <span><Icons.Clock size={12}/> {window.fmtDuration(totalSec)}</span>
              <span><Icons.Bot size={12}/> {call.assistantId}</span>
              <span><Icons.DollarSign size={12}/> {window.fmtMoney(call.cost, 4)}</span>
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <Icons.Close size={18}/>
          </button>
        </div>

        <div className="drawer-body">
          {/* AI summary */}
          <div className="section-h">
            <span className="ico"><Icons.Sparkles size={12}/></span>
            AI Summary
          </div>
          <div className="summary">{call.analysis?.summary}</div>

          {/* Recording */}
          <div className="section-h">
            <span className="ico"><Icons.Headphones size={12}/></span>
            Recording
          </div>
          <div className="recorder">
            <button type="button" className="rec-btn" onClick={() => setPlaying(p => !p)}>
              {playing ? <Icons.Pause size={16}/> : <Icons.Play size={16}/>}
            </button>
            <div className="rec-wave">
              <FakeWaveform progress={progress} bars={64}/>
            </div>
            <div className="rec-time">{fmtTs(progress * totalSec)} / {fmtTs(totalSec)}</div>
            <button type="button" className="icon-btn" title="Download"><Icons.Download size={14}/></button>
          </div>

          {/* Key data */}
          <div className="section-h">
            <span className="ico"><Icons.Tag size={12}/></span>
            Structured Data
          </div>
          <div className="kv-grid">
            <div className="kv"><div className="l">Disposition</div><div className="v sans">{DISP_LABEL[disp]}</div></div>
            <div className="kv"><div className="l">Appointment</div><div className="v sans">{call.analysis?.structuredData?.appointment_booked ? "Booked" : "—"}</div></div>
            <div className="kv"><div className="l">Success eval</div><div className="v sans">{call.analysis?.successEvaluation ?? "—"}</div></div>
            <div className="kv"><div className="l">Ended reason</div><div className="v sans">{call.endedReason}</div></div>
            <div className="kv"><div className="l">Call ID</div><div className="v">{call.id}</div></div>
            <div className="kv"><div className="l">Assistant</div><div className="v sans">{call.assistantId}</div></div>
          </div>

          {/* Transcript */}
          {msgs.length > 0 ? (
            <>
              <div className="section-h">
                <span className="ico"><Icons.FileText size={12}/></span>
                Transcript
                <span style={{marginLeft:"auto", fontWeight:400, textTransform:"none", letterSpacing:0, fontSize:11, color:"var(--text-3)"}}>
                  {msgs.length} messages
                </span>
              </div>
              <div className="transcript">
                {msgs.map((m, i) => (
                  <div key={i} className={`tr-line ${m.role}`}>
                    <div className="role">
                      {m.role === "assistant" ? "Agent" : "Caller"}
                      <div className="tm">{fmtTs(m.secondsFromStart)}</div>
                    </div>
                    <div className="tx">{m.message}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="section-h">
                <span className="ico"><Icons.FileText size={12}/></span>
                Transcript
              </div>
              <div className="transcript">
                <div className="tr-line">
                  <div className="role">—</div>
                  <div className="tx" style={{color:"var(--text-3)", fontStyle:"italic"}}>No transcript — call did not connect.</div>
                </div>
              </div>
            </>
          )}

          {/* Cost breakdown */}
          <div className="section-h">
            <span className="ico"><Icons.DollarSign size={12}/></span>
            Cost Breakdown
          </div>
          <CostBreakdown call={call}/>

          {/* Notes */}
          <div className="section-h">
            <span className="ico"><Icons.MessageSquare size={12}/></span>
            Notes
          </div>
          <textarea
            className="notes-ta"
            placeholder="Add a note for the ops team…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div style={{display:"flex", justifyContent:"flex-end", gap:8, marginTop:10}}>
            <button type="button" className="btn ghost">Reassign</button>
            <button type="button" className="btn primary">
              <Icons.CheckCircle size={14}/> Save note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CostBreakdown({ call }) {
  const cb = call.costBreakdown || {};
  const total = (cb.stt || 0) + (cb.llm || 0) + (cb.tts || 0) + (cb.transport || 0);
  const segs = [
    { k: "stt",       label: "Speech-to-text", color: "var(--blue-400)", value: cb.stt || 0 },
    { k: "llm",       label: "LLM",            color: "var(--blue-600)", value: cb.llm || 0 },
    { k: "tts",       label: "Text-to-speech", color: "var(--blue-700)", value: cb.tts || 0 },
    { k: "transport", label: "Telephony",      color: "var(--blue-200)", value: cb.transport || 0 },
  ];
  return (
    <div style={{padding:"14px 18px", background:"var(--surface-2)", border:"1px solid var(--line)", borderRadius:"var(--radius-md)"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:10}}>
        <div style={{fontSize:11, fontWeight:600, color:"var(--text-3)", textTransform:"uppercase", letterSpacing:"0.08em"}}>VAPI cost</div>
        <div style={{fontFamily:"var(--font-mono)", fontWeight:700, fontSize:16, color:"var(--text-1)"}}>{window.fmtMoney(total, 4)}</div>
      </div>
      <div className="cb-stack">
        {segs.map(s => total > 0 && (
          <div key={s.k} className="cb-seg" style={{width: `${(s.value/total)*100}%`, background: s.color}} title={`${s.label}: ${window.fmtMoney(s.value, 4)}`}></div>
        ))}
      </div>
      <div className="cb-legend">
        {segs.map(s => (
          <span key={s.k}>
            <span className="dot" style={{background: s.color}}></span>
            {s.label} <b>{window.fmtMoney(s.value, 4)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

function FakeWaveform({ progress = 0, bars = 64 }) {
  // Deterministic pseudo-random pattern
  const arr = React.useMemo(() => {
    let s = 7;
    return Array.from({ length: bars }, () => {
      s = (s * 9301 + 49297) % 233280;
      const r = s / 233280;
      return 0.15 + r * 0.85;
    });
  }, [bars]);
  return (
    <svg viewBox={`0 0 ${bars * 4} 36`} preserveAspectRatio="none">
      {arr.map((h, i) => {
        const x = i * 4 + 1;
        const barH = h * 32;
        const y = (36 - barH) / 2;
        const past = (i / bars) <= progress;
        return <rect key={i} x={x} y={y} width="2" height={barH}
          fill={past ? "var(--accent)" : "var(--line-strong)"} rx="1"/>;
      })}
    </svg>
  );
}

Object.assign(window, { CallDetailDrawer });
