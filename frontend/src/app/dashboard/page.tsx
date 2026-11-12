"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock3, Eye, ShieldCheck } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import CameraMonitor from "@/components/dashboard/CameraMonitor";
import {
  AlertRecord,
  DetectionResult,
  DrivingSession,
  sessionAPI,
  alertAPI,
} from "@/services/api";

interface ChartSample {
  timestamp: string;
  has_face: boolean;
  fatigue_score: number | null;
}

export default function DashboardOverview() {
  const [sessions, setSessions] = useState<DrivingSession[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [samples, setSamples] = useState<ChartSample[]>([]);
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [monitoringSession, setMonitoringSession] = useState<DrivingSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([sessionAPI.getAll(), alertAPI.getAll()])
      .then(async ([sessionResponse, alertResponse]) => {
        if (!active) return;
        const sessionList = sessionResponse.data;
        setSessions(sessionList);
        setAlerts(alertResponse.data);
        const activeSessionRecord = sessionList.find(
          (session) => session.status === "ACTIVE"
        );
        setMonitoringSession(activeSessionRecord ?? null);
        const recent = sessionList[0];
        if (recent) {
          const summary = await sessionAPI.getSummary(recent.session_id);
          if (active) {
            setSamples(
              summary.data.samples.map((sample) => ({
                timestamp: sample.timestamp,
                has_face: sample.has_face,
                fatigue_score: sample.fatigue_score,
              }))
            );
          }
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Unable to load dashboard data."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const activeSession =
    monitoringSession?.status === "ACTIVE" ? monitoringSession : null;
  const totalMonitoringMs = sessions.reduce((total, session) => {
    const end = session.end_time
      ? new Date(session.end_time).getTime()
      : new Date(session.start_time).getTime();
    return total + Math.max(0, end - new Date(session.start_time).getTime());
  }, 0) + (activeSession ? elapsedSeconds * 1000 : 0);
  const chartPoints = useMemo(() => {
    const scored = samples.filter(
      (sample) => sample.has_face && sample.fatigue_score !== null
    );
    if (scored.length < 2) return "";
    return scored
      .map(
        (sample, index) =>
          `${(index / (scored.length - 1)) * 100},${100 - (sample.fatigue_score ?? 0)}`
      )
      .join(" ");
  }, [samples]);
  const latestSummary = samples.at(-1);
  const eventCount = (name: string) =>
    alerts.filter(
      (alert) =>
        alert.event.session.session_id === sessions[0]?.session_id &&
        alert.event.event_type.event_name === name
    ).length;

  return (
    <DashboardShell>
      <main className="min-h-screen space-y-6 p-4 pt-6 sm:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">
              Driver safety
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Monitoring overview</h1>
            <p className="mt-1 text-sm text-white/50">
              Live camera analysis and recorded session insights.
            </p>
          </div>
          <Link
            href="/dashboard/sessions"
            className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
          >
            Session history <ArrowRight size={15} />
          </Link>
        </header>

        {loadError && (
          <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-200">
            {loadError}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OverviewCard
            icon={<ShieldCheck size={17} />}
            label="Attention"
            value={detection?.attentionStatus ?? "No live signal"}
            accent={detection?.attentionStatus === "Inattentive" ? "amber" : "green"}
          />
          <OverviewCard
            icon={<Eye size={17} />}
            label="Eye aspect ratio"
            value={detection?.ear?.toFixed(3) ?? "—"}
          />
          <OverviewCard
            icon={<Clock3 size={17} />}
            label="Monitoring time"
            value={formatHours(totalMonitoringMs)}
          />
          <OverviewCard
            icon={<AlertTriangle size={17} />}
            label="Recorded alerts"
            value={loading ? "…" : alerts.length}
            accent={alerts.length > 0 ? "amber" : "green"}
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#080b10] p-4 sm:p-6">
          <CameraMonitor
            onDetectionUpdate={(result) => {
              setDetection(result);
              if (result?.hasFace && result.fatigueScore !== null) {
                setSamples((current) => [
                  ...current,
                  {
                    timestamp: result.timestamp,
                    has_face: true,
                    fatigue_score: result.fatigueScore,
                  },
                ].slice(-600));
              }
            }}
            onSessionChange={(session) => {
              if (session?.status === "ACTIVE") {
                setSamples([]);
                setElapsedSeconds(0);
              }
              setMonitoringSession(session);
              if (session) {
                setSessions((current) => [
                  session,
                  ...current.filter((item) => item.session_id !== session.session_id),
                ]);
              }
            }}
            onElapsedSeconds={setElapsedSeconds}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
          <div className="rounded-2xl border border-white/10 bg-[#080b10] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white">Recent signal risk</h2>
                <p className="mt-1 text-xs text-white/45">
                  Latest session samples · rule-based score, 0–100
                </p>
              </div>
              <Link
                href="/dashboard/analytics"
                className="text-xs text-white/65 hover:text-white"
              >
                Analytics
              </Link>
            </div>
            {chartPoints ? (
              <div className="mt-5 h-36 rounded-lg border border-white/5 bg-black/20 p-3">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="h-full w-full"
                  role="img"
                  aria-label="Fatigue signal score from recorded session samples"
                >
                  <line x1="0" y1="0" x2="100" y2="0" stroke="#ffffff12" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#ffffff12" />
                  <line x1="0" y1="100" x2="100" y2="100" stroke="#ffffff12" />
                  <polyline
                    points={chartPoints}
                    fill="none"
                    stroke="#9ca3af"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            ) : (
              <EmptyState
                text={
                  activeSession
                    ? "Recorded signal samples will appear as monitoring continues."
                    : "No recorded signal trend yet. Start monitoring to collect session data."
                }
              />
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#080b10] p-5">
            <h2 className="text-sm font-semibold text-white">Latest recorded session</h2>
            {loading ? (
              <div className="mt-4 h-24 animate-pulse rounded-lg bg-white/5" />
            ) : sessions.length === 0 ? (
              <EmptyState text="No monitoring sessions recorded yet." />
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/50">Session status</span>
                  <span className="text-white">{sessions[0].status}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/50">Started</span>
                  <span className="text-white">
                    {new Date(sessions[0].start_time).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/50">Avg. signal risk</span>
                  <span className="text-white">
                    {sessions[0].average_fatigue_score === null ||
                    sessions[0].average_fatigue_score === undefined
                      ? "—"
                      : `${Math.round(sessions[0].average_fatigue_score)}/100`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/50">Drowsiness / eye events</span>
                  <span className="text-white">{eventCount("EYE_CLOSURE")}</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-white/50">Yawn alerts</span>
                  <span className="text-white">{eventCount("YAWNING")}</span>
                </div>
              </div>
            )}
            {latestSummary && (
              <p className="mt-4 text-[11px] text-white/35">
                Latest sample: {new Date(latestSummary.timestamp).toLocaleTimeString()}
              </p>
            )}
          </div>
        </section>
      </main>
    </DashboardShell>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  accent = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: "neutral" | "green" | "amber";
}) {
  const accentClass =
    accent === "amber"
      ? "text-amber-300"
      : accent === "green"
        ? "text-white/70"
        : "text-white";
  return (
    <div className="rounded-xl border border-white/10 bg-[#080b10] p-4">
      <div className="flex items-center gap-2 text-xs text-white/45">
        <span className="text-white/65">{icon}</span>
        {label}
      </div>
      <p className={`mt-3 text-lg font-semibold ${accentClass}`}>{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-5 rounded-lg border border-dashed border-white/10 p-5 text-center text-xs text-white/40">
      {text}
    </div>
  );
}

function formatHours(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60000);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
