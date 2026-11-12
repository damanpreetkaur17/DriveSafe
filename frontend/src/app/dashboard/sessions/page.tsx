"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, CalendarClock, Download, LoaderCircle } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { DrivingSession, SessionSummary, sessionAPI } from "@/services/api";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<DrivingSession[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    sessionAPI
      .getAll()
      .then(({ data }) => {
        if (active) setSessions(data);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load sessions.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (selectedId === null) return;
    let active = true;
    sessionAPI
      .getSummary(selectedId)
      .then(({ data }) => {
        if (active) setSummary(data);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load session details.");
        }
      })
      .finally(() => {
        if (active) setDetailsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedId]);

  const openSession = (sessionId: number) => {
    if (sessionId === selectedId) return;
    setSummary(null);
    setDetailsLoading(true);
    setErrorMessage("");
    setSelectedId(sessionId);
  };

  return (
    <DashboardShell>
      <main className="min-h-screen space-y-6 p-4 pt-6 sm:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">
              History and reports
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Monitoring sessions</h1>
            <p className="mt-1 text-sm text-white/50">
              Review persisted session metrics and export a session report.
            </p>
          </div>
          <Link href="/dashboard/live" className="text-sm text-white/65 hover:text-white">
            Start a session
          </Link>
        </header>

        {errorMessage && (
          <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-200">
            {errorMessage}
          </p>
        )}

        {loading ? (
          <LoadingState />
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
            <CalendarClock className="mx-auto text-white/30" size={28} />
            <p className="mt-3 text-sm text-white/70">No monitoring sessions yet.</p>
            <p className="mt-1 text-xs text-white/40">
              Start monitoring to save detection data and build your history.
            </p>
          </div>
        ) : (
          <section className="space-y-3">
            {sessions.map((session) => (
              <button
                type="button"
                key={session.session_id}
                onClick={() => openSession(session.session_id)}
                className="w-full rounded-xl border border-white/10 bg-[#080b10] p-4 text-left transition hover:border-white/20 sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-white">
                        Session #{session.session_id}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          session.status === "ACTIVE"
                            ? "bg-white/5 text-white/70"
                            : session.status === "INTERRUPTED"
                              ? "bg-amber-500/10 text-amber-300"
                              : "bg-white/5 text-white/50"
                        }`}
                      >
                        {session.status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/40">
                      {new Date(session.start_time).toLocaleString()}
                      {session.vehicle
                        ? ` · ${session.vehicle.make} ${session.vehicle.model}`
                        : ""}
                    </p>
                  </div>
                  <span className="text-xs text-white/40">
                    Open session details
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <SessionMetric
                    label="Duration"
                    value={formatMilliseconds(session.duration_ms ?? 0)}
                  />
                  <SessionMetric
                    label="Alerts"
                    value={String(session.alert_count ?? 0)}
                    icon={<AlertTriangle size={13} />}
                  />
                  <SessionMetric
                    label="Avg. signal risk"
                    value={formatScore(session.average_fatigue_score)}
                    icon={<Activity size={13} />}
                  />
                  <SessionMetric
                    label="Drowsiness / eye events"
                    value={String(session.event_counts?.EYE_CLOSURE ?? 0)}
                  />
                </div>
                <p className="mt-3 text-[11px] text-white/35">
                  {session.event_counts?.YAWNING ?? 0} sustained yawn events ·{" "}
                  {session._count?.detection_samples ?? 0} saved telemetry samples
                </p>
              </button>
            ))}
          </section>
        )}

        {selectedId !== null && (
          <div
            role="presentation"
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setSelectedId(null);
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="session-report-title"
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#080b10] p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="session-report-title" className="text-lg font-semibold text-white">
                    Session #{selectedId} report
                  </h2>
                  {summary && (
                    <p className="mt-1 text-xs text-white/45">
                      {new Date(summary.session.start_time).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {summary && (
                    <button
                      type="button"
                      onClick={() => exportReport(summary)}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/70 hover:text-white"
                    >
                      <Download size={14} /> Export CSV
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSummary(null);
                      setSelectedId(null);
                    }}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              </div>

              {detailsLoading ? (
                <LoadingState />
              ) : summary ? (
                <>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <SessionMetric label="Duration" value={formatMilliseconds(summary.session.duration_ms)} />
                    <SessionMetric label="Alerts" value={String(summary.metrics.alert_count)} />
                    <SessionMetric
                      label="Avg. signal risk"
                      value={formatScore(summary.metrics.average_fatigue_score)}
                    />
                    <SessionMetric label="Avg. EAR" value={summary.metrics.average_ear?.toFixed(3) ?? "—"} />
                  </div>
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-white">Recorded events</h3>
                    {summary.events.length === 0 ? (
                      <p className="mt-3 text-xs text-white/40">No detection events were recorded.</p>
                    ) : (
                      <ul className="mt-3 divide-y divide-white/5">
                        {summary.events.map((event) => (
                          <li key={event.event_id} className="flex justify-between gap-3 py-3 text-xs">
                            <span className="text-white/70">
                              {event.alerts[0]?.message ?? event.event_type.event_name}
                            </span>
                            <time className="shrink-0 text-white/40">
                              {new Date(event.timestamp).toLocaleString()}
                            </time>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              ) : (
                <p className="mt-6 text-sm text-white/50">Session summary is unavailable.</p>
              )}
            </section>
          </div>
        )}
      </main>
    </DashboardShell>
  );
}

function SessionMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <p className="flex items-center gap-1.5 text-[11px] text-white/40">
        {icon}
        {label}
      </p>
      <p className="mt-1.5 text-sm font-medium text-white">{value}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-white/45">
      <LoaderCircle className="animate-spin" size={16} />
      Loading…
    </div>
  );
}

function formatMilliseconds(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60000);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

function formatScore(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${Math.round(value)}/100`;
}

function exportReport(summary: SessionSummary) {
  const rows = [
    ["Metric", "Value"],
    ["Session ID", summary.session.session_id],
    ["Status", summary.session.status],
    ["Start time", summary.session.start_time],
    ["End time", summary.session.end_time ?? "In progress"],
    ["Duration (ms)", summary.session.duration_ms],
    ["Average signal risk", summary.metrics.average_fatigue_score ?? "—"],
    ["Maximum signal risk", summary.metrics.maximum_fatigue_score ?? "—"],
    ["Average EAR", summary.metrics.average_ear ?? "—"],
    ["Alerts", summary.metrics.alert_count],
    ...summary.events.map((event) => [
      `Event: ${event.event_type.event_name}`,
      `${event.timestamp} ${event.alerts[0]?.message ?? event.severity}`,
    ]),
  ];
  const csv = rows
    .map((row) =>
      row
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `driver-monitoring-session-${summary.session.session_id}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
