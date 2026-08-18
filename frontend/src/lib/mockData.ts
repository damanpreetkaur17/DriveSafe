// ============================================================
// DRIVESAFE MOCK DATA ARCHITECTURE
// ============================================================
// Centralized demo/mock data for the DriveSafe dashboard
// This data simulates the eventual backend/AI model outputs
// ============================================================

export type DriverState = 'ALERT' | 'DROWSY' | 'FATIGUED';
export type AlertSeverity = 'WARNING' | 'CRITICAL';
export type PipelineStage = 'CAMERA' | 'FACE' | 'LANDMARKS' | 'FEATURES' | 'MODEL' | 'ALERT';

// ============================================================
// CURRENT DRIVER STATE
// ============================================================

export interface CurrentDriverState {
  state: DriverState;
  confidence: number; // 0-1
  timestamp: Date;
}

export const getCurrentDriverState = (): CurrentDriverState => ({
  state: 'ALERT',
  confidence: 0.94,
  timestamp: new Date(),
});

// ============================================================
// FATIGUE RISK
// ============================================================

export interface FatigueRisk {
  level: number; // 0-100
  trend: 'STABLE' | 'INCREASING' | 'DECREASING';
  band: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

export const getFatigueRisk = (): FatigueRisk => ({
  level: 23,
  trend: 'STABLE',
  band: 'LOW',
});

// ============================================================
// LIVE TELEMETRY
// ============================================================

export interface Telemetry {
  ear: number; // Eye Aspect Ratio
  mar: number; // Mouth Aspect Ratio
  blinkRate: number; // blinks per minute
  eyeClosure: number; // seconds
  yawning: number; // count
}

export const getLiveTelemetry = (): Telemetry => ({
  ear: 0.30,
  mar: 0.12,
  blinkRate: 15,
  eyeClosure: 0.16,
  yawning: 1,
});

// ============================================================
// TELEMETRY HISTORY (for sparklines)
// ============================================================

export const getTelemetryHistory = (signal: keyof Telemetry): number[] => {
  const baseValues: Record<keyof Telemetry, number> = {
    ear: 0.30,
    mar: 0.12,
    blinkRate: 15,
    eyeClosure: 0.16,
    yawning: 1,
  };

  const base = baseValues[signal];

  // Deterministic variation using sine wave for demo purposes
  return Array.from({ length: 20 }, (_, i) => {
    const variation = Math.sin(i * 0.5) * base * 0.15;
    return base + variation;
  });
};

// ============================================================
// ACTIVE ALERT
// ============================================================

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: string;
  message: string;
  metric?: string;
  timestamp: Date;
  acknowledged: boolean;
}

export const getActiveAlert = (): Alert | null => {
  // Return null for no active alert, or an alert object
  return null;

  // Example alert:
  // return {
  //   id: '1',
  //   severity: 'WARNING',
  //   type: 'DROWSINESS DETECTED',
  //   message: 'Prolonged eye closure detected',
  //   metric: '1.74 sec',
  //   timestamp: new Date(),
  //   acknowledged: false,
  // };
};

// ============================================================
// ALERT HISTORY
// ============================================================

export const getAlertHistory = (): Alert[] => [
  {
    id: '3',
    severity: 'WARNING',
    type: 'DROWSINESS DETECTED',
    message: 'Prolonged eye closure detected',
    metric: '1.74 sec',
    timestamp: new Date(1700000000000 - 3600000),
    acknowledged: true,
  },
  {
    id: '2',
    severity: 'WARNING',
    type: 'YAWNING DETECTED',
    message: 'Frequent yawning pattern',
    metric: '3 yawns/min',
    timestamp: new Date(1700000000000 - 7200000),
    acknowledged: true,
  },
  {
    id: '1',
    severity: 'CRITICAL',
    type: 'FATIGUE WARNING',
    message: 'Critical fatigue level reached',
    metric: 'Risk: 87%',
    timestamp: new Date(1700000000000 - 10800000),
    acknowledged: true,
  },
];

// ============================================================
// FATIGUE TIMELINE
// ============================================================

export interface FatigueDataPoint {
  time: Date;
  risk: number; // 0-100
  state: DriverState;
}

export const getFatigueTimeline = (): FatigueDataPoint[] => {
  // Use a fixed base time for deterministic rendering
  const baseTime = 1700000000000; // Fixed timestamp
  const points: FatigueDataPoint[] = [];

  for (let i = 60; i >= 0; i--) {
    const time = new Date(baseTime - i * 60000); // Every minute

    // Deterministic risk calculation using sine wave pattern
    let risk = 15 + Math.sin(i * 0.3) * 10 + 10;
    let state: DriverState = 'ALERT';

    // Add some variation in middle section
    if (i < 20 && i > 10) {
      risk = 35 + Math.cos(i * 0.5) * 7.5 + 7.5;
      state = i % 3 === 0 ? 'DROWSY' : 'ALERT';
    } else if (i < 10) {
      risk = 20 + Math.sin(i * 0.4) * 5 + 5;
      state = 'ALERT';
    }

    points.push({ time, risk, state });
  }

  return points;
};

// ============================================================
// AI PIPELINE STATUS
// ============================================================

