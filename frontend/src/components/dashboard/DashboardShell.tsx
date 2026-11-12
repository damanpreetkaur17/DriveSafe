"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  MonitorPlay,
  LineChart,
  Bell,
  History,
  Settings,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";

interface DashboardShellProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "OVERVIEW", href: "/dashboard", icon: LayoutDashboard },
  { name: "LIVE MONITOR", href: "/dashboard/live", icon: MonitorPlay },
  { name: "ANALYTICS", href: "/dashboard/analytics", icon: LineChart },
  { name: "ALERTS", href: "/dashboard/alerts", icon: Bell },
  { name: "SESSIONS", href: "/dashboard/sessions", icon: History },
];

const bottomNavigation = [
  { name: "PROFILE", href: "/dashboard/profile", icon: User },
  { name: "SETTINGS", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070B]">

      {/* ====================================================== */}
      {/* TOP BAR                                                */}
      {/* ====================================================== */}

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-[#05070B]/95 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-6">

          {/* Left â€” Branding */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="group flex items-center gap-3">
              {/* Logo Mark */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] transition-all duration-300 group-hover:border-white/30">
                <div className="h-1.5 w-1.5 rounded-full bg-white" />
              </div>

              {/* Logo Text */}
              <div className="flex flex-col leading-none">
                <span className="text-[13px] font-semibold tracking-[0.18em] text-white">
                  DRIVESAFE
                </span>
                <span className="mt-0.5 text-[7px] tracking-[0.2em] text-white/35">
                  AI DRIVER MONITORING
                </span>
              </div>
            </Link>

          </div>

          {/* Right â€” Actions */}
          <div className="flex items-center gap-3">
            {/* Settings */}
            <Link
              href="/dashboard/settings"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-white/20 hover:text-white"
            >
              <Settings size={16} />
            </Link>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 transition hover:border-white/20"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                  <User size={14} className="text-white/70" />
                </div>
                <span className="hidden text-xs text-white/70 sm:block">{user?.username || "Driver"}</span>
                <ChevronDown size={12} className="text-white/50" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 w-48 rounded-xl border border-white/10 bg-[#05070B]/98 p-2 backdrop-blur-xl">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <User size={14} />
                    Profile
                  </Link>
                  <Link
                    href="/dashboard/sessions"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <History size={14} />
                    Session History
                  </Link>
                  <div className="my-1 h-px bg-white/10" />
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================== */}
      {/* SIDEBAR NAVIGATION                                     */}
      {/* ====================================================== */}

      <aside className="fixed left-0 top-16 z-40 hidden h-[calc(100vh-4rem)] w-64 border-r border-white/10 bg-[#05070B] lg:block">
        <nav className="flex h-full flex-col p-4">
          <div className="flex-1 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition
                    ${isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-white" />
                  )}
                  <Icon size={16} strokeWidth={1.5} />
                  <span className="text-[11px] tracking-wider">{item.name}</span>
                </Link>
              );
            })}
          </div>
          <div className="space-y-1 border-t border-white/10 pt-4">
            {bottomNavigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition
                    ${isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
                    }
                  `}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-white" />
                  )}
                  <Icon size={16} strokeWidth={1.5} />
                  <span className="text-[11px] tracking-wider">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>

      {/* ====================================================== */}
      {/* MOBILE NAVIGATION                                      */}
      {/* ====================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 border-t border-white/10 bg-[#05070B]/95 px-1 py-2 backdrop-blur-xl lg:hidden">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 py-1 text-[9px] text-white/45"
            >
              <Icon
                size={16}
                strokeWidth={1.7}
                className={isActive ? "text-white/65" : undefined}
              />
              <span className={isActive ? "text-white/65" : ""}>
                {item.name.replace("LIVE MONITOR", "LIVE")}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* ====================================================== */}
      {/* MAIN CONTENT                                           */}
      {/* ====================================================== */}

      <main className="pb-20 pt-16 lg:pb-0 lg:pl-64">
        {children}
      </main>
    </div>
  );
}
