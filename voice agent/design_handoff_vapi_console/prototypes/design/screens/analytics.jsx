/* Analytics & Costs screen */

function AnalyticsScreen() {
  const calls = window.VAPI_DATA.CALLS;

  // ---- Aggregates ----
  const total = calls.length;
  const connected = calls.filter(window.isConnected).length;
  const booked = calls.filter(c => c.analysis?.structuredData?.appointment_booked).length;
  const totalCost = calls.reduce((s, c) => s + (c.cost || 0), 0);
  const totalDur = calls.reduce((s, c) => s + (c.durationSeconds || 0), 0);

  // Calc client revenue (15s blocks at $0.50)
  const blockSec = 15, ratePerBlock = 0.5;
  const calcRev = calls.reduce((s, c) => s + Math.ceil((c.durationSeconds || 0) / blockSec) * ratePerBlock, 0);
  const margin = calcRev - totalCost;
  const marginPct = calcRev > 0 ? (margin / calcRev) * 100 : 0;

  // Day series (last 14d)
  const now = new Date("2026-05-25T16:42:00Z");
  const dayData = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(now.getTime() - (13 - i) * 86400_000);
    const dayCalls = calls.filter(c => new Date(c.createdAt).toDateString() === day.toDateString());
    const ct = dayCalls.length;
    const bk = dayCalls.filter(c => c.analysis?.structuredData?.appointment_booked).length;
    const co = dayCalls.reduce((s, c) => s + (c.cost || 0), 0);
    return {
      label: day.toLocaleString("en-US", { month: "short", day: "numeric" }),
      v: ct,
      booked: bk,
      cost: co,
    };
  });

  // Disposition donut
  const dispCounts = {};
  for (const c of calls) {
    const k = window.getDispositionKey(c);
    dispCounts[k] = (dispCounts[k] || 0) + 1;
  }
  const DISP_COLORS = {
    BOOKED:    "var(--pos)",
    CB:        "var(--accent)",
    VM:        "var(--warn)",
    NQ:        "#94a3b8",
    DNC:       "var(--neg)",
    NO_ANSWER: "var(--line-strong)",
  };
  const donutSegs = ["BOOKED", "CB", "VM", "NQ", "DNC", "NO_ANSWER"].map(k => ({
    key: k,
    label: DISP_LABEL[k],
    value: dispCounts[k] || 0,
    color: DISP_COLORS[k],
  })).filter(s => s.value > 0);

  // Cost breakdown by component (aggregate)
  const cb = calls.reduce((acc, c) => {
    const x = c.costBreakdown || {};
    acc.stt += x.stt || 0;
    acc.llm += x.llm || 0;
    acc.tts += x.tts || 0;
    acc.transport += x.transport || 0;
    return acc;
  }, { stt: 0, llm: 0, tts: 0, transport: 0 });
  const cbTotal = cb.stt + cb.llm + cb.tts + cb.transport;
  const cbSegs = [
    { k:"stt", label:"Speech-to-text",  value: cb.stt,       color: "var(--blue-300)" },
    { k:"llm", label:"LLM",             value: cb.llm,       color: "var(--blue-500)" },
    { k:"tts", label:"Text-to-speech",  value: cb.tts,       color: "var(--blue-700)" },
    { k:"txp", label:"Telephony",       value: cb.transport, color: "var(--blue-200)" },
  ];

  // Disposition table
  const dispTable = ["BOOKED", "CB", "VM", "NQ", "DNC", "NO_ANSWER"].map(k => {
    const sub = calls.filter(c => window.getDispositionKey(c) === k);
    const ct = sub.length;
    const dur = sub.reduce((s, c) => s + (c.durationSeconds || 0), 0);
    const cost = sub.reduce((s, c) => s + (c.cost || 0), 0);
    const rev = sub.reduce((s, c) => s + Math.ceil((c.durationSeconds || 0) / blockSec) * ratePerBlock, 0);
    return { k, ct, dur, cost, rev };
  });

  // Calculator
  const [calcInput, setCalcInput] = React.useState(72);
  const calcBlocks = Math.ceil(Math.max(0, calcInput) / blockSec);
  const calcCost = calcBlocks * ratePerBlock;

  // Heatmap: 7 days × 24h
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const hm = days.map(() => Array.from({ length: 24 }, () => 0));
  for (const c of calls) {
    const t = new Date(c.createdAt);
    const dow = (t.getDay() + 6) % 7;  // mon=0
    const h = t.getHours();
    hm[dow][h] += 1;
  }
  const hmMax = Math.max(...hm.flat(), 1);

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Operations · Analytics</div>
          <h1>Analytics &amp; Costs</h1>
          <div className="sub">Performance, conversion, and unit economics for your AI voice agent.</div>
        </div>
        <div className="actions">
          <button type="button" className="btn">
            <Icons.Calendar size={13}/> Last 14 days <Icons.ChevronDown size={11}/>
          </button>
          <button type="button" className="btn">
            <Icons.Download size={13}/> Export
          </button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="kpi-row cols-5" style={{marginBottom: 18}}>
        <KPI featured label="Booked appointments" value={booked} delta={18} sub="vs prior 14d" Icon={Icons.Calendar2}/>
        <KPI label="Connect rate" value={`${((connected/total)*100).toFixed(1)}%`} delta={2.4} sub={`${connected} of ${total}`} Icon={Icons.Activity}/>
        <KPI label="Cost / booking" value={`$${(totalCost / Math.max(1, booked)).toFixed(2)}`} delta={-9} deltaInverse sub="efficient" Icon={Icons.DollarSign}/>
        <KPI label="Total VAPI cost" value={`$${totalCost.toFixed(2)}`} delta={11} deltaInverse sub={`avg $${(totalCost/total).toFixed(3)}/call`} Icon={Icons.Wallet}/>
        <KPI label="Gross margin" value={`${marginPct.toFixed(0)}%`} delta={3} sub={`+$${margin.toFixed(0)} vs cost`} Icon={Icons.TrendingUp}/>
      </div>

      {/* Trend chart */}
      <div className="card an-chart-card" style={{marginBottom: 18}}>
        <div className="card-head">
          <h3><Icons.TrendingUp size={14}/> Daily volume · last 14 days</h3>
          <div className="pills">
            <button type="button" className="pill active">Calls</button>
            <button type="button" className="pill">Bookings</button>
            <button type="button" className="pill">Cost</button>
          </div>
        </div>
        <div className="card-body">
          <LineChart data={dayData} height={220}/>
        </div>
      </div>

      {/* Mix + cost breakdown row */}
      <div className="grid-2-eq" style={{marginBottom: 18}}>
        <div className="card">
          <div className="card-head">
            <h3>Outcome mix</h3>
            <span className="meta">{total} calls</span>
          </div>
          <div className="card-body" style={{display:"grid", gridTemplateColumns:"auto 1fr", gap:24, alignItems:"center"}}>
            <div style={{position:"relative", display:"grid", placeItems:"center"}}>
              <Donut segments={donutSegs} size={180} thickness={22}/>
              <div style={{position:"absolute", textAlign:"center"}}>
                <div style={{fontSize:11, color:"var(--text-3)", fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase"}}>Booked</div>
                <div style={{fontFamily:"var(--font-display)", fontSize:24, fontWeight:600, color:"var(--text-1)"}}>{booked}</div>
                <div style={{fontSize:11, color:"var(--text-3)"}}>{((booked/total)*100).toFixed(1)}%</div>
              </div>
            </div>
            <div style={{display:"flex", flexDirection:"column", gap:10}}>
              {donutSegs.map(s => (
                <div key={s.key} style={{display:"grid", gridTemplateColumns:"12px 1fr auto auto", gap:10, alignItems:"center", fontSize:12}}>
                  <span style={{width:10, height:10, borderRadius:3, background:s.color}}></span>
                  <span style={{color:"var(--text-1)"}}>{s.label}</span>
                  <span style={{fontFamily:"var(--font-mono)", color:"var(--text-2)", fontVariantNumeric:"tabular-nums"}}>{s.value}</span>
                  <span style={{fontSize:11, color:"var(--text-3)", fontFamily:"var(--font-mono)", width:42, textAlign:"right"}}>{((s.value/total)*100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3>VAPI cost composition</h3>
            <span className="meta">{window.fmtMoney(cbTotal)}</span>
          </div>
          <div className="card-body">
            <div className="cb-stack" style={{height:24, marginTop:0}}>
              {cbSegs.map(s => cbTotal > 0 && (
                <div key={s.k} className="cb-seg" style={{width: `${(s.value/cbTotal)*100}%`, background: s.color}}></div>
              ))}
            </div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px 24px", marginTop:14}}>
              {cbSegs.map(s => (
                <div key={s.k} style={{display:"grid", gridTemplateColumns:"12px 1fr auto", alignItems:"center", gap:10, fontSize:12}}>
                  <span style={{width:10, height:10, borderRadius:3, background:s.color}}></span>
                  <span style={{color:"var(--text-1)"}}>{s.label}</span>
                  <span style={{fontFamily:"var(--font-mono)", fontWeight:600, color:"var(--text-1)", fontVariantNumeric:"tabular-nums"}}>{window.fmtMoney(s.value)}</span>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: "1px solid var(--line-soft)",
              display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16
            }}>
              <Mini label="VAPI cost"     value={window.fmtMoney(totalCost)}/>
              <Mini label="Calc revenue" value={window.fmtMoney(calcRev)} hint={`$${ratePerBlock} / ${blockSec}s`}/>
              <Mini label="Margin" value={`+${window.fmtMoney(margin)}`} valueColor="var(--pos)" hint={`${marginPct.toFixed(0)}%`}/>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing calculator */}
      <div className="card" style={{marginBottom: 18}}>
        <div className="card-head">
          <h3><Icons.DollarSign size={14}/> Pricing calculator</h3>
          <span className="meta">${ratePerBlock} per {blockSec}-second block · rounded up</span>
        </div>
        <div className="card-body">
          <div className="calc-row">
            <div className="calc-step">
              <span className="l">Call duration</span>
              <div className="calc-input">
                <input
                  type="number"
                  min="0"
                  value={calcInput}
                  onChange={(e) => setCalcInput(Math.max(0, parseInt(e.target.value || "0", 10)))}
                />
                <span className="u">sec</span>
              </div>
            </div>
            <Icons.ChevronRight size={16} className="calc-arrow"/>
            <div className="calc-step">
              <span className="l">Blocks</span>
              <span className="v">{calcBlocks} × {blockSec}s</span>
            </div>
            <Icons.ChevronRight size={16} className="calc-arrow"/>
            <div className="calc-step">
              <span className="l">Duration billed</span>
              <span className="v">{window.fmtDuration(calcBlocks * blockSec)}</span>
            </div>
            <div className="calc-out">
              <span className="l">Revenue</span>
              <span className="v">${calcCost.toFixed(2)}</span>
            </div>
          </div>
          <p style={{margin:"12px 0 0", fontSize:11, color:"var(--text-3)", fontFamily:"var(--font-mono)"}}>
            {calcInput}s ÷ {blockSec}s = {(calcInput/blockSec).toFixed(2)} → ceil = {calcBlocks} blocks × ${ratePerBlock.toFixed(2)} = ${calcCost.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Disposition breakdown */}
      <div className="card" style={{marginBottom: 18}}>
        <div className="card-head">
          <h3>Breakdown by disposition</h3>
          <span className="meta">${ratePerBlock} per {blockSec}s</span>
        </div>
        <table className="dz-table">
          <thead>
            <tr>
              <th>Disposition</th>
              <th>Calls</th>
              <th>Duration</th>
              <th>VAPI cost</th>
              <th>Revenue</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            {dispTable.map(r => (
              <tr key={r.k}>
                <td><DispositionChip k={r.k}/></td>
                <td>{r.ct}</td>
                <td>{window.fmtDuration(r.dur)}</td>
                <td>${r.cost.toFixed(2)}</td>
                <td className="pos">${r.rev.toFixed(2)}</td>
                <td className="pos">+${(r.rev - r.cost).toFixed(2)}</td>
              </tr>
            ))}
            <tr className="total">
              <td>Total</td>
              <td>{total}</td>
              <td>{window.fmtDuration(totalDur)}</td>
              <td>${totalCost.toFixed(2)}</td>
              <td className="pos">${calcRev.toFixed(2)}</td>
              <td className="pos">+${margin.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Heatmap */}
      <div className="card">
        <div className="card-head">
          <h3><Icons.Clock size={14}/> When your calls land</h3>
          <span className="meta">Calls by hour & day</span>
        </div>
        <div className="card-body">
          <div className="heatmap">
            <span></span>
            {Array.from({ length: 24 }).map((_, h) => (
              <span key={h} style={{textAlign:"center"}}>{h % 4 === 0 ? h : ""}</span>
            ))}
            {days.map((d, i) => (
              <React.Fragment key={d}>
                <span className="day">{d}</span>
                {hm[i].map((v, h) => {
                  const a = v / hmMax;
                  return (
                    <div key={h} className="cell" style={{
                      background: a === 0
                        ? "var(--surface-3)"
                        : `color-mix(in oklch, var(--accent) ${Math.max(10, a * 100)}%, var(--surface-3))`,
                    }} title={`${d} ${h}:00 — ${v} calls`}/>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <div style={{display:"flex", justifyContent:"flex-end", alignItems:"center", gap:8, marginTop:14, fontSize:11, color:"var(--text-3)"}}>
            <span>Fewer</span>
            <div style={{display:"flex", gap:2}}>
              {[0.1, 0.3, 0.5, 0.75, 1].map(a => (
                <div key={a} style={{
                  width:14, height:14, borderRadius:2,
                  background: `color-mix(in oklch, var(--accent) ${a*100}%, var(--surface-3))`
                }}/>
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, hint, valueColor }) {
  return (
    <div>
      <div style={{fontSize:10, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-3)"}}>{label}</div>
      <div style={{fontFamily:"var(--font-display)", fontSize:20, fontWeight:600, color: valueColor || "var(--text-1)", letterSpacing:"-0.01em", marginTop:2, fontVariantNumeric:"tabular-nums"}}>{value}</div>
      {hint && <div style={{fontSize:11, color:"var(--text-3)", marginTop:1}}>{hint}</div>}
    </div>
  );
}

Object.assign(window, { AnalyticsScreen });
