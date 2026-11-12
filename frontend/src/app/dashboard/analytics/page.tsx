"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, Clock3, Eye, LoaderCircle } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { DetectionSample, DrivingSession, SessionSummary, sessionAPI } from "@/services/api";

const EMPTY_SAMPLES: DetectionSample[] = [];

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<DrivingSession[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectSession = (sessionId: string) => {
    if (sessionId === selectedId) return;
    setSummary(null);
    setLoadingSummary(true);
    setErrorMessage("");
    setSelectedId(sessionId);
  };

  useEffect(() => {
    let active = true;
    sessionAPI
      .getAll()
      .then(({ data }) => {
        if (!active) return;
        setSessions(data);
        const preferred = data.find((session) => session.status === "ACTIVE") ?? data[0];
        if (preferred) setLoadingSummary(true);
        setSelectedId(preferred ? String(preferred.session_id) : "");
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load sessions.");
        }

      })
      .finally(() => {
        if (active) setLoadingSessions(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    sessionAPI
      .getSummary(Number(selectedId))
      .then(({ data }) => {
        if (active) setSummary(data);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load analytics.");
        }
      })
      .finally(() => {
        if (active) setLoadingSummary(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  const samples = summary?.samples ?? EMPTY_SAMPLES;
  const fatigueSeries = useMemo(
    () => samples.filter((sample) => sample.has_face && sample.fatigue_score !== null),
    [samples]
  );
  const earSeries = useMemo(
    () => samples.filter((sample) => sample.has_face && sample.ear !== null),
    [samples]
  );
  const attentionEntries = Object.entries(summary?.metrics.attention_distribution ?? {});

  return (
    <DashboardShell>
      <main className="min-h-screen space-y-6 p-4 pt-6 sm:p-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">
              Session insights
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Real-time analytics</h1>
            <p className="mt-1 text-sm text-white/50">
              Charts and event counts are calculated from persisted model detections.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-white/50">
              Session
              <select
                value={selectedId}
                onChange={(event) => selectSession(event.target.value)}
                disabled={loadingSessions || sessions.length === 0}
                className="ml-2 min-w-48 rounded-lg border border-white/10 bg-[#0b0e14] px-3 py-2 text-sm text-white"
              >
                {sessions.map((session) => (
                  <option key={session.session_id} value={session.session_id}>
                    #{session.session_id} · {session.status} ·{" "}
                    {new Date(session.start_time).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </label>
            <Link href="/dashboard/sessions" className="text-sm text-white/55 hover:text-white">
              Sessions
            </Link>
          </div>
        </header>

        {errorMessage && (
          <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-200">
            {errorMessage}
          </p>
        )}

        {loadingSessions ? (
          <LoadingState />
        ) : sessions.length === 0 ? (
          <EmptyState text="No sessions yet. Start monitoring to collect real detection data." />
        ) : loadingSummary ? (
          <LoadingState />
        ) : summary ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                icon={<Activity size={17} />}
                label="Avg. signal risk"
                value={formatScore(summary.metrics.average_fatigue_score)}
              />
              <SummaryCard
                icon={<AlertTriangle size={17} />}
                label="Peak signal risk"
                value={formatScore(summary.metrics.maximum_fatigue_score)}
              />
              <SummaryCard
                icon={<Eye size={17} />}
                label="Average EAR"
                value={summary.metrics.average_ear?.toFixed(3) ?? "—"}
              />
              <SummaryCard
                icon={<Clock3 size={17} />}
                label="Session duration"
                value={formatDuration(summary.session.duration_ms)}
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <SignalChart
                title="Signal risk over time"
                subtitle="Rule-based score · 0–100"
                samples={fatigueSeries}
                getValue={(sample) => sample.fatigue_score}
                maximum={100}
                color="#fbbf24"
                emptyText="No face detections with a signal score have been recorded."
              />
              <SignalChart
                title="Eye aspect ratio"
                subtitle="Lower EAR values indicate a more closed eye shape."
                samples={earSeries}
                getValue={(sample) => sample.ear}
                maximum={0.6}
                color="#22d3ee"
                emptyText="No EAR measurements have been recorded."
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <EventFrequencyChart
                title="Drowsiness events over time"
                events={summary.events.filter((event) =>
                  ["EYE_CLOSURE", "DROWSINESS"].includes(event.event_type.event_name)
                )}
                samples={samples}
                color="#fb7185"
              />
              <EventFrequencyChart
                title="Yawn frequency"
                events={summary.events.filter(
                  (event) => event.event_type.event_name === "YAWNING"
                )}
                samples={samples}
                color="#fbbf24"
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#080b10] p-5">
                <h2 className="text-sm font-semibold text-white">Attention distribution</h2>
                <p className="mt-1 text-xs text-white/45">Recorded face-detection samples</p>
                <div className="mt-5 space-y-4">
                  {attentionEntries.length === 0 ? (
                    <EmptyState text="No attention samples recorded." />
                  ) : (
                    attentionEntries.map(([status, count]) => {
                      const total = attentionEntries.reduce((sum, item) => sum + item[1], 0);
                      const percent = total ? (count / total) * 100 : 0;
                      return (
                        <div key={status}>
                          <div className="mb-1.5 flex justify-between text-xs">
                            <span className="text-white/65">{status}</span>
                            <span className="text-white/45">{count} samples</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full rounded-full ${
                                status === "Inattentive" ? "bg-amber-400" : "bg-white/55"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#080b10] p-5">
                <h2 className="text-sm font-semibold text-white">Detection events</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <EventCount label="Prolonged eye closure" value={summary.metrics.event_counts.EYE_CLOSURE ?? 0} />
                  <EventCount label="Sustained yawns" value={summary.metrics.event_counts.YAWNING ?? 0} />
                  <EventCount label="Head-pose distraction" value={summary.metrics.event_counts.DISTRACTION ?? 0} />
                  <EventCount label="Alerts" value={summary.metrics.alert_count} />
                </div>
                <p className="mt-4 text-xs leading-relaxed text-white/40">
                  Head-pose warnings use the implemented face-landmark pose estimate. No event is
                  reported unless its configured duration threshold is crossed.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[#080b10] p-5">
              <h2 className="text-sm font-semibold text-white">Session event log</h2>
              {summary.events.length === 0 ? (
                <EmptyState text="No fatigue or attention events were recorded in this session." />
              ) : (
                <div className="mt-4 divide-y divide-white/5">
                  {summary.events.map((event) => (
                    <div
                      key={event.event_id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-white/80">
                          {event.event_type.event_name.replaceAll("_", " ")}
                        </p>
                        <p className="mt-1 text-xs text-white/40">
                          {event.alerts[0]?.message ?? event.severity}
                        </p>
                      </div>
                      <time className="text-xs text-white/45">
                        {new Date(event.timestamp).toLocaleString()}
                      </time>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : null}
      </main>
    </DashboardShell>
  );
}

function SignalChart({
  title,
  subtitle,
  samples,
  getValue,
  maximum,
  color,
  emptyText,
}: {
  title: string;
  subtitle: string;
  samples: DetectionSample[];
  getValue: (sample: DetectionSample) => number | null;
  maximum: number;
  color: string;
  emptyText: string;
}) {
  const values = samples.map(getValue).filter((value): value is number => value !== null);
  const points = values
    .map((value, index) => {
      const x = values.length > 1 ? (index / (values.length - 1)) * 100 : 50;
      const y = 100 - Math.max(0, Math.min(100, (value / maximum) * 100));
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-white/10 bg-[#080b10] p-5">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <p className="mt-1 text-xs text-white/45">{subtitle}</p>
      {points ? (
        <div className="mt-5 h-48 rounded-lg border border-white/5 bg-black/20 p-3">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="h-full w-full"
            role="img"
            aria-label={title}
          >
            {[0, 25, 50, 75, 100].map((value) => (
              <line
                key={value}
                x1="0"
                x2="100"
                y1={value}
                y2={value}
                stroke="#ffffff12"
              />
            ))}
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      ) : (
        <EmptyState text={emptyText} />
      )}
      <p className="mt-3 text-[11px] text-white/35">
        {values.length} recorded samples · oldest first
      </p>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#080b10] p-4">
      <div className="flex items-center gap-2 text-xs text-white/45">
        <span className="text-white/65">{icon}</span>
        {label}
      </div>
      <p className="mt-3 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function EventCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <p className="text-xs text-white/45">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function EventFrequencyChart({
  title,
  events,
  samples,
  color,
}: {
  title: string;
  events: SessionSummary["events"];
  samples: DetectionSample[];
  color: string;
}) {
  const sampleTimes = samples.map((sample) => new Date(sample.timestamp).getTime());
  const eventTimes = events.map((event) => new Date(event.timestamp).getTime());
  const timestamps = [...sampleTimes, ...eventTimes];
  if (timestamps.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-[#080b10] p-5">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <EmptyState text="No session data is available for this timeline." />
      </div>
    );
  }

  const start = Math.min(...timestamps);
  const end = Math.max(...timestamps);
  const span = Math.max(1, end - start);
  const bucketCount = 8;
  const counts = Array.from({ length: bucketCount }, () => 0);
  events.forEach((event) => {
    const time = new Date(event.timestamp).getTime();
    const bucket = Math.min(
      bucketCount - 1,
      Math.floor(((time - start) / span) * bucketCount)
    );
    counts[bucket] += 1;
  });
  const maxCount = Math.max(1, ...counts);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#080b10] p-5">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <p className="mt-1 text-xs text-white/45">{events.length} recorded events</p>
      <div className="mt-5 flex h-36 items-end gap-2 rounded-lg border border-white/5 bg-black/20 px-3 pt-3">
        {counts.map((count, index) => (
          <div
            key={index}
            className="flex h-full flex-1 items-end"
            title={`${count} events`}
          >
            <div
              className="w-full rounded-t-sm"
              style={{
                height: `${Math.max(count === 0 ? 2 : 8, (count / maxCount) * 100)}%`,
                backgroundColor: color,
                opacity: count === 0 ? 0.15 : 0.8,
              }}
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-white/35">
        Session start → end · 8 equal time intervals
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-white/50">
      <LoaderCircle className="animate-spin" size={18} />
      Loading recorded analytics…
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-white/10 p-5 text-center text-xs text-white/40">
      {text}
    </div>
  );
}

function formatScore(value: number | null) {
  return value === null ? "—" : `${Math.round(value)}/100`;
}

function formatDuration(milliseconds: number) {
  const totalMinutes = Math.floor(milliseconds / 60000);
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}