export interface PipelineStatus {
  stage: PipelineStage;
  status: 'ACTIVE' | 'INACTIVE' | 'ERROR';
  latency?: number; // ms
}

export const getPipelineStatus = (): PipelineStatus[] => [
  { stage: 'CAMERA', status: 'ACTIVE' },
  { stage: 'FACE', status: 'ACTIVE', latency: 12 },
  { stage: 'LANDMARKS', status: 'ACTIVE', latency: 8 },
  { stage: 'FEATURES', status: 'ACTIVE', latency: 5 },
  { stage: 'MODEL', status: 'ACTIVE', latency: 15 },
  { stage: 'ALERT', status: 'ACTIVE' },
];

// ============================================================
// SESSION DATA
// ============================================================

export interface Session {
  id: string;
  startTime: Date;
  duration: number; // minutes
  timeAlert: number; // percentage
  timeDrowsy: number; // percentage
  timeFatigued: number; // percentage
  warnings: number;
  avgFatigueRisk: number; // 0-100
  maxFatigueRisk: number; // 0-100
}

export const getCurrentSession = (): Session => ({
  id: 'SESSION_847393',
  startTime: new Date(1700000000000 - 1122000), // Fixed time - 18:42 ago
  duration: 18.7,
  timeAlert: 94,
  timeDrowsy: 5,
  timeFatigued: 1,
  warnings: 1,
  avgFatigueRisk: 24,
  maxFatigueRisk: 43,
});

export const getSessionHistory = (): Session[] => [
  {
    id: 'SESSION_847392',
    startTime: new Date(1700000000000 - 86400000 * 1),
    duration: 45,
    timeAlert: 87,
    timeDrowsy: 11,
    timeFatigued: 2,
    warnings: 3,
    avgFatigueRisk: 32,
    maxFatigueRisk: 68,
  },
  {
    id: 'SESSION_847391',
    startTime: new Date(1700000000000 - 86400000 * 2),
    duration: 32,
    timeAlert: 92,
    timeDrowsy: 7,
    timeFatigued: 1,
    warnings: 1,
    avgFatigueRisk: 26,
    maxFatigueRisk: 51,
  },
  {
    id: 'SESSION_847390',
    startTime: new Date(1700000000000 - 86400000 * 3),
    duration: 28,
    timeAlert: 96,
    timeDrowsy: 4,
    timeFatigued: 0,
    warnings: 0,
    avgFatigueRisk: 18,
    maxFatigueRisk: 34,
  },
];

// ============================================================
// CAMERA STATUS
// ============================================================

export interface CameraStatus {
  connected: boolean;
  fps: number;
  resolution: string;
  faceDetected: boolean;
  trackingActive: boolean;
  trackingConfidence: number; // 0-1
}

export const getCameraStatus = (): CameraStatus => ({
  connected: true,
  fps: 30,
  resolution: '1280x720',
  faceDetected: true,
  trackingActive: true,
  trackingConfidence: 0.96,
});

// ============================================================
// SYSTEM HEALTH
// ============================================================

export interface SystemHealth {
  component: string;
  status: 'READY' | 'ACTIVE' | 'CONNECTED' | 'OFFLINE' | 'ERROR';
  metric?: string;
}

export const getSystemHealth = (): SystemHealth[] => [
  { component: 'CAMERA', status: 'CONNECTED', metric: '30 FPS' },
  { component: 'FACE DETECTION', status: 'ACTIVE', metric: '12ms' },
  { component: 'LANDMARKS', status: 'ACTIVE', metric: '8ms' },
  { component: 'FEATURE EXTRACTION', status: 'ACTIVE', metric: '5ms' },
  { component: 'MODEL', status: 'READY', metric: '15ms' },
  { component: 'ALERT ENGINE', status: 'READY' },
];

// ============================================================
// STATE TRANSITIONS
// ============================================================

export interface StateTransition {
  from: DriverState;
  to: DriverState;
  timestamp: Date;
  duration: number; // seconds in previous state
}

export const getStateTransitions = (): StateTransition[] => [
  {
    from: 'ALERT',
    to: 'ALERT',
    timestamp: new Date(1700000000000 - 600000),
    duration: 420,
  },
  {
    from: 'ALERT',
    to: 'DROWSY',
    timestamp: new Date(1700000000000 - 300000),
    duration: 240,
  },
  {
    from: 'DROWSY',
    to: 'ALERT',
    timestamp: new Date(1700000000000 - 60000),
    duration: 180,
  },
];

// ============================================================
// ANALYTICS â€” SIGNAL DISTRIBUTION
// ============================================================

export interface SignalDistribution {
  signal: string;
  data: { time: Date; value: number }[];
}

export const getSignalDistribution = (signal: string, hours: number = 1): SignalDistribution => {
  const baseTime = 1700000000000; // Fixed timestamp
  const points = 60; // data points
  const interval = (hours * 3600000) / points;

  const data = Array.from({ length: points }, (_, i) => ({
    time: new Date(baseTime - (points - i) * interval),
    // Deterministic value using sine wave pattern
    value: 0.45 + Math.sin(i * 0.3) * 0.2 + Math.cos(i * 0.15) * 0.1,
  }));

  return { signal, data };
};

// ============================================================
// DEMO MODE FLAG
// ============================================================

export const isDemoMode = true;
