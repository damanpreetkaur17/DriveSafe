"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, CircleHelp, Database, LoaderCircle, ShieldCheck, Wifi, WifiOff } from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { monitoringAPI } from "@/services/api";

type ServiceStatus = "checking" | "ready" | "unavailable";

export default function SettingsPage() {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>("checking");
  const [serviceError, setServiceError] = useState("");

  useEffect(() => {
    let active = true;
    monitoringAPI
      .check()
      .then(() => {
        if (active) setServiceStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setServiceStatus("unavailable");
        setServiceError(
          error instanceof Error ? error.message : "The ML service is unavailable."
        );
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <DashboardShell>
      <main className="min-h-screen space-y-6 p-4 pt-6 sm:p-6">
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/60">
            Configuration and privacy
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Monitoring settings</h1>
          <p className="mt-1 text-sm text-white/50">
            Camera access is requested only when you explicitly start a session.
          </p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-[#080b10] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white/5 p-2 text-white/65">
              <Wifi size={18} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-white">ML service connection</h2>
              <p className="mt-1 text-xs text-white/45">
                Authenticated health check through the DriveSafe backend.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm">
                {serviceStatus === "checking" ? (
                  <LoaderCircle className="animate-spin text-white/50" size={16} />
                ) : serviceStatus === "ready" ? (
                  <ShieldCheck className="text-white/65" size={16} />
                ) : (
                  <WifiOff className="text-amber-300" size={16} />
                )}
                <span className="text-white/65">
                  {serviceStatus === "checking"
                    ? "Checking…"
                    : serviceStatus === "ready"
                      ? "Ready"
                      : "Unavailable"}
                </span>
              </div>
              {serviceError && (
                <p role="status" className="mt-2 text-xs text-amber-200">
                  {serviceError}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <InfoCard
            icon={<Camera size={18} />}
            title="Camera and processing"
            items={[
              "Your browser asks for camera permission when you start monitoring.",
              "You can select an available camera in the live monitor after permission is granted.",
              "Frames are sent to the configured backend and ML service for live inference; raw frames are not persisted.",
            ]}
            href="/dashboard/live"
            action="Open live monitor"
          />
          <InfoCard
            icon={<Database size={18} />}
            title="Stored session data"
            items={[
              "Session start and end times are stored with your account.",
              "Detection samples are saved at most once per second, along with threshold-based events and alerts.",
              "Metrics are available only to the authenticated session owner.",
            ]}
            href="/dashboard/sessions"
            action="Review session history"
          />
        </section>

        <section className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-start gap-3">
            <CircleHelp className="mt-0.5 text-white/45" size={17} />
            <div>
              <h2 className="text-sm font-medium text-white">Detection notes</h2>
              <p className="mt-2 text-xs leading-relaxed text-white/45">
                This project uses its checked-in MediaPipe FaceLandmarker resource for eye aspect
                ratio, mouth opening, and head-pose estimates. The displayed signal risk score is
                a transparent rule-based indicator, not a trained drowsiness probability. Detection
                is intended as an assistive signal and is not a substitute for safe driving.
              </p>
            </div>
          </div>
        </section>
      </main>
    </DashboardShell>
  );
}

function InfoCard({
  icon,
  title,
  items,
  href,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  href: string;
  action: string;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#080b10] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <span className="text-white/65">{icon}</span>
        {title}
      </div>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-relaxed text-white/50">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-white/40" />
            {item}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className="mt-5 inline-flex rounded-lg border border-white/10 px-3 py-2 text-xs text-white/65 hover:text-white"
      >
        {action}
      </Link>
    </section>
  );
}
