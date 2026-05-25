/* Live Calls screen — real-time monitoring + transcript stream */

function LiveCallsScreen({ onOpenCall }) {
  const [liveCalls, setLiveCalls] = React.useState(window.VAPI_DATA.LIVE_CALLS);
  const [selectedId, setSelectedId] = React.useState(window.VAPI_DATA.LIVE_CALLS[0].id);
  const [muted, setMuted] = React.useState(false);
  const [tick, setTick] = React.useState(0);

  // Tick: bump elapsed seconds + stream in transcript fragments
  React.useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const selected = liveCalls.find(c => c.id === selectedId) || liveCalls[0];

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Operations · Live</div>
          <h1>Live Calls</h1>
          <div className="sub">{liveCalls.filter(c => c.status === "in-progress").length} in progress · 17 queued for the next 12 minutes</div>
        </div>
        <div className="actions">
          <div className="pills">
            <button type="button" className="pill active">All <span className="ct">{liveCalls.length}</span></button>
            <button type="button" className="pill">In progress</button>
            <button type="button" className="pill">Ringing</button>
            <button type="button" className="pill">Queued</button>
          </div>
          <button type="button" className="btn">
            <Icons.RefreshCw size={13}/> Refresh
          </button>
          <button type="button" className="btn danger">
            <Icons.PhoneOff size={13}/> Pause campaign
          </button>
        </div>
      </div>

      <div className="live-grid">
        {/* Left: active call list */}
        <div className="live-list">
          <div className="live-list-head">
            <div className="ttl">
              <Icons.Radio size={14} stroke="var(--accent)"/>
              Active sessions
            </div>
            <div className="meta">Auto-refresh · streaming over WebSocket</div>
          </div>
          <div className="live-items">
            {liveCalls.map(c => (
              <LiveListItem
                key={c.id}
                call={c}
                active={c.id === selectedId}
                onSelect={() => setSelectedId(c.id)}
                tick={tick}
              />
            ))}
            <QueuedItem name="Diego Vargas"  number="+1 (505) 555-0177" eta="in 1:48" intent="Production summary"/>
            <QueuedItem name="Maya Reyes"    number="+1 (415) 555-0102" eta="in 3:22" intent="Battery follow-up"/>
            <QueuedItem name="Yuki Tanaka"   number="+1 (650) 555-0146" eta="in 4:11" intent="EV charger interest"/>
            <QueuedItem name="Lucas Walker"  number="+1 (213) 555-0163" eta="in 5:30" intent="Service reminder" last/>
          </div>
        </div>

        {/* Right: selected call detail */}
        {selected && <LiveDetail call={selected} muted={muted} setMuted={setMuted} tick={tick}/>}
      </div>
    </div>
  );
}

function LiveListItem({ call, active, onSelect, tick }) {
  const elapsed = call.elapsedSeconds + (call.status === "in-progress" ? tick : 0);
  return (
    <div className={"live-item" + (active ? " active" : "")} onClick={onSelect}>
      <div className="hd">
        <div>
          <div className="nm">{call.customer.name}</div>
          <div className="ph">{call.customer.number}</div>
        </div>
        <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4}}>
          <span className={"live-status" + (call.status === "ringing" ? " ringing" : "")}>
            <span className="pip"></span>
            {call.status === "ringing" ? "Ringing" : "On call"}
          </span>
          {call.status === "in-progress" && (
            <span className="dur">{window.fmtDuration(elapsed)}</span>
          )}
        </div>
      </div>
      {call.intent && (
        <div className="bd"><b>Intent</b> · {call.intent}</div>
      )}
      {call.livePartial && (
        <div className="bd" style={{
          fontStyle: "italic", color: "var(--accent-deep)",
          padding: "6px 10px", marginTop: 8, background: "var(--accent-soft)",
          borderRadius: 8, lineHeight: 1.4
        }}>
          "{call.livePartial}"
        </div>
      )}
    </div>
  );
}

function QueuedItem({ name, number, eta, intent, last }) {
  return (
    <div className="live-item" style={{borderBottom: last ? 0 : undefined, opacity: 0.85}}>
      <div className="hd">
        <div>
          <div className="nm" style={{color:"var(--text-2)"}}>{name}</div>
          <div className="ph">{number}</div>
        </div>
        <div style={{display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4}}>
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
            color: "var(--text-3)"
          }}>
            Queued
          </span>
          <span style={{fontSize:12, fontFamily:"var(--font-mono)", color:"var(--text-3)"}}>{eta}</span>
        </div>
      </div>
      <div className="bd">{intent}</div>
    </div>
  );
}

