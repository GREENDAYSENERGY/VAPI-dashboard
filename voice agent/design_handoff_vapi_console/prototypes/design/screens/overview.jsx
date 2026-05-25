/* Overview screen — operations command center */

function OverviewScreen({ onOpenCall, onGoLive, onGoLogs, liveCount }) {
  const calls = window.VAPI_DATA.CALLS;
  const today = calls.slice(0, 42); // simulate "today"

  // Aggregates
  const total = calls.length;
  const connected = calls.filter(window.isConnected).length;
  const booked = calls.filter(c => c.analysis?.structuredData?.appointment_booked).length;
  const totalCost = calls.reduce((s, c) => s + (c.cost || 0), 0);
  const avgDur = calls.reduce((s, c) => s + (c.durationSeconds || 0), 0) / Math.max(1, calls.length);
  const connRate = (connected / Math.max(1, total)) * 100;
  const bookedRate = (booked / Math.max(1, connected)) * 100;

  // Disposition stack
  const dispCounts = {};
  for (const c of calls) {
    const k = window.getDispositionKey(c);
    dispCounts[k] = (dispCounts[k] || 0) + 1;
  }
  const dispOrder = ["BOOKED", "CB", "VM", "NQ", "DNC", "NO_ANSWER"];

  // Hourly distribution (last 24h)
  const now = new Date("2026-05-25T16:42:00Z");
  const hours = Array.from({ length: 24 }, (_, i) => {
    const start = new Date(now.getTime() - (23 - i) * 3600_000);
    const end = new Date(start.getTime() + 3600_000);
    const ct = calls.filter(c => {
      const t = new Date(c.createdAt);
      return t >= start && t < end;
    }).length;
    return { hour: start.getHours(), count: ct, isCurrent: i === 23 };
  });
  const maxHour = Math.max(...hours.map(h => h.count), 1);

  // Sparkline data: last 14 days call volume
  const days14 = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(now.getTime() - (13 - i) * 86400_000);
    const ct = calls.filter(c => {
      const t = new Date(c.createdAt);
      return t.toDateString() === day.toDateString();
    }).length;
    return ct;
  });

  const recent = calls.slice(0, 7);

  return (
    <div>
      <div className="hero">
        <div className="hero-row">
          <div style={{maxWidth: 520}}>
            <div className="h-eb">Good afternoon, Alex</div>
            <h2>Your fleet is performing well today.</h2>
            <p className="h-sub">Sunny generated <b style={{color:"#fff"}}>{booked} appointments</b> from <b style={{color:"#fff"}}>{connected.toLocaleString()} connected calls</b> — that's a <b style={{color:"#fff"}}>{bookedRate.toFixed(0)}% booking rate</b>, +4pts above your 30-day baseline.</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="lb">Live now</div>
              <div className="vl">{liveCount}</div>
              <div className="sb">2 connected · 1 ringing</div>
            </div>
            <div className="hero-divider"></div>
            <div className="hero-stat">
              <div className="lb">Queued · today</div>
              <div className="vl">17</div>
              <div className="sb">Next call in 2:14</div>
            </div>
            <div className="hero-divider"></div>
            <div className="hero-stat">
              <div className="lb">Spend · today</div>
              <div className="vl">$74</div>
              <div className="sb">$1.76 / appointment</div>
            </div>
            <div className="hero-divider"></div>
            <button type="button" className="btn primary" onClick={onGoLive} style={{background:"#fff", color:"var(--accent-deep)", borderColor:"#fff", alignSelf:"flex-end"}}>
              <Icons.Radio size={14}/> Monitor live
            </button>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-row" style={{marginBottom: 18}}>
        <KPI
          featured
          label="Calls placed · 14d"
          value={window.fmtNumber(total)}
          delta={12}
          sub="vs prior 14d"
          spark={days14}
          Icon={Icons.Phone}
        />
        <KPI
          label="Connect rate"
          value={`${connRate.toFixed(1)}%`}
          delta={2.4}
          sub={`${connected.toLocaleString()} connected`}
          Icon={Icons.Activity}
        />
        <KPI
          label="Appointments booked"
          value={window.fmtNumber(booked)}
          delta={18}
          sub={`${bookedRate.toFixed(0)}% of connected`}
          Icon={Icons.Calendar2}
        />
        <KPI
          label="Avg handle time"
          value={window.fmtDuration(avgDur)}
          delta={-6}
          deltaInverse
          sub="faster than baseline"
          Icon={Icons.Clock}
        />
      </div>

      {/* Charts row */}
      <div className="grid-3" style={{marginBottom: 18}}>
        <div className="card">
          <div className="card-head">
            <h3>Call volume · last 24 hours</h3>
            <span className="meta">{calls.filter(c => new Date(c.createdAt) >= new Date(now.getTime() - 86400_000)).length} calls</span>
          </div>
          <div className="card-body">
            <div className="hour-bars">
              {hours.map((h, i) => (
                <div
                  key={i}
                  className={"b" + (h.isCurrent ? " cur" : "")}
                  style={{height: `${(h.count / maxHour) * 100}%`}}
                  title={`${h.hour}:00 — ${h.count} calls`}
                />
              ))}
            </div>
            <div className="hour-labels">
              {hours.map((h, i) => (
                <span key={i}>{i % 4 === 0 ? `${h.hour.toString().padStart(2,"0")}` : ""}</span>
              ))}
            </div>
            <div style={{display:"flex", justifyContent:"space-between", marginTop:14, fontSize:12, color:"var(--text-3)"}}>
              <span>Peak <b style={{color:"var(--text-1)"}}>{hours.reduce((m,h) => h.count > m.count ? h : m).hour}:00</b></span>
              <span>Last hour <b style={{color:"var(--text-1)", fontFamily:"var(--font-mono)"}}>{hours[hours.length - 1].count}</b></span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Outcomes mix · 14d</h3>
            <button type="button" className="btn ghost xs" onClick={onGoLogs}>View all <Icons.ChevronRight size={11}/></button>
          </div>
          <div className="card-body">
            <div className="disp-stack">
              {dispOrder.map(k => {
                const ct = dispCounts[k] || 0;
                const pct = (ct / total) * 100;
                return (
                  <div key={k} className="disp-row">
                    <div className="lab">{DISP_LABEL[k]}</div>
                    <div className="bar"><div className={`fl disp-${k}`} style={{width: `${pct}%`}}></div></div>
                    <div className="ct">{ct} · {pct.toFixed(0)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>Agent health</h3>
            <span className="chip disp-BOOKED">All systems go</span>
          </div>
          <div className="card-body" style={{display:"flex", flexDirection:"column", gap:14}}>
            <HealthRow label="Connect rate"        value={`${connRate.toFixed(1)}%`} target="≥ 38%" status="ok"/>
            <HealthRow label="Booking rate"        value={`${bookedRate.toFixed(0)}%`} target="≥ 12%" status="ok"/>
            <HealthRow label="Avg latency · TTFB"  value="412 ms"  target="< 600 ms" status="ok"/>
            <HealthRow label="Voicemail drops"     value="22%"     target="< 30%" status="ok"/>
            <HealthRow label="DNC requests · 7d"   value="9"       target="< 15"  status="ok"/>
            <HealthRow label="Cost / appointment"  value="$1.76"   target="< $2.50" status="ok"/>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid-2" style={{marginBottom: 18}}>
        <div className="card card-flush">
          <div className="card-head" style={{padding:"14px 18px"}}>
            <h3><Icons.Activity size={14}/> Recent activity</h3>
            <button type="button" className="btn ghost xs" onClick={onGoLogs}>
              Open call logs <Icons.ChevronRight size={11}/>
            </button>
          </div>
          <div className="activity">
            {recent.map(c => {
              const k = window.getDispositionKey(c);
              const Ico = DISP_ICON[k] || Icons.Phone;
              return (
                <div key={c.id} className="act-row" onClick={() => onOpenCall(c)}>
                  <div className={`act-icon disp-${k}`}><Ico size={16}/></div>
                  <div>
                    <div className="titln">{c.customer?.name}</div>
                    <div className="sub">{c.analysis?.summary?.slice(0, 110)}{c.analysis?.summary?.length > 110 ? "…" : ""}</div>
                  </div>
                  <div className="meta">
                    <span className="strong">{DISP_LABEL[k]}</span>
                    {window.fmtDuration(c.durationSeconds)} · {timeAgo(c.createdAt)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3><Icons.AlertTriangle size={14}/> Needs review</h3>
            <span className="meta">3 items</span>
          </div>
          <div className="card-body" style={{padding:0}}>
            <ReviewItem
              kind="DNC spike"
              title="DNC rate hit 5% in window 2–4pm"
              detail="9 callers requested removal during the early-afternoon block — 2.3× the daily average."
              cta="Investigate"
            />
            <ReviewItem
              kind="Long calls"
              title="3 calls exceeded 8:00"
              detail="Sunny v3-warm is staying on the line longer than the baseline cohort. Review pacing prompt."
              cta="Open calls"
            />
            <ReviewItem
              kind="Missed bookings"
              title="2 qualified leads not booked"
              detail="Customer answered booking question with conditional yes — agent did not push to confirm slot."
              cta="Review transcripts"
              last
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function HealthRow({ label, value, target, status }) {
  return (
    <div style={{display:"grid", gridTemplateColumns:"1fr auto auto", gap:14, alignItems:"center", fontSize:13}}>
      <div style={{color:"var(--text-2)"}}>{label}</div>
      <div style={{fontFamily:"var(--font-mono)", fontWeight:600, color:"var(--text-1)", fontVariantNumeric:"tabular-nums"}}>
        {value}
      </div>
      <div style={{display:"inline-flex", alignItems:"center", gap:6, fontSize:11, color:"var(--text-3)", fontFamily:"var(--font-mono)", whiteSpace:"nowrap"}}>
        <span style={{width:6, height:6, borderRadius:999, background: status === "ok" ? "var(--pos)" : "var(--warn)"}}></span>
        {target}
      </div>
    </div>
  );
}

function ReviewItem({ kind, title, detail, cta, last }) {
  return (
    <div style={{
      padding: "14px 18px",
      borderBottom: last ? 0 : "1px solid var(--line-soft)",
    }}>
      <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:6}}>
        <span style={{
          fontSize: 10, fontWeight: 700,
          letterSpacing: "0.08em", textTransform: "uppercase",
          color: "var(--warn)",
          background: "var(--warn-soft)",
          padding: "2px 7px", borderRadius: 4
        }}>{kind}</span>
      </div>
      <div style={{fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 2}}>{title}</div>
      <div style={{fontSize: 12, color: "var(--text-3)", lineHeight: 1.5}}>{detail}</div>
      <div style={{marginTop: 10}}>
        <button type="button" className="btn xs">
          {cta} <Icons.ChevronRight size={10}/>
        </button>
      </div>
    </div>
  );
}

function timeAgo(iso) {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

Object.assign(window, { OverviewScreen, timeAgo });
