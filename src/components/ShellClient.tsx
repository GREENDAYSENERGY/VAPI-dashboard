"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Radio, List, Activity, Wallet,
  Bot, Phone, Users, Settings, HelpCircle,
  LogOut, Bell, ChevronDown, Search, Megaphone,
} from "lucide-react";

interface Props {
  email: string;
  isGadiUser: boolean;
  children: React.ReactNode;
}

export function ShellClient({ email, isGadiUser, children }: Props) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--app-bg)" }}>
      <Sidebar isGadiUser={isGadiUser} email={email} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar email={email} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ── Sidebar ─────────────────────────────────────────────── */

function Sidebar({ isGadiUser, email }: { isGadiUser: boolean; email: string }) {
  const pathname = usePathname();

  const ops: NavItem[] = [
    { href: "/overview",   label: "Overview",    Icon: LayoutDashboard },
    { href: "/live",       label: "Live Calls",  Icon: Radio, live: true },
    { href: "/calls",      label: "Call Logs",   Icon: List },
    { href: "/campaigns",  label: "Campaigns",   Icon: Megaphone },
    ...(isGadiUser ? [{ href: "/analytics", label: "Analytics", Icon: Activity }] : []),
    { href: "/billing",    label: "Billing",     Icon: Wallet },
  ];
  const configItems: NavItem[] = [
    { href: "#", label: "Assistant",     Icon: Bot },
    { href: "#", label: "Phone Numbers", Icon: Phone },
    { href: "#", label: "Team",          Icon: Users },
  ];

  return (
    <aside
      className="flex flex-col shrink-0 overflow-y-auto overflow-x-hidden"
      style={{ width: "var(--sidebar-w)", background: "var(--surface)", borderRight: "1px solid var(--line)" }}
    >
      {/* Brand row */}
      <div
        className="flex items-center gap-2.5 shrink-0 px-[18px]"
        style={{ height: "var(--topbar-h)", borderBottom: "1px solid var(--line)" }}
      >
        <Image src="/icon-dots-blue.svg" alt="Gadi.ai" width={24} height={24} />
        <span style={{ fontWeight: 600, fontSize: 18, letterSpacing: "-0.01em", color: "var(--text-1)" }}>
          Gadi<span style={{ fontWeight: 400, color: "var(--accent)" }}>.ai</span>
        </span>
      </div>

      {/* Org card */}
      <OrgCard />

      {/* Operations */}
      <SidebarSection label="Operations" />
      <nav className="flex flex-col gap-px px-2">
        {ops.map(item => (
          <NavLink
            key={item.href + item.label}
            item={item}
            active={pathname === item.href || (pathname.startsWith(item.href + "/") && item.href !== "#")}
          />
        ))}
      </nav>

      {/* Configure */}
      <SidebarSection label="Configure" />
      <nav className="flex flex-col gap-px px-2">
        {configItems.map(item => (
          <NavLink key={item.label} item={item} active={false} />
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-2 pb-3 pt-2" style={{ borderTop: "1px solid var(--line)" }}>
        <nav className="flex flex-col gap-px">
          <NavLink item={{ href: "#", label: "Settings", Icon: Settings }} active={false} />
          <NavLink item={{ href: "#", label: "Help", Icon: HelpCircle }} active={false} />
        </nav>
        <div className="flex items-center gap-2 px-[14px] py-1.5 mt-1">
          <p className="text-[11px] flex-1 truncate" style={{ color: "var(--text-4)" }}>{email}</p>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" title="Sign out" className="flex items-center transition-colors" style={{ color: "var(--text-3)" }}>
              <LogOut size={13} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}

function OrgCard() {
  return (
    <div
      className="flex items-center gap-2.5 mx-3 mt-3 mb-1 px-[18px] py-[14px] cursor-pointer group"
      style={{ border: "1px solid var(--line)", borderRadius: "var(--g-radius-md)", background: "var(--surface-2)", transition: "border-color 0.12s" }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--line)")}
    >
      <div
        className="shrink-0 flex items-center justify-center text-white text-[13px] font-semibold"
        style={{ width: 32, height: 32, borderRadius: 8, background: "var(--accent-deep)" }}
      >
        GG
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold truncate" style={{ color: "var(--text-1)", lineHeight: 1.25 }}>
          Go Green Builders
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>Gadi Pro · AI Voice Agent</p>
      </div>
      <ChevronDown size={14} className="shrink-0" style={{ color: "var(--text-3)" }} />
    </div>
  );
}

function SidebarSection({ label }: { label: string }) {
  return (
    <p className="px-[22px] pb-1.5 pt-[18px]"
      style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-4)" }}
    >
      {label}
    </p>
  );
}

interface NavItem { href: string; label: string; Icon: React.ElementType; live?: boolean; count?: number; }

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const { href, label, Icon, live } = item;
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-[14px] py-[9px] text-[13px] relative transition-all"
      style={{
        borderRadius: "var(--g-radius-md)",
        color: active ? "var(--accent-deep)" : "var(--text-2)",
        background: active ? "var(--accent-soft)" : "transparent",
        fontWeight: active ? 600 : 500,
        textDecoration: "none",
      }}
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "var(--surface-3)";
          (e.currentTarget as HTMLElement).style.color = "var(--text-1)";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--text-2)";
        }
      }}
    >
      {active && (
        <span className="absolute left-0 rounded-[2px]"
          style={{ top: 8, bottom: 8, width: 3, background: "var(--accent)" }}
        />
      )}
      <Icon size={16} className="shrink-0" />
      <span className="flex-1">{label}</span>
      {live && (
        <span className="shrink-0" style={{
          width: 7, height: 7, borderRadius: 999,
          background: "var(--pos)",
          animation: "livePulse 1.6s ease-in-out infinite",
        }} />
      )}
    </Link>
  );
}

