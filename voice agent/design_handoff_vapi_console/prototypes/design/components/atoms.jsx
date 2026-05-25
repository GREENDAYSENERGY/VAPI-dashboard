/* Shared atoms: chip, KPI, charts, drawer */

const DISP_LABEL = {
  BOOKED:    "Booked",
  CB:        "Callback",
  VM:        "Voicemail",
  DNC:       "Do-not-call",
  NQ:        "Not qualified",
  NO_ANSWER: "No answer",
  OTHER:     "Other",
};

const DISP_ICON = {
  BOOKED:    Icons.CheckCircle,
  CB:        Icons.Phone,
  VM:        Icons.Voicemail,
  DNC:       Icons.XCircle,
  NQ:        Icons.Tag,
  NO_ANSWER: Icons.MicOff,
};

function DispositionChip({ k }) {
  const lbl = DISP_LABEL[k] || k;
  return <span className={`chip disp-${k}`}>{lbl}</span>;
}

function Delta({ value, suffix = "%", arrow = true, inverse = false }) {
  const cls = value > 0 ? (inverse ? "neg" : "pos") : value < 0 ? (inverse ? "pos" : "neg") : "neu";
  const Ico = value > 0 ? Icons.ArrowUp : value < 0 ? Icons.ArrowDown : null;
  return (
    <span className={`delta ${cls}`}>
      {arrow && Ico && <Ico size={11}/>}
      {value > 0 ? "+" : ""}{value}{suffix}
    </span>
  );
}

function Sparkline({ data, color = "var(--accent)", height = 36, width = 90 }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = Math.max(1, max - min);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - 2 - ((v - min) / span) * (height - 6);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `M 0,${height} L ${pts.join(" L ")} L ${width},${height} Z`;
  const line = `M ${pts.join(" L ")}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"  stopColor={color} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)"/>
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function KPI({ label, value, unit, sub, delta, deltaInverse, featured, spark, Icon: I }) {
  return (
    <div className={"kpi" + (featured ? " featured" : "")}>
      <div className="label">
        {I && <span className="ico"><I size={12}/></span>}
        {label}
      </div>
      <div className="val">
        {value}{unit && <span className="unit">{unit}</span>}
      </div>
      {(sub || delta != null) && (
        <div className="sub">
          {delta != null && <Delta value={delta} inverse={deltaInverse}/>}
          {sub && <span>{sub}</span>}
        </div>
      )}
      {spark && (
        <div className="kpi-spark">
          <Sparkline data={spark}/>
        </div>
      )}
    </div>
  );
}

/* ---- Line chart for time series ---- */
function LineChart({ data, height = 220, color = "var(--accent)", yFormatter = (v) => v, yMax }) {
  const ref = React.useRef(null);
  const [w, setW] = React.useState(600);
  const [hover, setHover] = React.useState(null);

  React.useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(es => setW(es[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  if (!data?.length) return <div ref={ref} style={{height}}/>;
  const padL = 36, padR = 12, padT = 14, padB = 26;
  const innerW = w - padL - padR;
  const innerH = height - padT - padB;
  const max = yMax ?? Math.max(...data.map(d => d.v));
  const span = Math.max(1, max);
  const stepX = innerW / Math.max(1, data.length - 1);

  const pts = data.map((d, i) => ({
    x: padL + i * stepX,
    y: padT + innerH - (d.v / span) * innerH,
    ...d,
  }));

  const line = "M " + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" L ");
  const area = `${line} L ${pts[pts.length - 1].x},${padT + innerH} L ${pts[0].x},${padT + innerH} Z`;

  const gridLines = 4;
  const ticks = Array.from({ length: gridLines + 1 }, (_, i) => {
    const v = (max / gridLines) * (gridLines - i);
    return { y: padT + (innerH / gridLines) * i, v };
  });

  return (
    <div className="line-chart" ref={ref} style={{height}}
      onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          let bestI = 0, bestD = Infinity;
          pts.forEach((p, i) => { const d = Math.abs(p.x * (w / rect.width) - x * (w / rect.width)); if (d < bestD) { bestD = d; bestI = i; }});
          setHover(bestI);
        }}>
        <defs>
          <linearGradient id="lc-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={color} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {/* Grid */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={padL} x2={w - padR} y1={t.y} y2={t.y} stroke="var(--line-soft)" strokeDasharray="3 3"/>
            <text x={padL - 6} y={t.y + 3} textAnchor="end" fontSize="10" fill="var(--text-3)" fontFamily="var(--font-mono)">
              {yFormatter(Math.round(t.v))}
            </text>
          </g>
        ))}
        {/* X labels */}
        {pts.map((p, i) => (
          (i % Math.max(1, Math.ceil(pts.length / 7)) === 0 || i === pts.length - 1) && (
            <text key={i} x={p.x} y={height - 8} textAnchor="middle" fontSize="10" fill="var(--text-3)" fontFamily="var(--font-mono)">
              {p.label}
            </text>
          )
        ))}
        {/* Area + line */}
        <path d={area} fill="url(#lc-g)"/>
        <path d={line} fill="none" stroke={color} strokeWidth="2"/>
        {/* Points */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={hover === i ? 4 : 2.5} fill={color}
            stroke="var(--surface)" strokeWidth="2"/>
        ))}
      </svg>
      {hover != null && pts[hover] && (
        <div className="lg-tip" style={{
          left: `${(pts[hover].x / w) * 100}%`,
          top: `${(pts[hover].y / height) * 100}%`,
          marginTop: -10,
        }}>
          <div style={{fontFamily:"var(--font-mono)", fontSize:10, color:"var(--text-3)"}}>{pts[hover].label}</div>
          <div style={{fontWeight:600}}>{yFormatter(pts[hover].v)}</div>
        </div>
      )}
    </div>
  );
}

/* ---- Donut chart ---- */
function Donut({ segments, size = 180, thickness = 22 }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line-soft)" strokeWidth={thickness}/>
      {segments.map((s, i) => {
        const frac = total > 0 ? s.value / total : 0;
        const len = c * frac;
        const offset = -c * acc / 1;
        acc += frac;
        return (
          <circle
            key={i} cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${len * 1} ${c - len}`}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{transition: "stroke-dasharray 0.4s ease"}}
          />
        );
      })}
    </svg>
  );
}

Object.assign(window, { DispositionChip, Delta, Sparkline, KPI, LineChart, Donut, DISP_LABEL, DISP_ICON });
