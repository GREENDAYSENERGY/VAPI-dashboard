"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PricingTable } from "@/components/PricingTable";
import { calcCost, calcBlocks, formatDuration, RATE_PER_BLOCK, RATE_PER_MINUTE, BLOCK_SECONDS } from "@/lib/pricing";
import type { VapiCall } from "@/lib/vapi";
import { getCallDuration } from "@/lib/vapi";

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function PricingContent() {
  const [calls, setCalls] = useState<VapiCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [calcInput, setCalcInput] = useState("");

  useEffect(() => {
    fetch("/api/calls")
      .then((r) => r.json())
      .then((data) => {
        setCalls(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Calculator
  const inputSeconds = parseInt(calcInput, 10) || 0;
  const calcBlocks_ = calcBlocks(inputSeconds);
  const calcCost_ = calcCost(inputSeconds);

  // Summary stats
  const totalRevenue = calls.reduce(
    (acc, c) => acc + calcCost(getCallDuration(c)),
    0
  );
  const totalAiCost = calls.reduce((acc, c) => acc + (c.cost ?? 0), 0);
  const grossMargin = totalRevenue - totalAiCost;

  const connectedCalls = calls.filter((c) => {
    const r = (c.endedReason ?? "").toLowerCase();
    return !r.includes("voicemail") && !r.includes("no-answer") && !r.includes("machine") && !r.includes("busy");
  });
  const costPerConnected = connectedCalls.length
    ? totalAiCost / connectedCalls.length
    : 0;

  // Breakdown by disposition
  const dispositionMap: Record<
    string,
    { count: number; duration: number; revenue: number; cost: number }
  > = {};

  for (const c of calls) {
    const d = c.analysis?.structuredData?.disposition?.toUpperCase() ?? "OTHER";
    if (!dispositionMap[d]) {
      dispositionMap[d] = { count: 0, duration: 0, revenue: 0, cost: 0 };
    }
    const dur = getCallDuration(c);
    dispositionMap[d].count += 1;
    dispositionMap[d].duration += dur;
    dispositionMap[d].revenue += calcCost(dur);
    dispositionMap[d].cost += c.cost ?? 0;
  }

  const dispositionRows = Object.entries(dispositionMap).sort(
    (a, b) => b[1].count - a[1].count
  );

  const totalDuration = calls.reduce((a, c) => a + getCallDuration(c), 0);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center text-gray-400">
        Loading data…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🧠 Big Brain</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          ${RATE_PER_MINUTE.toFixed(2)} / min · billed in {BLOCK_SECONDS}s increments (${RATE_PER_BLOCK.toFixed(3)} per block)
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Total Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          sub={`at $${RATE_PER_MINUTE.toFixed(2)} / min`}
        />
        <SummaryCard
          label="AI Cost"
          value={`$${totalAiCost.toFixed(2)}`}
          sub="actual spend"
        />
        <SummaryCard
          label="Gross Margin"
          value={`$${grossMargin.toFixed(2)}`}
          sub={`${totalRevenue > 0 ? Math.round((grossMargin / totalRevenue) * 100) : 0}% margin`}
        />
        <SummaryCard
          label="Cost / Connected Call"
          value={`$${costPerConnected.toFixed(3)}`}
          sub={`${connectedCalls.length} connected`}
        />
      </div>

      {/* Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700">
            🧮 Pricing Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Duration (seconds)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 90"
                className="w-36 h-8 text-sm font-mono"
                value={calcInput}
                onChange={(e) => setCalcInput(e.target.value)}
              />
            </div>
            {inputSeconds > 0 && (
              <div className="flex items-center gap-6 mt-3">
                <div className="text-center">
                  <p className="text-xs text-gray-400">Duration</p>
                  <p className="font-mono font-semibold">{formatDuration(inputSeconds)}</p>
                </div>
                <div className="text-gray-300">→</div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Blocks</p>
                  <p className="font-mono font-semibold">
                    {calcBlocks_} × {BLOCK_SECONDS}s
                  </p>
                </div>
                <div className="text-gray-300">→</div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">Revenue</p>
                  <p className="font-mono font-bold text-green-700 text-lg">
                    ${calcCost_.toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
          {inputSeconds > 0 && (
            <p className="text-xs text-gray-400 mt-3">
              {inputSeconds}s ÷ {BLOCK_SECONDS}s = {(inputSeconds / BLOCK_SECONDS).toFixed(2)} →{" "}
              ceil = {calcBlocks_} blocks × ${RATE_PER_BLOCK.toFixed(3)} = ${calcCost_.toFixed(2)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Disposition Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700">
            Breakdown by Disposition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Disposition</th>
                  <th className="px-3 py-2 text-right">Calls</th>
                  <th className="px-3 py-2 text-right">Total Duration</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                  <th className="px-3 py-2 text-right">AI Cost</th>
                  <th className="px-3 py-2 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dispositionRows.map(([disp, stats]) => (
                  <tr key={disp} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{disp}</td>
                    <td className="px-3 py-2 text-right">{stats.count}</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {formatDuration(stats.duration)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-green-700">
                      ${stats.revenue.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-gray-500">
                      ${stats.cost.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-green-600">
                      +${(stats.revenue - stats.cost).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {/* Total row */}
                <tr className="bg-gray-50 font-semibold border-t-2 border-gray-200">
                  <td className="px-3 py-2">TOTAL</td>
                  <td className="px-3 py-2 text-right">{calls.length}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {formatDuration(totalDuration)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-green-700">
                    ${totalRevenue.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-gray-500">
                    ${totalAiCost.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-green-600">
                    +${grossMargin.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Per-call table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-gray-700">
            Per-Call Cost Breakdown (top by revenue)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PricingTable calls={calls} />
        </CardContent>
      </Card>
    </div>
  );
}
