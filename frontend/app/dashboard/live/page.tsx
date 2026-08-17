"use client";

import { useState } from "react";
import Link from "next/link";
import DashboardShell from "@/components/dashboard/DashboardShell";
import DriverStateIndicator from "@/components/dashboard/DriverStateIndicator";
import FatigueRiskGauge from "@/components/dashboard/FatigueRiskGauge";
import MetricCard from "@/components/dashboard/MetricCard";
import CameraMonitor from "@/components/dashboard/CameraMonitor";
import { FaceDetectionResult } from "@/hooks/useFaceDetection";
import {
  getCurrentDriverState,
  getFatigueRisk,
  getLiveTelemetry,
  getActiveAlert,
} from "@/lib/mockData";
import { AlertTriangle } from "lucide-react";

export default function LiveMonitorPage() {
  const [faceData, setFaceData] = useState<FaceDetectionResult | null>(null);

  const driverState = getCurrentDriverState();
  const fatigueRisk = getFatigueRisk();
  const telemetry = getLiveTelemetry();
  const activeAlert = getActiveAlert();

  const handleFaceDetectionUpdate = (result: FaceDetectionResult | null) => {
    setFaceData(result);
  };

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
              Live Monitor
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Real-time computer vision and driver state monitoring
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
              href="/dashboard/analytics"
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:border-white/20 hover:text-white"
            >
              <span style={{ fontFamily: "'Rajdhani', sans-serif" }} className="text-[10px] font-semibold uppercase tracking-wider">
                Analytics
              </span>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">

          {/* ================================================== */}
          {/* MAIN CAMERA FEED (spans 3 columns)                 */}
          {/* ================================================== */}

          <div className="space-y-6 lg:col-span-3">

            {/* Large Camera Display */}
            <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
                      <span className="relative h-1.5 w-1.5 rounded-full bg-green-400" />
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-white/50">
                      Live Monitor
                    </span>
                  </div>
                </div>
              </div>

              {/* Camera Monitor Component */}
              <CameraMonitor
                showControls={true}
                showOverlays={true}
                onFaceDetectionUpdate={handleFaceDetectionUpdate}
              />

              {/* Additional info below camera */}
              <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="text-white/50">Face Detection</div>
                  <div className="mt-1 font-semibold text-white">
                    {faceData?.hasFace ? 'ACTIVE' : 'INACTIVE'}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="text-white/50">Landmarks</div>
                  <div className="mt-1 font-semibold text-white">
                    {faceData?.landmarks?.length || 0}
                  </div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
                  <div className="text-white/50">Confidence</div>
                  <div className="mt-1 font-semibold text-white">
                    {Math.round((faceData?.confidence || 0) * 100)}%
                  </div>
                </div>
              </div>
            </div>

            {/* Telemetry Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
              <MetricCard label="EAR" value={telemetry.ear.toFixed(2)} size="sm" />
              <MetricCard label="MAR" value={telemetry.mar.toFixed(2)} size="sm" />
              <MetricCard label="BLINK" value={telemetry.blinkRate} unit="/min" size="sm" />
              <MetricCard label="CLOSURE" value={telemetry.eyeClosure.toFixed(2)} unit="s" size="sm" />
              <MetricCard label="YAWNS" value={telemetry.yawning} size="sm" />
            </div>
          </div>

          {/* ================================================== */}
          {/* RIGHT SIDEBAR â€” State & Alerts                     */}
          {/* ================================================== */}

          <div className="space-y-6">

            {/* Driver State */}
            <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/70">
                Current State
              </h3>
              <div className="flex justify-center">
                <DriverStateIndicator
                  state={driverState.state}
                  confidence={driverState.confidence}
                  size="sm"
                />
              </div>
            </div>

            {/* Fatigue Risk */}
            <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-white/70">
                Fatigue Risk
              </h3>
              <div className="flex justify-center">
                <FatigueRiskGauge risk={fatigueRisk} size="sm" />
              </div>
            </div>

            {/* Active Alert */}
            {activeAlert ? (
              <div className={`rounded-xl border p-4 ${
                activeAlert.severity === 'CRITICAL'
                  ? 'border-red-500/30 bg-red-500/10'
                  : 'border-amber-500/30 bg-amber-500/10'
              }`}>
                <div className="flex items-start gap-2">
                  <AlertTriangle
                    size={18}
                    className={activeAlert.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}
                  />
                  <div className="flex-1">
                    <div className={`text-xs font-semibold ${
                      activeAlert.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {activeAlert.type}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/70">{activeAlert.message}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#07090E] p-4">
                <div className="flex items-center gap-2 text-xs text-white/50">
                  <div className="h-2 w-2 rounded-full bg-green-400" />
                  No active alerts
                </div>
              </div>
            )}

            {/* Processing Stats */}
            <div className="rounded-xl border border-white/10 bg-[#07090E] p-4">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/70">
                Processing
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/50">Face Detection</span>
                  <span className="font-mono text-white/70">12ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Landmarks</span>
                  <span className="font-mono text-white/70">8ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Features</span>
                  <span className="font-mono text-white/70">5ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Model Inference</span>
                  <span className="font-mono text-white/70">15ms</span>
                </div>
                <div className="mt-3 border-t border-white/10 pt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-white/70">Total Latency</span>
                    <span className="font-mono text-white">40ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scan line animation */}
      <style jsx>{`
        @keyframes scan-line {
          0% { transform: translateY(0); }
          100% { transform: translateY(600px); }
        }
        .animate-scan-line {
          animation: scan-line 3s linear infinite;
        }
      `}</style>
    </DashboardShell>
  );
}
