"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Activity, LayoutDashboard, ListChecks, LogOut, Settings, Users } from "lucide-react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/queues", label: "Queues", icon: ListChecks },
  { href: "/analytics", label: "Analytics", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function DashboardLayout({ children }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) return <div className="grid min-h-screen place-items-center text-sm text-muted">Loading your workspace…</div>;

  async function logout() {
    await signOut();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen md:flex">
      <aside className="flex items-center justify-between bg-[#192437] px-4 py-3 text-white md:fixed md:inset-y-0 md:flex-col md:items-stretch md:justify-start md:w-[230px] md:px-4 md:py-6">
        <Link href="/dashboard" className="flex items-center gap-3 px-2 font-bold">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand"><Users size={19} /></div>
          <span className="hidden md:inline">Queue<span className="text-blue-300">Flow</span></span>
        </Link>
        <nav className="flex gap-1 md:mt-12 md:flex-col">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} title={label} className={`sidebar-link ${pathname === href || (href === "/queues" && pathname.startsWith("/queues/")) ? "active" : ""}`}>
              <Icon size={18} /><span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="hidden md:mt-auto md:block">
          <div className="mb-4 truncate px-2 text-xs text-slate-400">{user.email}</div>
          <button onClick={logout} className="sidebar-link w-full"><LogOut size={18} /><span>Sign out</span></button>
        </div>
        <button onClick={logout} className="text-slate-300 md:hidden" aria-label="Sign out"><LogOut size={18} /></button>
      </aside>
      <main className="min-h-screen w-full p-4 md:ml-[230px] md:p-8">
        <header className="mb-7 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.16em] text-brand">Workspace</p>
            <h1 className="mt-1 text-xl font-bold text-ink">Welcome back, {user.name.split(" ")[0]}</h1>
          </div>
          <div className="hidden rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-muted sm:block">{user.name}</div>
        </header>
        {children}
      </main>
    </div>
  );
}
