"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  { name: "SETTINGS", href: "/dashboard/settings", icon: Settings },
];

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

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

            {/* System Status */}
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 lg:flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                <span className="relative h-1.5 w-1.5 rounded-full bg-green-400" />
              </span>
              <span
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
                className="text-[9px] font-semibold uppercase tracking-[0.15em] text-white/40"
              >
                AI Monitoring Active
              </span>
            </div>

            {/* Session Info */}
            <div className="hidden items-center gap-2 xl:flex">
              <span className="text-[10px] font-medium tracking-wider text-white/30">
                SESSION
              </span>
              <span className="font-mono text-[11px] font-medium text-white/50">
                18:42
              </span>
            </div>
          </div>

          {/* Right â€” Actions */}
          <div className="flex items-center gap-3">

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-white/20 hover:text-white"
              >
                <Bell size={16} />
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 w-80 rounded-xl border border-white/10 bg-[#05070B]/98 p-4 backdrop-blur-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/70">
                      Notifications
                    </span>
                    <span className="text-[10px] text-white/40">1 active</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-500">
                          <Bell size={12} />
                        </div>
                        <div>
                          <p className="text-xs text-white/70">Drowsiness detected</p>
                          <p className="mt-0.5 text-[10px] text-white/40">1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

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
                <span className="hidden text-xs text-white/70 sm:block">Driver</span>
                <ChevronDown size={12} className="text-white/50" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-12 w-48 rounded-xl border border-white/10 bg-[#05070B]/98 p-2 backdrop-blur-xl">
                  <Link
                    href="/dashboard/settings"
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
          <div className="space-y-1">
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
        </nav>
      </aside>

      {/* ====================================================== */}
      {/* MAIN CONTENT                                           */}
      {/* ====================================================== */}

      <main className="pt-16 lg:pl-64">
        {children}
      </main>
    </div>
  );
}
