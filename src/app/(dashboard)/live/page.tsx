import Link from "next/link";
import { Radio } from "lucide-react";

export default function LivePage() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 56px)" }}>
      <div
        className="text-center px-8 py-12 max-w-md"
        style={{
          background: "linear-gradient(135deg, #0a4a73 0%, #0563a8 100%)",
          borderRadius: "10px",
          boxShadow: "0 12px 32px rgba(10,74,115,0.22), 0 4px 8px rgba(10,74,115,0.10)",
        }}
      >
        <div
          className="flex items-center justify-center mx-auto mb-6 rounded-full"
          style={{ width: 72, height: 72, background: "rgba(255,255,255,0.12)" }}
        >
          <Radio size={36} color="#fff" />
        </div>
        <h1
          className="font-semibold mb-3"
          style={{ fontSize: 24, color: "#fff", fontFamily: "var(--font-sans)" }}
        >
          Live Calls
        </h1>
        <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 28 }}>
          Real-time call monitoring is coming soon. You&apos;ll be able to watch active calls, listen live, and manage your queue from this screen.
        </p>
        <Link
          href="/overview"
          className="inline-block px-5 py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-85"
          style={{ background: "#fff", color: "var(--accent-deep)" }}
        >
          ← Back to Overview
        </Link>
      </div>
    </div>
  );
}
