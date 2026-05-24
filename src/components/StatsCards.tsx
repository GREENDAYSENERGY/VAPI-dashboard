import { Card, CardContent } from "@/components/ui/card";
import type { VapiCall } from "@/lib/vapi";
import { Phone, PhoneCall, Calendar, DollarSign } from "lucide-react";

interface Props {
  calls: VapiCall[];
}

const NO_CONNECT_REASONS = [
  "no-answer",
  "voicemail",
  "busy",
  "failed",
  "machine-detected-greeting",
  "machine-detected-beep",
  "machine-end-beep",
  "machine-end-silence",
];

function isConnected(call: VapiCall) {
  if (!call.endedReason) return false;
  return !NO_CONNECT_REASONS.some((r) => call.endedReason!.toLowerCase().includes(r));
}

function isBooked(call: VapiCall) {
  return call.analysis?.structuredData?.appointment_booked === true;
}

export function StatsCards({ calls }: Props) {
  const total = calls.length;
  const connected = calls.filter(isConnected).length;
  const booked = calls.filter(isBooked).length;
  const totalCost = calls.reduce((acc, c) => acc + (c.cost ?? 0), 0);

  const stats = [
    {
      label: "Total Calls",
      value: total.toLocaleString(),
      icon: <Phone className="w-5 h-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Connected Calls",
      value: connected.toLocaleString(),
      icon: <PhoneCall className="w-5 h-5" />,
      color: "text-green-700",
      bg: "bg-green-50",
      sub: total ? `${Math.round((connected / total) * 100)}% connect rate` : undefined,
    },
    {
      label: "Appointments Booked",
      value: booked.toLocaleString(),
      icon: <Calendar className="w-5 h-5" />,
      color: "text-purple-600",
      bg: "bg-purple-50",
      sub: connected ? `${Math.round((booked / connected) * 100)}% of connected` : undefined,
    },
    {
      label: "Total VAPI Cost",
      value: `$${totalCost.toFixed(2)}`,
      icon: <DollarSign className="w-5 h-5" />,
      color: "text-orange-600",
      bg: "bg-orange-50",
      sub: total ? `avg $${(totalCost / total).toFixed(3)}/call` : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {s.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
                {s.sub && (
                  <p className="mt-0.5 text-xs text-gray-400">{s.sub}</p>
                )}
              </div>
              <div className={`${s.bg} ${s.color} p-2 rounded-lg`}>{s.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
