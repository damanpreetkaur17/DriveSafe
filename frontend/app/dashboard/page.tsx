"use client";

import DashboardShell from "@/components/dashboard/DashboardShell";
import DriverStateIndicator from "@/components/dashboard/DriverStateIndicator";
import FatigueRiskGauge from "@/components/dashboard/FatigueRiskGauge";
import MetricCard from "@/components/dashboard/MetricCard";
import Sparkline from "@/components/dashboard/Sparkline";
import CameraOverview from "@/components/dashboard/CameraOverview";
import {
  getCurrentDriverState,
  getFatigueRisk,
  getLiveTelemetry,
  getTelemetryHistory,
  getActiveAlert,
  getFatigueTimeline,
  getPipelineStatus,
  getCurrentSession,
} from "@/lib/mockData";
import { AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function DashboardOverview() {
  // Load mock data
  const driverState = getCurrentDriverState();
  const fatigueRisk = getFatigueRisk();
  const telemetry = getLiveTelemetry();
  const activeAlert = getActiveAlert();
  const fatigueTimeline = getFatigueTimeline();
  const pipeline = getPipelineStatus();
  const session = getCurrentSession();

  return (
    <DashboardShell>
      <div className="min-h-screen p-6">

        {/* ====================================================== */}
        {/* MAIN GRID                                              */}
        {/* ====================================================== */}

        <div className="grid gap-6 lg:grid-cols-3">

          {/* ================================================== */}
          {/* LEFT COLUMN â€” Camera & State                       */}
          {/* ================================================== */}

          <div className="space-y-6 lg:col-span-2">

            {/* Live Camera */}
            <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Live Camera
                </h2>
                <p className="mt-1 text-xs text-white/40">Real-time facial monitoring</p>
              </div>

              {/* Camera Overview Component */}
              <CameraOverview />
            </div>

            {/* Fatigue Timeline */}
            <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                    Fatigue Evolution
                  </h2>
                  <p className="mt-1 text-xs text-white/40">Last 60 minutes</p>
                </div>
                <Link
                  href="/dashboard/analytics"
                  className="text-xs text-white/50 transition hover:text-white"
                >
                  <span
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    className="text-[10px] font-semibold uppercase tracking-[0.15em]"
                  >
                    View Full Analytics â†’
                  </span>
                </Link>
              </div>

              {/* Simple line chart visualization */}
              <div className="relative h-48 rounded-lg border border-white/5 bg-black/20 p-4">
                <svg className="h-full w-full" viewBox="0 0 600 150" preserveAspectRatio="none">
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 37.5}
                      x2="600"
                      y2={i * 37.5}
                      stroke="rgba(255, 255, 255, 0.05)"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Fatigue line */}
                  <polyline
                    points={fatigueTimeline
                      .map((point, i) => `${(i / (fatigueTimeline.length - 1)) * 600},${150 - (point.risk / 100) * 150}`)
                      .join(' ')}
                    fill="none"
                    stroke="rgb(74, 222, 128)"
                    strokeWidth="2"
                    className="transition-all duration-300"
                  />

                  {/* Area fill */}
                  <polygon
                    points={`0,150 ${fatigueTimeline
                      .map((point, i) => `${(i / (fatigueTimeline.length - 1)) * 600},${150 - (point.risk / 100) * 150}`)
                      .join(' ')} 600,150`}
                    fill="url(#gradient)"
                    opacity="0.2"
                  />

                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgb(74, 222, 128)" />
                      <stop offset="100%" stopColor="rgb(74, 222, 128)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 flex h-full flex-col justify-between py-4 text-[10px] text-white/30">
                  <span>100%</span>
                  <span>75%</span>
                  <span>50%</span>
                  <span>25%</span>
                  <span>0%</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================== */}
          {/* RIGHT COLUMN â€” Metrics & Status                    */}
          {/* ================================================== */}

          <div className="space-y-6">

            {/* Driver State */}
            <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                Driver State
              </h2>
              <div className="flex justify-center">
                <DriverStateIndicator
                  state={driverState.state}
                  confidence={driverState.confidence}
                  size="md"
                />
              </div>
            </div>

            {/* Fatigue Risk */}
            <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                Fatigue Risk
              </h2>
              <div className="flex justify-center">
                <FatigueRiskGauge risk={fatigueRisk} size="md" />
              </div>
            </div>

            {/* Active Alerts */}
            <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-white">
                  Active Alerts
                </h2>
                <Link href="/dashboard/alerts" className="text-xs text-white/50 hover:text-white">
                  <span
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}
                    className="text-[10px] font-semibold uppercase tracking-[0.15em]"
                  >
                    View All â†’
                  </span>
                </Link>
              </div>

              {activeAlert ? (
                <div className={`rounded-lg border p-4 ${
                  activeAlert.severity === 'CRITICAL'
                    ? 'border-red-500/30 bg-red-500/10'
                    : 'border-amber-500/30 bg-amber-500/10'
                }`}>
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      size={20}
                      className={activeAlert.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}
                    />
                    <div className="flex-1">
                      <div className={`text-sm font-semibold ${
                        activeAlert.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'
                      }`}>
                        {activeAlert.type}
                      </div>
                      <p className="mt-1 text-xs text-white/70">{activeAlert.message}</p>
                      {activeAlert.metric && (
                        <div className="mt-2 font-mono text-xs text-white/50">{activeAlert.metric}</div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/50">
                  <CheckCircle size={16} className="text-green-400" />
                  No active alerts
                </div>
              )}
            </div>

            {/* Session Snapshot */}
            <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
                Current Session
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Duration</span>
                  <span className="font-mono text-white">{Math.floor(session.duration)} min</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Time Alert</span>
                  <span className="font-mono text-white">{session.timeAlert}%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/50">Warnings</span>
                  <span className="font-mono text-white">{session.warnings}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================== */}
        {/* BOTTOM ROW â€” Telemetry & Pipeline                      */}
        {/* ====================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-2">

          {/* Live Telemetry */}
          <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Live Telemetry
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <MetricCard label="EAR" value={telemetry.ear.toFixed(2)} size="sm">
                <Sparkline data={getTelemetryHistory('ear')} color="rgba(74, 222, 128, 0.5)" height={24} />
              </MetricCard>
              <MetricCard label="MAR" value={telemetry.mar.toFixed(2)} size="sm">
                <Sparkline data={getTelemetryHistory('mar')} color="rgba(74, 222, 128, 0.5)" height={24} />
              </MetricCard>
              <MetricCard label="BLINK RATE" value={telemetry.blinkRate} unit="/min" size="sm">
                <Sparkline data={getTelemetryHistory('blinkRate')} color="rgba(74, 222, 128, 0.5)" height={24} />
              </MetricCard>
              <MetricCard label="EYE CLOSURE" value={telemetry.eyeClosure.toFixed(2)} unit="s" size="sm">
                <Sparkline data={getTelemetryHistory('eyeClosure')} color="rgba(74, 222, 128, 0.5)" height={24} />
              </MetricCard>
              <MetricCard label="YAWNING" value={telemetry.yawning} size="sm">
                <Sparkline data={getTelemetryHistory('yawning')} color="rgba(74, 222, 128, 0.5)" height={24} />
              </MetricCard>
            </div>
          </div>

          {/* AI Pipeline */}
          <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              AI Pipeline
            </h2>
            <div className="flex items-center justify-between">
              {pipeline.map((stage, index) => (
                <div key={stage.stage} className="flex items-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                      stage.status === 'ACTIVE' ? 'border-green-500/50 bg-green-500/20' : 'border-white/20 bg-white/5'
                    }`}>
                      <div className={`h-2 w-2 rounded-full ${
                        stage.status === 'ACTIVE' ? 'bg-green-400' : 'bg-white/30'
                      }`} />
                    </div>
                    <span className="text-[9px] text-white/40">{stage.stage}</span>
                    {stage.latency && (
                      <span className="text-[8px] text-white/30">{stage.latency}ms</span>
                    )}
                  </div>
                  {index < pipeline.length - 1 && (
                    <div className="mx-2 h-px w-4 bg-white/20" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
