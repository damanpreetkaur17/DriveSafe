"use client";

import { useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Link from "next/link";
import { getCurrentSession, getSessionHistory, Session } from "@/lib/mockData";
import { Clock, AlertTriangle, Activity, Calendar, TrendingUp } from "lucide-react";

export default function SessionsPage() {
  const currentSession = getCurrentSession();
  const sessionHistory = getSessionHistory();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  return (
    <DashboardShell>
      <div className="min-h-screen p-6">

        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1
              style={{ fontFamily: "'Orbitron', sans-serif" }}
              className="text-2xl font-bold tracking-tight text-white"
            >
              Sessions
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Monitor current and historical driving sessions
            </p>
          </div>

          {/* Quick nav */}
          <Link
            href="/dashboard/analytics"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:border-white/20 hover:text-white"
          >
            <span style={{ fontFamily: "'Rajdhani', sans-serif" }} className="text-[10px] font-semibold uppercase tracking-wider">
              Analytics
            </span>
          </Link>
        </div>

        {/* Current Session */}
        <div className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/70">
            <div className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
              <span className="relative h-2 w-2 rounded-full bg-green-400" />
            </div>
            Current Session
          </div>

          <SessionCard session={currentSession} current />
        </div>

        {/* Session History */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/70">
            <Calendar size={16} />
            Session History
          </div>

          <div className="space-y-3">
            {sessionHistory.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => setSelectedSession(session)}
                selected={selectedSession?.id === session.id}
              />
            ))}
          </div>
        </div>

        {/* Session Detail Modal/Panel */}
        {selectedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-white/10 bg-[#05070B] p-6">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Session Details</h2>
                  <p className="mt-1 text-sm text-white/40">
                    {new Date(selectedSession.startTime).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-white/50 transition hover:bg-white/[0.05] hover:text-white"
                >
                  Close
                </button>
              </div>

              <SessionDetailView session={selectedSession} />
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function SessionCard({
  session,
  current = false,
  onClick,
  selected = false,
}: {
  session: Session;
  current?: boolean;
  onClick?: () => void;
  selected?: boolean;
}) {
  const duration = Math.floor(session.duration);
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border transition ${
        selected
          ? 'border-white/30 bg-white/[0.08]'
          : 'border-white/10 bg-[#07090E] hover:border-white/20 hover:bg-[#0a0d13]'
      } ${onClick ? 'cursor-pointer' : ''} p-5`}
    >
      <div className="flex items-start justify-between gap-4">

        {/* Left â€” Session Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold text-white">
              {session.id}
            </span>
            {current && (
              <span className="flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-xs font-semibold text-green-400">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-green-400" />
                </span>
                LIVE
              </span>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <SessionMetric
              icon={<Clock size={14} />}
              label="Duration"
              value={hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`}
            />
            <SessionMetric
              icon={<Activity size={14} />}
              label="Avg Risk"
              value={`${session.avgFatigueRisk}%`}
            />
            <SessionMetric
              icon={<TrendingUp size={14} />}
              label="Max Risk"
              value={`${session.maxFatigueRisk}%`}
            />
            <SessionMetric
              icon={<AlertTriangle size={14} />}
              label="Warnings"
              value={session.warnings}
            />
          </div>

          {/* State Distribution Bar */}
          <div className="mt-4">
            <div className="flex h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="bg-green-500"
                style={{ width: `${session.timeAlert}%` }}
                title={`Alert: ${session.timeAlert}%`}
              />
              <div
                className="bg-amber-500"
                style={{ width: `${session.timeDrowsy}%` }}
                title={`Drowsy: ${session.timeDrowsy}%`}
              />
              <div
                className="bg-red-500"
                style={{ width: `${session.timeFatigued}%` }}
                title={`Fatigued: ${session.timeFatigued}%`}
              />
            </div>
            <div className="mt-2 flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-white/50">Alert {session.timeAlert}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-white/50">Drowsy {session.timeDrowsy}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-white/50">Fatigued {session.timeFatigued}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right â€” Date/Time */}
        {!current && (
          <div className="text-right">
            <div className="text-xs text-white/40">
              {new Date(session.startTime).toLocaleDateString()}
            </div>
            <div className="mt-1 text-xs text-white/30">
              {new Date(session.startTime).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-white/40">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-1 font-mono text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function SessionDetailView({ session }: { session: Session }) {
  return (
    <div className="space-y-6">

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="text-xs uppercase tracking-wider text-white/40">Duration</div>
          <div className="mt-2 font-mono text-2xl font-bold text-white">
            {Math.floor(session.duration / 60)}h {Math.floor(session.duration % 60)}m
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="text-xs uppercase tracking-wider text-white/40">Total Warnings</div>
          <div className="mt-2 font-mono text-2xl font-bold text-white">{session.warnings}</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="text-xs uppercase tracking-wider text-white/40">Avg Fatigue Risk</div>
          <div className="mt-2 font-mono text-2xl font-bold text-white">{session.avgFatigueRisk}%</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
          <div className="text-xs uppercase tracking-wider text-white/40">Max Fatigue Risk</div>
          <div className="mt-2 font-mono text-2xl font-bold text-white">{session.maxFatigueRisk}%</div>
        </div>
      </div>

      {/* State Distribution */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/70">
          State Distribution
        </div>
        <div className="space-y-3">
          <StateBar label="ALERT" percentage={session.timeAlert} color="bg-green-500" />
          <StateBar label="DROWSY" percentage={session.timeDrowsy} color="bg-amber-500" />
          <StateBar label="FATIGUED" percentage={session.timeFatigued} color="bg-red-500" />
        </div>
      </div>

      {/* Session Timeline Placeholder */}
      <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/70">
          Session Timeline
        </div>
        <div className="flex h-32 items-center justify-center rounded-lg border border-white/5 bg-black/20 text-xs text-white/40">
          Timeline visualization would appear here
        </div>
      </div>
    </div>
  );
}

function StateBar({
  label,
  percentage,
  color,
}: {
  label: string;
  percentage: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="font-mono text-white">{percentage}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/5">
        <div
          className={`h-full transition-all duration-1000 ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
