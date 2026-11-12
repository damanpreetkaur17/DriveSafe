"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Bell, CheckCircle2, LoaderCircle } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { AlertRecord, alertAPI } from "@/services/api";

type SeverityFilter = "ALL" | "WARNING" | "CRITICAL";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [filter, setFilter] = useState<SeverityFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    alertAPI
      .getAll()
      .then(({ data }) => {
        if (active) setAlerts(data);
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "Unable to load alerts.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredAlerts = useMemo(
    () =>
      alerts.filter(
        (alert) =>
          filter === "ALL" || alert.event.severity.toUpperCase() === filter
      ),
    [alerts, filter]
  );
  const activeCount = alerts.filter((alert) => alert.status === "ACTIVE").length;

  return (
    <DashboardShell>
      <main className="min-h-screen space-y-6 p-4 pt-6 sm:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">
              Events from model thresholds
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Alerts and events</h1>
            <p className="mt-1 text-sm text-white/50">
              Only alerts created from persisted detection events are shown.
            </p>
          </div>
          <Link href="/dashboard/sessions" className="text-sm text-white/55 hover:text-white">
            Session history
          </Link>
        </header>

        {errorMessage && (
          <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-200">
            {errorMessage}
          </p>
        )}

        <section className="grid gap-3 sm:grid-cols-3">
          <Summary label="Total alerts" value={loading ? "…" : alerts.length} />
          <Summary label="Active" value={loading ? "…" : activeCount} warning={activeCount > 0} />
          <Summary
            label="Critical"
            value={
              loading
                ? "…"
                : alerts.filter((alert) => alert.event.severity.toUpperCase() === "CRITICAL").length
            }
            warning
          />
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#080b10] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Bell size={16} className="text-white/65" />
              Alert history
            </div>
            <div className="flex gap-2">
              {(["ALL", "WARNING", "CRITICAL"] as const).map((severity) => (
                <button
                  type="button"
                  key={severity}
                  onClick={() => setFilter(severity)}
                  aria-pressed={filter === severity}
                  className={`rounded-md px-3 py-1.5 text-xs ${
                    filter === severity
                      ? "bg-white/10 text-white"
                      : "text-white/45 hover:text-white/80"
                  }`}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-white/45">
              <LoaderCircle className="animate-spin" size={16} />
              Loading alerts…
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-white/10 p-8 text-center">
              <CheckCircle2 className="mx-auto text-white/65" size={24} />
              <p className="mt-3 text-sm text-white/70">No alerts to show.</p>
              <p className="mt-1 text-xs text-white/40">
                Events will appear here when the model detects a sustained risk signal.
              </p>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-white/5">
              {filteredAlerts.map((alert) => (
                <article key={alert.alert_id} className="flex gap-3 py-4">
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      alert.event.severity.toUpperCase() === "CRITICAL"
                        ? "bg-red-500/10 text-red-300"
                        : "bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    <AlertTriangle size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-medium text-white">{alert.message}</h2>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-white/55">
                        {alert.event.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-white/45">
                      {alert.event.event_type.event_name.replaceAll("_", " ")} · Session #
                      {alert.event.session.session_id}
                    </p>
                    <time className="mt-2 block text-[11px] text-white/35">
                      {new Date(alert.event.timestamp).toLocaleString()}
                    </time>
                  </div>
                  <span className="self-start text-[10px] text-white/35">{alert.status}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </DashboardShell>
  );
}

function Summary({
  label,
  value,
  warning = false,
}: {
  label: string;
  value: number | string;
  warning?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#080b10] p-4">
      <p className="text-xs text-white/45">{label}</p>
      <p className={`mt-2 text-xl font-semibold ${warning ? "text-amber-300" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
