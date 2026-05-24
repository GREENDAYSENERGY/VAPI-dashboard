import type { VapiCall } from "@/lib/vapi";
import { getDispositionKey } from "@/lib/vapi";

const DISP_LABEL: Record<string, string> = {
  BOOKED:    "Booked",
  CB:        "Callback",
  VM:        "Voicemail",
  DNC:       "Do-not-call",
  NQ:        "Not qualified",
  NO_ANSWER: "No answer",
  COMPLETED: "Completed",
  OTHER:     "Other",
};

interface Props {
  disposition: string;
  className?: string;
}

export function DispositionChip({ disposition, className = "" }: Props) {
  const key = disposition.toUpperCase().replace(/\s+/g, "_");
  const label = DISP_LABEL[key] ?? disposition;
  return (
    <span className={`disp-chip disp-${key} ${className}`}>
      {label}
    </span>
  );
}

export function CallDispositionChip({ call, className }: { call: VapiCall; className?: string }) {
  const key = getDispositionKey(call);
  return <DispositionChip disposition={key} className={className} />;
}
