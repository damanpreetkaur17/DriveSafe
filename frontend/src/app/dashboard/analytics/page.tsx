"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import Link from "next/link";
import {
  getFatigueTimeline,
  getSignalDistribution,
  getStateTransitions,
  getCurrentSession,
} from "@/lib/mockData";
import { TrendingUp, Activity, Eye, Moon } from "lucide-react";

export default function AnalyticsPage() {
  const fatigueTimeline = getFatigueTimeline();
  const earData = getSignalDistribution('EAR', 1);
  const marData = getSignalDistribution('MAR', 1);
  const stateTransitions = getStateTransitions();
  const session = getCurrentSession();

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
              Analytics
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Deep analysis of driver state and fatigue patterns
            </p>
          </div>

          {/* Quick nav */}
          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:border-white/20 hover:text-white"
            >
              <span style={{ fontFamily: "'Rajdhani', sans-serif" }} className="text-[10px] font-semibold uppercase tracking-wider">
                Overview
              </span>
            </Link>
            <Link
              href="/dashboard/sessions"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:border-white/20 hover:text-white"
            >
              <span style={{ fontFamily: "'Rajdhani', sans-serif" }} className="text-[10px] font-semibold uppercase tracking-wider">
                Sessions
              </span>
            </Link>
          </div>
        </div>

        {/* Session Summary Cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            icon={<Activity size={18} />}
            label="Avg Fatigue Risk"
            value={`${session.avgFatigueRisk}%`}
            trend="stable"
          />
          <SummaryCard
            icon={<TrendingUp size={18} />}
            label="Max Fatigue Risk"
            value={`${session.maxFatigueRisk}%`}
            trend="up"
          />
          <SummaryCard
            icon={<Eye size={18} />}
            label="Time Alert"
            value={`${session.timeAlert}%`}
            trend="stable"
          />
          <SummaryCard
            icon={<Moon size={18} />}
            label="Time Drowsy"
            value={`${session.timeDrowsy}%`}
            trend="down"
          />
        </div>

        {/* Main Analytics Grid */}
        <div className="space-y-6">

          {/* Fatigue Evolution */}
          <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                Fatigue Evolution
              </h2>
              <p className="mt-1 text-xs text-white/40">Real-time fatigue risk over the last 60 minutes</p>
            </div>

            <div className="relative h-64 rounded-lg border border-white/5 bg-black/20 p-6">
              <svg className="h-full w-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4].map((i) => (
                  <g key={i}>
                    <line
                      x1="0"
                      y1={i * 50}
                      x2="800"
                      y2={i * 50}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="1"
                    />
                    <text
                      x="10"
                      y={i * 50 + 15}
                      fill="rgba(255, 255, 255, 0.3)"
                      fontSize="10"
                    >
                      {100 - i * 25}%
                    </text>
                  </g>
                ))}

                {/* Fatigue area */}
                <defs>
                  <linearGradient id="fatigueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(74, 222, 128)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(74, 222, 128)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <polygon
                  points={`0,200 ${fatigueTimeline
                    .map((point, i) => `${(i / (fatigueTimeline.length - 1)) * 800},${200 - (point.risk / 100) * 200}`)
                    .join(' ')} 800,200`}
                  fill="url(#fatigueGradient)"
                />

                {/* Fatigue line */}
                <polyline
                  points={fatigueTimeline
                    .map((point, i) => `${(i / (fatigueTimeline.length - 1)) * 800},${200 - (point.risk / 100) * 200}`)
                    .join(' ')}
                  fill="none"
                  stroke="rgb(74, 222, 128)"
                  strokeWidth="3"
                />

                {/* State change markers */}
                {fatigueTimeline.map((point, i) => {
                  if (i > 0 && point.state !== fatigueTimeline[i - 1].state) {
                    return (
                      <circle
                        key={i}
                        cx={(i / (fatigueTimeline.length - 1)) * 800}
                        cy={200 - (point.risk / 100) * 200}
                        r="5"
                        fill={point.state === 'ALERT' ? '#4ade80' : point.state === 'DROWSY' ? '#fbbf24' : '#ef4444'}
                        stroke="white"
                        strokeWidth="2"
                      />
                    );
                  }
                  return null;
                })}
              </svg>
            </div>
          </div>

          {/* Signal Analysis */}
          <div className="grid gap-6 lg:grid-cols-2">

            {/* EAR Trend */}
            <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Eye Aspect Ratio (EAR)
                </h2>
                <p className="mt-1 text-xs text-white/40">Lower values indicate eye closure</p>
              </div>

              <div className="relative h-48 rounded-lg border border-white/5 bg-black/20 p-4">
                <svg className="h-full w-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                  {/* Grid */}
                  {[0, 1, 2, 3].map((i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 50}
                      x2="400"
                      y2={i * 50}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* EAR line */}
                  <polyline
                    points={earData.data
                      .map((point, i) => `${(i / (earData.data.length - 1)) * 400},${150 - point.value * 150}`)
                      .join(' ')}
                    fill="none"
                    stroke="rgb(96, 165, 250)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>

            {/* MAR Trend */}
            <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Mouth Aspect Ratio (MAR)
                </h2>
                <p className="mt-1 text-xs text-white/40">Higher values indicate yawning</p>
              </div>

              <div className="relative h-48 rounded-lg border border-white/5 bg-black/20 p-4">
                <svg className="h-full w-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                  {/* Grid */}
                  {[0, 1, 2, 3].map((i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 50}
                      x2="400"
                      y2={i * 50}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* MAR line */}
                  <polyline
                    points={marData.data
                      .map((point, i) => `${(i / (marData.data.length - 1)) * 400},${150 - point.value * 150}`)
                      .join(' ')}
                    fill="none"
                    stroke="rgb(251, 191, 36)"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* State Distribution */}
          <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                Driver State Distribution
              </h2>
              <p className="mt-1 text-xs text-white/40">Time spent in each state during the current session</p>
            </div>

            <div className="space-y-4">
              <StateBar label="ALERT" percentage={session.timeAlert} color="bg-green-500" />
              <StateBar label="DROWSY" percentage={session.timeDrowsy} color="bg-amber-500" />
              <StateBar label="FATIGUED" percentage={session.timeFatigued} color="bg-red-500" />
            </div>
          </div>

          {/* State Transitions */}
          <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                State Transitions
              </h2>
              <p className="mt-1 text-xs text-white/40">Historical driver state changes</p>
            </div>

            <div className="space-y-4">
              {stateTransitions.map((transition, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 rounded-lg border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="flex items-center gap-2">
                    <StateChip state={transition.from} />
                    <span className="text-white/30">â†’</span>
                    <StateChip state={transition.to} />
                  </div>
                  <div className="flex-1 text-xs text-white/40">
                    Duration: {Math.floor(transition.duration / 60)}m {transition.duration % 60}s
                  </div>
                  <div className="text-xs text-white/30">
                    {new Date(transition.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signal Activity */}
          <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
            <div className="mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                Signal Activity
              </h2>
              <p className="mt-1 text-xs text-white/40">Normalized signal levels contributing to fatigue detection</p>
            </div>

            <div className="space-y-4">
              <SignalBar label="EYE ASPECT RATIO" level={0.72} />
              <SignalBar label="MOUTH ASPECT RATIO" level={0.35} />
              <SignalBar label="BLINK FREQUENCY" level={0.58} />
              <SignalBar label="EYE CLOSURE DURATION" level={0.41} />
              <SignalBar label="YAWNING FREQUENCY" level={0.28} />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  trend
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#07090E] p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-white/50">{icon}</div>
        <span className={`text-xs ${
          trend === 'up' ? 'text-red-400' :
          trend === 'down' ? 'text-green-400' :
          'text-white/50'
        }`}>
          {trend === 'up' ? 'â†‘' : trend === 'down' ? 'â†“' : 'â†’'}
        </span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="mt-1 text-xs text-white/40">{label}</div>
    </div>
  );
}

function StateBar({
  label,
  percentage,
  color
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

function StateChip({ state }: { state: string }) {
  const colors = {
    ALERT: 'bg-green-500/20 text-green-400 border-green-500/30',
    DROWSY: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    FATIGUED: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className={`rounded-full border px-3 py-1 text-xs font-semibold ${colors[state as keyof typeof colors]}`}>
      {state}
    </div>
  );
}

function SignalBar({
  label,
  level
}: {
  label: string;
  level: number;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-white/70">{label}</span>
        <span className="font-mono text-xs text-white/50">{Math.round(level * 100)}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-cyan-500 transition-all duration-1000"
          style={{ width: `${level * 100}%` }}
        />
      </div>
    </div>
  );
}
