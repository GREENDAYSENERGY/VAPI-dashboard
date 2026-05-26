import { getCampaigns } from "@/lib/vapi";
import { CampaignsTable } from "@/components/CampaignsTable";
import { Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const campaigns = await getCampaigns();

  const total = campaigns.length;
  const totalScheduled = campaigns.reduce((s, c) => s + (c.callsCounterScheduled ?? 0), 0);
  const totalEnded = campaigns.reduce((s, c) => s + (c.callsCounterEnded ?? 0), 0);
  const totalVM = campaigns.reduce((s, c) => s + (c.callsCounterEndedVoicemail ?? 0), 0);

  return (
    <div style={{ padding: "var(--card-p)" }} className="space-y-5">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <span style={{ color: "var(--accent)" }}><Megaphone size={22} /></span>
        <div className="flex-1">
          <h1 className="font-semibold" style={{ fontSize: 22, color: "var(--text-1)" }}>
            Campaigns
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-3)" }}>
            {total} campaigns · {totalScheduled.toLocaleString()} calls scheduled · {totalEnded.toLocaleString()} completed · {totalVM.toLocaleString()} voicemails
          </p>
        </div>
      </div>

      <CampaignsTable campaigns={campaigns} />
    </div>
  );
}