function LiveDetail({ call, muted, setMuted, tick }) {
  const elapsed = (call.elapsedSeconds || 0) + tick;
  const sentimentPct = Math.round(((call.sentiment ?? 0.5)) * 100);

  const baseScript = window.VAPI_DATA.TRANSCRIPT_TEMPLATES.BOOKED;
  const messagesToShow = Math.min(baseScript.length, Math.max(2, Math.floor(elapsed / 14)));
  const visibleMsgs = baseScript.slice(0, messagesToShow);

  return (
    <div className="live-detail">
      <div className="live-d-hd">
        <div className="who">
          <h3 style={{display:"flex", alignItems:"center", gap:10}}>
            {call.customer.name}
            <span className={"live-status" + (call.status === "ringing" ? " ringing" : "")}>
              <span className="pip"></span>
              {call.status === "ringing" ? "Ringing" : "On call"}
            </span>
          </h3>
          <p>
            {call.customer.number}
            <span style={{color:"var(--text-4)"}}>·</span>
            <span style={{fontFamily:"var(--font-sans)"}}>Outbound · {call.assistantId}</span>
          </p>
        </div>
        <div className="ctrls">
          <button type="button" className="btn" onClick={() => setMuted(m => !m)}>
            {muted ? <Icons.MicOff size={13}/> : <Icons.Mic size={13}/>}
            {muted ? "Muted" : "Mic"}
          </button>
          <button type="button" className="btn">
            <Icons.Volume size={13}/> Listen in
          </button>
          <button type="button" className="btn">
            <Icons.Headphones size={13}/> Whisper
          </button>
          <button type="button" className="btn">
            <Icons.ArrowsLR size={13}/> Take over
          </button>
          <button type="button" className="btn danger">
            <Icons.PhoneOff size={13}/> End
          </button>
        </div>
      </div>

      <div className="live-d-meta">
        <div className="m">
          <div className="l">Elapsed</div>
          <div className="v mono">{window.fmtDuration(elapsed)}</div>
        </div>
        <div className="m">
          <div className="l">Sentiment</div>
          <div className="v">{sentimentPct}%</div>
          <div className="sentiment-bar"><div className="f" style={{width: `${sentimentPct}%`}}></div></div>
        </div>
        <div className="m">
          <div className="l">Intent</div>
          <div className="v" style={{fontSize:13}}>{call.intent || "—"}</div>
        </div>
        <div className="m">
          <div className="l">Cost so far</div>
          <div className="v mono">${(elapsed * 0.0031).toFixed(3)}</div>
        </div>
        <div className="m">
          <div className="l">Latency · TTFB</div>
          <div className="v mono">412 ms</div>
        </div>
      </div>

      <div className="live-transcript">
        {visibleMsgs.map((m, i) => (
          <div key={i} className={`tr-msg ${m.r === "assistant" ? "assistant" : "user"}`}>
            <div className="tav">{m.r === "assistant" ? "AI" : call.customer.name.split(" ").map(s=>s[0]).slice(0,2).join("")}</div>
            <div>
              <div className="tr-bub">{m.t}</div>
              <div className="ts">{Math.floor((i * 14)/60)}:{((i * 14) % 60).toString().padStart(2,"0")}</div>
            </div>
          </div>
        ))}
        {call.status === "in-progress" && (
          <div className="tr-partial">
            <span className="pulse"></span>
            <span>Listening… <i>{call.livePartial}</i></span>
          </div>
        )}
        {call.status === "ringing" && (
          <div style={{
            padding: 40, textAlign: "center",
            color: "var(--text-3)", fontSize: 13
          }}>
            <Icons.Phone size={32} stroke="var(--warn)"/>
            <div style={{marginTop: 12, fontWeight: 600, color: "var(--text-1)"}}>Ringing {call.customer.name}…</div>
            <div style={{marginTop: 4}}>Call will connect shortly. {tick}s ringing.</div>
          </div>
        )}
      </div>

      <div className="live-d-foot">
        <div className="left">
          <div className="audio-meter" title="Caller audio">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="am-bar"/>)}
          </div>
          <span style={{fontSize:11, color:"var(--text-3)"}}>Caller</span>
          <span style={{width:1, height:18, background:"var(--line)"}}></span>
          <div className="audio-meter" style={{opacity: 0.5}}>
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="am-bar"/>)}
          </div>
          <span style={{fontSize:11, color:"var(--text-3)"}}>Agent</span>
        </div>
        <div className="right">
          Recording <b style={{color:"var(--pos)"}}>●</b>
          <span>·</span>
          <span>Encrypted</span>
          <span>·</span>
          <span style={{fontFamily:"var(--font-mono)"}}>{call.id}</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LiveCallsScreen });
