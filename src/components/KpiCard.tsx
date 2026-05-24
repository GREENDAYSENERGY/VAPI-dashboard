import { ArrowUp, ArrowDown } from "lucide-react";
import { Sparkline } from "./Sparkline";

interface Props {
  label: string;
  value: string;
  unit?: string;
  sub?: string;
  delta?: number;        // e.g. 12 = +12%, -6 = -6%
  deltaInverse?: boolean; // true = negative delta is good (e.g. latency)
  featured?: boolean;
  icon?: React.ReactNode;
  sparkData?: number[];
}

export function KpiCard({ label, value, unit, sub, delta, deltaInverse, featured, icon, sparkData }: Props) {
  const isGood = delta === undefined ? null : deltaInverse ? delta < 0 : delta > 0;
  const deltaColor = isGood === null ? "var(--text-3)" : isGood ? "var(--pos)" : "var(--neg)";

  return (
    <div
      className="relative p-5 overflow-hidden"
      style={{
        background: featured
          ? "linear-gradient(180deg, var(--accent-soft) 0%, var(--surface) 60%)"
          : "var(--surface)",
        border: `1px solid ${featured ? "var(--accent-soft-2)" : "var(--line)"}`,
        borderRadius: "var(--g-radius-md)",
        boxShadow: "var(--shadow-xs)",
      }}
    >
      {/* Sparkline — absolute top-right */}
      {sparkData && sparkData.length > 1 && (
        <div className="absolute" style={{ top: 18, right: 12, opacity: 0.55 }}>
          <Sparkline data={sparkData} width={70} height={28} />
        </div>
      )}

      {/* Label row */}
      <div className="flex items-center gap-1.5 mb-2">
        {icon && <span style={{ color: "var(--text-3)" }}>{icon}</span>}
        <p
          style={{
            fontSize: "var(--kpi-label)",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-3)",
          }}
        >
          {label}
        </p>
      </div>

      {/* Value */}
      <p
        className="font-semibold tabular-nums"
        style={{ fontSize: "var(--kpi-num)", letterSpacing: "-0.02em", color: "var(--text-1)", lineHeight: 1.1 }}
      >
        {value}
        {unit && (
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text-3)", marginLeft: 4 }}>{unit}</span>
        )}
      </p>

      {/* Sub row */}
      {(sub || delta !== undefined) && (
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {delta !== undefined && (
            <span
              className="inline-flex items-center gap-0.5 text-[11px] font-semibold"
              style={{ color: deltaColor }}
            >
              {delta > 0
                ? <ArrowUp size={11} />
                : <ArrowDown size={11} />
              }
              {Math.abs(delta)}%
            </span>
          )}
          {sub && (
            <span className="text-[12px] whitespace-nowrap" style={{ color: "var(--text-3)" }}>{sub}</span>
          )}
        </div>
      )}
    </div>
  );
}
