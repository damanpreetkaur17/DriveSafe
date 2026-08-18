"use client";

import { useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import Link from "next/link";
import { getActiveAlert, getAlertHistory, Alert } from "@/lib/mockData";
import { AlertTriangle, Bell, CheckCircle, Clock, Filter } from "lucide-react";

type FilterType = 'ALL' | 'WARNING' | 'CRITICAL' | 'ACKNOWLEDGED';

export default function AlertsPage() {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const activeAlert = getActiveAlert();
  const alertHistory = getAlertHistory();

  const filteredAlerts = alertHistory.filter((alert) => {
    if (filter === 'ALL') return true;
    if (filter === 'WARNING') return alert.severity === 'WARNING';
    if (filter === 'CRITICAL') return alert.severity === 'CRITICAL';
    if (filter === 'ACKNOWLEDGED') return alert.acknowledged;
    return true;
  });

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
              Safety Alerts
            </h1>
            <p className="mt-1 text-sm text-white/50">
              Monitor and manage driver safety events
            </p>
          </div>

          {/* Quick nav */}
          <Link
            href="/dashboard"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 transition hover:border-white/20 hover:text-white"
          >
            <span style={{ fontFamily: "'Rajdhani', sans-serif" }} className="text-[10px] font-semibold uppercase tracking-wider">
              Overview
            </span>
          </Link>
        </div>

        {/* Active Alert Section */}
        {activeAlert ? (
          <div className="mb-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/70">
              <Bell size={16} />
              Active Alert
            </div>
            <AlertCard alert={activeAlert} active />
          </div>
        ) : (
          <div className="mb-6 rounded-xl border border-white/10 bg-[#07090E] p-6">
            <div className="flex items-center gap-3 text-sm text-white/50">
              <CheckCircle size={20} className="text-green-400" />
              <div>
                <div className="font-semibold text-white/70">No Active Alerts</div>
                <div className="mt-1 text-xs text-white/40">All systems operating normally</div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Filter size={16} />
            <span>Filter:</span>
          </div>
          <FilterButton
            label="ALL"
            active={filter === 'ALL'}
            onClick={() => setFilter('ALL')}
            count={alertHistory.length}
          />
          <FilterButton
            label="WARNING"
            active={filter === 'WARNING'}
            onClick={() => setFilter('WARNING')}
            count={alertHistory.filter((a) => a.severity === 'WARNING').length}
          />
          <FilterButton
            label="CRITICAL"
            active={filter === 'CRITICAL'}
            onClick={() => setFilter('CRITICAL')}
            count={alertHistory.filter((a) => a.severity === 'CRITICAL').length}
          />
          <FilterButton
            label="ACKNOWLEDGED"
            active={filter === 'ACKNOWLEDGED'}
            onClick={() => setFilter('ACKNOWLEDGED')}
            count={alertHistory.filter((a) => a.acknowledged).length}
          />
        </div>

        {/* Alert History */}
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/70">
            <Clock size={16} />
            Alert History
          </div>

          {filteredAlerts.length > 0 ? (
            <div className="space-y-3">
              {filteredAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-[#07090E] p-8 text-center">
              <div className="text-sm text-white/40">No alerts match the selected filter</div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function AlertCard({ alert, active = false }: { alert: Alert; active?: boolean }) {
  const isCritical = alert.severity === 'CRITICAL';

  return (
    <div
      className={`rounded-xl border p-5 transition ${
        isCritical
          ? 'border-red-500/30 bg-red-500/10'
          : 'border-amber-500/30 bg-amber-500/10'
      } ${active ? 'ring-2 ring-white/20' : ''}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            isCritical ? 'bg-red-500/20' : 'bg-amber-500/20'
          }`}
        >
          <AlertTriangle
            size={20}
            className={isCritical ? 'text-red-400' : 'text-amber-400'}
          />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h3
                  className={`text-sm font-bold ${
                    isCritical ? 'text-red-400' : 'text-amber-400'
                  }`}
                >
                  {alert.type}
                </h3>
                {active && (
                  <span className="flex items-center gap-1.5 text-xs text-white/50">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-50" />
                      <span className="relative h-2 w-2 rounded-full bg-red-400" />
                    </span>
                    ACTIVE
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{alert.message}</p>
            </div>

            {/* Severity Badge */}
            <div
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                isCritical
                  ? 'border-red-500/50 bg-red-500/20 text-red-300'
                  : 'border-amber-500/50 bg-amber-500/20 text-amber-300'
              }`}
            >
              {alert.severity}
            </div>
          </div>

          {/* Metrics & Time */}
          <div className="mt-4 flex items-center gap-6 text-xs">
            {alert.metric && (
              <div className="flex items-center gap-2">
                <span className="text-white/40">Metric:</span>
                <span className="font-mono text-white/70">{alert.metric}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock size={12} className="text-white/40" />
              <span className="text-white/50">
                {new Date(alert.timestamp).toLocaleString()}
              </span>
            </div>
            {alert.acknowledged && (
              <div className="flex items-center gap-1.5 text-green-400">
                <CheckCircle size={12} />
                <span>Acknowledged</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {!alert.acknowledged && (
            <div className="mt-4 flex gap-2">
              <button className="rounded-lg border border-white/20 bg-white/[0.05] px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white">
                Acknowledge
              </button>
              <button className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-white/50 transition hover:bg-white/[0.03] hover:text-white/70">
                View Details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
  count,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg border px-4 py-2 text-xs font-medium transition ${
        active
          ? 'border-white/30 bg-white/[0.08] text-white'
          : 'border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.04] hover:text-white/70'
      }`}
    >
      {label}
      <span className="ml-2 opacity-50">({count})</span>
    </button>
  );
}
