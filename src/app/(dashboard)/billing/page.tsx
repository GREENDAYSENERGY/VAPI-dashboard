import Link from "next/link";
import { Wallet } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: "calc(100vh - 56px)" }}>
      <div
        className="text-center px-8 py-12 max-w-md"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: "var(--g-radius-md)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          className="flex items-center justify-center mx-auto mb-6 rounded-full"
          style={{ width: 72, height: 72, background: "var(--accent-soft)" }}
        >
          <Wallet size={36} style={{ color: "var(--accent)" }} />
        </div>
        <h1
          className="font-semibold mb-3"
          style={{ fontSize: 24, color: "var(--text-1)", fontFamily: "var(--font-sans)" }}
        >
          Billing
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-3)", lineHeight: 1.6, marginBottom: 28 }}>
          Billing management and invoices are coming soon. Contact your account manager for billing inquiries.
        </p>
        <Link
          href="/overview"
          className="inline-block px-5 py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-85"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          ← Back to Overview
        </Link>
      </div>
    </div>
  );
}
