"use client";

import { useState } from "react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import {
  Monitor,
  Camera,
  Bell,
  Shield,
  User,
  Check,
  ChevronRight,
} from "lucide-react";

export default function SettingsPage() {
  const [monitoringEnabled, setMonitoringEnabled] = useState(true);
  const [autoStart, setAutoStart] = useState(true);
  const [audioAlerts, setAudioAlerts] = useState(true);
  const [visualAlerts, setVisualAlerts] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  return (
    <DashboardShell>
      <div className="min-h-screen p-6">

        {/* Page Header */}
        <div className="mb-6">
          <h1
            style={{ fontFamily: "'Orbitron', sans-serif" }}
            className="text-2xl font-bold tracking-tight text-white"
          >
            Settings
          </h1>
          <p className="mt-1 text-sm text-white/50">
            Configure monitoring, alerts, and system preferences
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">

          {/* Monitoring Settings */}
          <SettingsSection
            icon={<Monitor size={20} />}
            title="Monitoring"
            description="Control AI-powered driver monitoring"
          >
            <ToggleSetting
              label="Enable Monitoring"
              description="Activate real-time driver state detection"
              enabled={monitoringEnabled}
              onChange={setMonitoringEnabled}
            />
            <ToggleSetting
              label="Auto-start Monitoring"
              description="Automatically begin monitoring when session starts"
              enabled={autoStart}
              onChange={setAutoStart}
            />
            <SelectSetting
              label="Monitoring Mode"
              description="Choose detection sensitivity level"
              value="BALANCED"
              options={['RELAXED', 'BALANCED', 'STRICT']}
            />
            <SelectSetting
              label="Alert Sensitivity"
              description="Control when alerts are triggered"
              value="MEDIUM"
              options={['LOW', 'MEDIUM', 'HIGH']}
            />
          </SettingsSection>

          {/* Camera Settings */}
          <SettingsSection
            icon={<Camera size={20} />}
            title="Camera"
            description="Configure camera and video settings"
          >
            <SelectSetting
              label="Camera Device"
              description="Select camera input source"
              value="Default Camera"
              options={['Default Camera', 'Front Camera', 'External Camera']}
            />
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Camera Preview</div>
                  <div className="mt-1 text-xs text-white/40">View current camera feed</div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                  <span className="text-xs text-white/50">Connected</span>
                </div>
              </div>
              <div className="aspect-video overflow-hidden rounded-lg border border-white/10 bg-black">
                <div className="flex h-full items-center justify-center text-xs text-white/30">
                  Camera preview placeholder
                </div>
              </div>
            </div>
            <SelectSetting
              label="Resolution"
              description="Camera capture resolution"
              value="1280x720"
              options={['640x480', '1280x720', '1920x1080']}
            />
            <SelectSetting
              label="Frame Rate"
              description="Camera capture frame rate"
              value="30 FPS"
              options={['15 FPS', '30 FPS', '60 FPS']}
            />
          </SettingsSection>

          {/* Alert Settings */}
          <SettingsSection
            icon={<Bell size={20} />}
            title="Alerts"
            description="Manage alert notifications and behavior"
          >
            <ToggleSetting
              label="Audio Alerts"
              description="Play sound when alerts are triggered"
              enabled={audioAlerts}
              onChange={setAudioAlerts}
            />
            <ToggleSetting
              label="Visual Alerts"
              description="Display visual warnings on screen"
              enabled={visualAlerts}
              onChange={setVisualAlerts}
            />
            <SelectSetting
              label="Alert Volume"
              description="Audio alert volume level"
              value="MEDIUM"
              options={['LOW', 'MEDIUM', 'HIGH']}
            />
            <SelectSetting
              label="Alert Threshold"
              description="Fatigue level that triggers alerts"
              value="MODERATE"
              options={['LOW', 'MODERATE', 'HIGH', 'CRITICAL']}
            />
          </SettingsSection>

          {/* Privacy Settings */}
          <SettingsSection
            icon={<Shield size={20} />}
            title="Privacy"
            description="Data storage and privacy controls"
          >
            <InfoRow
              label="Camera Permission"
              value="Granted"
              status="success"
            />
            <InfoRow
              label="Recording Status"
              value="Not Recording"
              status="neutral"
            />
            <InfoRow
              label="Data Storage"
              value="Local Only"
              status="neutral"
            />
            <SelectSetting
              label="Session Retention"
              description="How long to keep session data"
              value="7 Days"
              options={['1 Day', '7 Days', '30 Days', 'Forever']}
            />
          </SettingsSection>

          {/* Appearance Settings */}
          <SettingsSection
            icon={<Monitor size={20} />}
            title="Appearance"
            description="Customize interface display preferences"
          >
            <ToggleSetting
              label="Reduced Motion"
              description="Minimize animations and transitions"
              enabled={reducedMotion}
              onChange={setReducedMotion}
            />
            <SelectSetting
              label="Interface Density"
              description="Control information density"
              value="COMFORTABLE"
              options={['COMPACT', 'COMFORTABLE', 'SPACIOUS']}
            />
          </SettingsSection>

          {/* Account Settings */}
          <SettingsSection
            icon={<User size={20} />}
            title="Account"
            description="Manage account and profile settings"
          >
            <ButtonRow
              label="Profile"
              description="Update your profile information"
              action="Edit Profile"
            />
            <ButtonRow
              label="Preferences"
              description="Manage account preferences"
              action="Manage"
            />
            <ButtonRow
              label="Session History"
              description="View all previous sessions"
              action="View History"
            />
            <div className="border-t border-white/10 pt-4">
              <button className="flex w-full items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/20">
                <span>Sign Out</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </SettingsSection>
        </div>
      </div>
    </DashboardShell>
  );
}

function SettingsSection({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#07090E] p-6">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-white/70">
          {icon}
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">{title}</h2>
          <p className="mt-1 text-xs text-white/40">{description}</p>
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="mt-1 text-xs text-white/40">{description}</div>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative h-6 w-11 rounded-full transition ${
          enabled ? 'bg-green-500' : 'bg-white/20'
        }`}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            enabled ? 'left-5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function SelectSetting({
  label,
  description,
  value,
  options,
}: {
  label: string;
  description: string;
  value: string;
  options: string[];
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="mb-2">
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="mt-1 text-xs text-white/40">{description}</div>
      </div>
      <select
        className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white transition hover:border-white/20 focus:border-white/30 focus:outline-none"
        defaultValue={value}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoRow({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status: 'success' | 'neutral' | 'warning';
}) {
  const statusColors = {
    success: 'text-green-400',
    neutral: 'text-white/70',
    warning: 'text-amber-400',
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div className="text-sm font-medium text-white">{label}</div>
      <div className={`flex items-center gap-2 text-sm ${statusColors[status]}`}>
        {status === 'success' && <Check size={16} />}
        <span>{value}</span>
      </div>
    </div>
  );
}

function ButtonRow({
  label,
  description,
  action,
}: {
  label: string;
  description: string;
  action: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <div>
        <div className="text-sm font-medium text-white">{label}</div>
        <div className="mt-1 text-xs text-white/40">{description}</div>
      </div>
      <button className="flex items-center gap-2 rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/[0.05] hover:text-white">
        {action}
        <ChevronRight size={14} />
      </button>
    </div>
  );
}
