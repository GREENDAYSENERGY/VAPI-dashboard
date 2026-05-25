/* Call Logs screen — filterable, sortable table */

function CallLogsScreen({ onOpenCall }) {
  const [search, setSearch] = React.useState("");
  const [dispFilter, setDispFilter] = React.useState("ALL");
  const [bookedOnly, setBookedOnly] = React.useState(false);
  const [sortBy, setSortBy] = React.useState({ k: "createdAt", desc: true });

  const allCalls = window.VAPI_DATA.CALLS;

  // Counts
  const counts = React.useMemo(() => {
    const out = { ALL: allCalls.length };
    for (const c of allCalls) {
      const k = window.getDispositionKey(c);
      out[k] = (out[k] || 0) + 1;
    }
    return out;
  }, [allCalls]);

  // Filter + sort
  const calls = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = allCalls.filter(c => {
      if (dispFilter !== "ALL" && window.getDispositionKey(c) !== dispFilter) return false;
      if (bookedOnly && !c.analysis?.structuredData?.appointment_booked) return false;
      if (q) {
        const hay = `${c.customer?.name} ${c.customer?.number} ${c.analysis?.summary || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const { k, desc } = sortBy;
    const get = {
      createdAt:        c => c.createdAt,
      customer:         c => c.customer?.name || "",
      durationSeconds:  c => c.durationSeconds || 0,
      cost:             c => c.cost || 0,
    }[k] || (c => c.createdAt);
    rows = rows.slice().sort((a, b) => {
      const va = get(a), vb = get(b);
      if (va < vb) return desc ? 1 : -1;
      if (va > vb) return desc ? -1 : 1;
      return 0;
    });
    return rows;
  }, [allCalls, search, dispFilter, bookedOnly, sortBy]);

  const toggleSort = (k) => {
    setSortBy(s => s.k === k ? { k, desc: !s.desc } : { k, desc: true });
  };

  const SortHead = ({ col, children, right }) => (
    <th onClick={() => toggleSort(col)} style={{cursor: "pointer", textAlign: right ? "right" : undefined}}>
      <span style={{display:"inline-flex", alignItems:"center", gap:4}}>
        {children}
        {sortBy.k === col
          ? (sortBy.desc ? <Icons.ArrowDown size={11}/> : <Icons.ArrowUp size={11}/>)
          : <span style={{opacity:0.3}}><Icons.ArrowDown size={11}/></span>
        }
      </span>
    </th>
  );

  const filterPills = ["ALL", "BOOKED", "CB", "VM", "NQ", "DNC", "NO_ANSWER"];

  return (
    <div>
      <div className="page-head">
        <div>
          <div className="eyebrow">Operations · Logs</div>
          <h1>Call Logs</h1>
          <div className="sub">Every outbound call placed by Sunny. Click a row to open transcript & recording.</div>
        </div>
        <div className="actions">
          <button type="button" className="btn">
            <Icons.Calendar size={13}/> Last 14 days <Icons.ChevronDown size={11}/>
          </button>
          <button type="button" className="btn">
            <Icons.Download size={13}/> Export CSV
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filterbar">
        <div className="input" style={{flex:1, maxWidth: 360}}>
          <Icons.Search size={14}/>
          <input
            placeholder="Search name, number, or summary…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="pills">
          {filterPills.map(k => (
            <button key={k} type="button"
              className={"pill" + (dispFilter === k ? " active" : "")}
              onClick={() => setDispFilter(k)}>
              {k === "ALL" ? "All" : DISP_LABEL[k]}
              <span className="ct">{counts[k] || 0}</span>
            </button>
          ))}
        </div>

        <button type="button"
          className={"pill" + (bookedOnly ? " active" : "")}
          onClick={() => setBookedOnly(b => !b)}
          style={{
            background: bookedOnly ? "var(--pos-soft)" : "var(--surface)",
            color: bookedOnly ? "var(--pos)" : "var(--text-2)",
            border: "1px solid " + (bookedOnly ? "transparent" : "var(--line)"),
            padding: "6px 12px", borderRadius: "var(--radius-md)",
            fontSize: 12, fontWeight: 600
          }}>
          <Icons.CheckCircle size={12}/> Booked only
        </button>

        <button type="button" className="btn ghost" style={{marginLeft:"auto"}}>
          <Icons.Filter size={13}/> More filters
        </button>
      </div>

      {/* Table */}
      <div className="card card-flush">
        <table className="table">
          <thead>
            <tr>
              <SortHead col="customer">Customer</SortHead>
              <th>Disposition</th>
              <SortHead col="createdAt">Date</SortHead>
              <SortHead col="durationSeconds">Duration</SortHead>
              <th>Outcome</th>
              <th>Assistant</th>
              <SortHead col="cost" right>Cost</SortHead>
              <th style={{width:40}}></th>
            </tr>
          </thead>
          <tbody>
            {calls.length === 0 ? (
              <tr><td colSpan="8">
                <div className="empty">No calls match your filters.</div>
              </td></tr>
            ) : calls.slice(0, 30).map(c => (
              <CallRow key={c.id} call={c} onOpen={() => onOpenCall(c)}/>
            ))}
          </tbody>
        </table>

        <div style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          fontSize: 12, color: "var(--text-3)"
        }}>
          <span>Showing <b style={{color:"var(--text-1)"}}>{Math.min(30, calls.length)}</b> of <b style={{color:"var(--text-1)"}}>{calls.length}</b> calls</span>
          <div style={{display:"flex", gap:8, alignItems:"center"}}>
            <button type="button" className="btn ghost xs" disabled style={{opacity:0.4}}>
              <Icons.ChevronLeft size={11}/> Previous
            </button>
            <span style={{fontFamily:"var(--font-mono)"}}>1 / {Math.max(1, Math.ceil(calls.length / 30))}</span>
            <button type="button" className="btn ghost xs">
              Next <Icons.ChevronRight size={11}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CallRow({ call, onOpen }) {
  const disp = window.getDispositionKey(call);
  const initials = (call.customer?.name || "?").split(" ").map(s => s[0]).slice(0, 2).join("");
  const created = new Date(call.createdAt);
  return (
    <tr onClick={onOpen}>
      <td>
        <div className="cust">
          <div className="av">{initials}</div>
          <div>
            <div className="nm">{call.customer?.name}</div>
            <div className="ph">{call.customer?.number}</div>
          </div>
        </div>
      </td>
      <td><DispositionChip k={disp}/></td>
      <td>
        <div style={{fontSize:12.5, color:"var(--text-1)"}}>
          {created.toLocaleString("en-US", { month: "short", day: "numeric" })}
        </div>
        <div style={{fontSize:11, color:"var(--text-3)", fontFamily:"var(--font-mono)"}}>
          {created.toLocaleString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
        </div>
      </td>
      <td className="num">{window.fmtDuration(call.durationSeconds)}</td>
      <td>
        {call.analysis?.structuredData?.appointment_booked ? (
          <span style={{display:"inline-flex", alignItems:"center", gap:6, fontSize:12, color:"var(--pos)", fontWeight:600}}>
            <Icons.Calendar2 size={12}/> Booked
          </span>
        ) : disp === "CB" ? (
          <span style={{display:"inline-flex", alignItems:"center", gap:6, fontSize:12, color:"var(--info)"}}>
            <Icons.RefreshCw size={12}/> Retry scheduled
          </span>
        ) : (
          <span style={{fontSize:12, color:"var(--text-4)"}}>—</span>
        )}
      </td>
      <td>
        <span className="assistant-tag">
          <span className="av">{call.assistantId === "sunny-v3" ? "S3" : "Sw"}</span>
          {call.assistantId}
        </span>
      </td>
      <td className="num" style={{textAlign:"right"}}>{window.fmtMoney(call.cost, 3)}</td>
      <td>
        <button type="button" className="icon-btn" onClick={(e) => { e.stopPropagation(); onOpen(); }}>
          <Icons.ChevronRight size={14}/>
        </button>
      </td>
    </tr>
  );
}

Object.assign(window, { CallLogsScreen });
