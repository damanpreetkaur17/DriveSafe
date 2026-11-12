"use client";

import Link from "next/link";
import { ArrowLeft, FileClock } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import CameraMonitor from "@/components/dashboard/CameraMonitor";

export default function LiveMonitorPage() {
  return (
    <DashboardShell>
      <main className="min-h-screen space-y-6 p-4 pt-6 sm:p-6">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-1.5 text-xs text-white/45 hover:text-white"
            >
              <ArrowLeft size={14} /> Overview
            </Link>
            <h1 className="text-2xl font-semibold text-white">Live monitoring</h1>
            <p className="mt-1 text-sm text-white/50">
              Real-time eye, yawn, and head-pose signals from the selected camera.
            </p>
          </div>
          <Link
            href="/dashboard/sessions"
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-white/60 hover:text-white"
          >
            <FileClock size={15} /> Session history
          </Link>
        </header>

        <section className="rounded-2xl border border-white/10 bg-[#080b10] p-4 sm:p-6">
          <CameraMonitor />
        </section>
      </main>
    </DashboardShell>
  );
}
