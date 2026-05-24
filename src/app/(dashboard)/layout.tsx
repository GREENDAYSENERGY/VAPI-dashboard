import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, BarChart2, DollarSign, Phone } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 flex flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg shrink-0"
            style={{ backgroundColor: "#166534" }}
          >
            ☀️
          </div>
          <div className="leading-tight min-w-0">
            <p className="text-xs font-semibold text-gray-900 truncate">Go Green Builders</p>
            <p className="text-[10px] text-gray-400">VAPI Dashboard</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink href="/dashboard" icon={<BarChart2 className="w-4 h-4" />}>
            Dashboard
          </NavLink>
          <NavLink href="/pricing" icon={<DollarSign className="w-4 h-4" />}>
            Pricing
          </NavLink>
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 px-2 mb-2 truncate">{session.email}</p>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="flex items-center gap-2 w-full px-2 py-2 text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

function NavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
    >
      {icon}
      {children}
    </Link>
  );
}