/* ── Topbar ──────────────────────────────────────────────── */

function Topbar({ email }: { email: string }) {
  const pathname = usePathname();
  const label = pathToLabel(pathname);

  return (
    <header
      className="flex items-center gap-3 shrink-0 px-[22px]"
      style={{ height: "var(--topbar-h)", background: "var(--surface)", borderBottom: "1px solid var(--line)" }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 whitespace-nowrap text-[13px]" style={{ color: "var(--text-3)" }}>
        <span>Operations</span>
        <span style={{ fontSize: 11 }}>›</span>
        <span className="font-semibold" style={{ color: "var(--text-1)" }}>{label}</span>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div
        className="flex items-center gap-2 px-3"
        style={{
          height: 34, maxWidth: 320, width: "100%", flexShrink: 1, minWidth: 160,
          border: "1px solid var(--line)", borderRadius: "var(--g-radius-pill)",
          background: "var(--surface-2)",
        }}
      >
        <Search size={14} className="shrink-0" style={{ color: "var(--text-4)" }} />
        <input
          placeholder="Search calls, customers…"
          className="flex-1 bg-transparent text-[13px] outline-none min-w-0"
          style={{ color: "var(--text-1)", fontFamily: "var(--font-sans)" }}
        />
        <kbd
          className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
          style={{ background: "var(--surface-3)", border: "1px solid var(--line)", color: "var(--text-4)", fontFamily: "var(--font-mono)" }}
        >
          ⌘K
        </kbd>
      </div>

      {/* Live ticker */}
      <Link
        href="/live"
        className="flex items-center gap-1.5 px-3 whitespace-nowrap shrink-0 transition-colors"
        style={{
          height: 34, borderRadius: "var(--g-radius-pill)",
          background: "var(--surface-3)", border: "1px solid var(--line)",
          fontSize: 12, color: "var(--text-2)", textDecoration: "none",
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: 999, background: "var(--pos)", animation: "livePulse 1.6s ease-in-out infinite", display: "inline-block", flexShrink: 0 }} />
        <span><b style={{ color: "var(--text-1)" }}>0</b> live</span>
        <span style={{ width: 4, height: 4, borderRadius: 999, background: "var(--line-strong)", display: "inline-block" }} />
        <span>Today <b style={{ color: "var(--text-1)" }}>$0</b></span>
      </Link>

      {/* Divider */}
      <div className="shrink-0" style={{ width: 1, height: 22, background: "var(--line-strong)" }} />

      {/* Bell */}
      <button
        className="relative flex items-center justify-center shrink-0 transition-colors"
        style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "transparent", cursor: "pointer" }}
        onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-3)")}
        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      >
        <Bell size={16} style={{ color: "var(--text-2)" }} />
        <span className="absolute" style={{ top: 7, right: 7, width: 7, height: 7, borderRadius: 999, background: "var(--accent)", border: "2px solid var(--surface)" }} />
      </button>

      {/* Profile */}
      <div className="flex items-center gap-2 px-2 py-1 cursor-pointer shrink-0" style={{ borderRadius: "var(--g-radius-pill)" }}>
        <div
          className="flex items-center justify-center text-white text-[12px] font-semibold shrink-0"
          style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent-deep)" }}
        >
          {email.charAt(0).toUpperCase()}
        </div>
        <div className="hidden md:block">
          <p className="text-[13px] font-medium leading-tight" style={{ color: "var(--text-1)" }}>Admin</p>
          <p className="text-[11px] leading-tight" style={{ color: "var(--text-3)" }}>Operations</p>
        </div>
        <ChevronDown size={12} className="shrink-0" style={{ color: "var(--text-3)" }} />
      </div>
    </header>
  );
}

function pathToLabel(pathname: string): string {
  if (pathname.startsWith("/overview") || pathname.startsWith("/dashboard")) return "Overview";
  if (pathname.startsWith("/live")) return "Live Calls";
  if (pathname.startsWith("/calls")) return "Call Logs";
  if (pathname.startsWith("/campaigns")) return "Campaigns";
  if (pathname.startsWith("/analytics") || pathname.startsWith("/pricing")) return "Analytics";
  if (pathname.startsWith("/billing")) return "Billing";
  return "Dashboard";
}
