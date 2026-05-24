"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { subDays, format } from "date-fns";

export type DateRange = {
  from: string | null;
  to: string | null;
};

interface Props {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const PRESETS = [
  { label: "Today", days: 0 },
  { label: "Last 7d", days: 7 },
  { label: "Last 30d", days: 30 },
  { label: "Last 90d", days: 90 },
  { label: "All time", days: -1 },
];

export function DateRangePicker({ value, onChange }: Props) {
  const [activePreset, setActivePreset] = useState("All time");

  function selectPreset(preset: (typeof PRESETS)[number]) {
    setActivePreset(preset.label);
    if (preset.days === -1) {
      onChange({ from: null, to: null });
      return;
    }
    const from = format(subDays(new Date(), preset.days), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    const to = format(new Date(), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    onChange({ from, to });
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-gray-500 mr-1">Range:</span>
      {PRESETS.map((p) => (
        <Button
          key={p.label}
          size="sm"
          variant={activePreset === p.label ? "default" : "outline"}
          className="h-7 text-xs px-3"
          style={
            activePreset === p.label
              ? { backgroundColor: "#166534", color: "#fff" }
              : {}
          }
          onClick={() => selectPreset(p)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
