"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  LoaderCircle,
  Play,
  Square,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  DetectionResult,
  DrivingSession,
  monitoringAPI,
  getMonitoringSocketUrl,
  getToken,
  sessionAPI,
  Vehicle,
  vehicleAPI,
} from "@/services/api";

type MonitorState = "idle" | "starting" | "active" | "disconnected";
type ServiceState = "checking" | "ready" | "unavailable";

interface CameraMonitorProps {
  onDetectionUpdate?: (detection: DetectionResult | null) => void;
  onSessionChange?: (session: DrivingSession | null) => void;
  onElapsedSeconds?: (seconds: number) => void;
}

interface MonitorEvent {
  type: string;
  severity: string;
  message: string;
  timestamp: string;
}

interface SocketMessage {
  type: string;
  sessionId?: number;
  message?: string;
  data?: DetectionResult;
}

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
};

const cameraErrorMessage = (error: unknown) => {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Camera permission was denied. Allow camera access in your browser settings and try again.";
    }
    if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
      return "The selected camera is unavailable. Choose another camera or reconnect it.";
    }
    if (error.name === "NotReadableError") {
      return "The camera is already in use by another application.";
    }
  }
  return error instanceof Error ? error.message : "Unable to start camera monitoring.";
};

export default function CameraMonitor({
  onDetectionUpdate,
  onSessionChange,
  onElapsedSeconds,
}: CameraMonitorProps) {
  const [monitorState, setMonitorState] = useState<MonitorState>("idle");
  const [serviceState, setServiceState] = useState<ServiceState>("checking");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [events, setEvents] = useState<MonitorEvent[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [activeSession, setActiveSession] = useState<DrivingSession | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [isStopping, setIsStopping] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const frameTimerRef = useRef<number | null>(null);
  const framePendingRef = useRef(false);
  const sessionIdRef = useRef<number | null>(null);
  const intentionalStopRef = useRef(false);
  const isActiveRef = useRef(false);
  const connectionErrorRef = useRef("");
  const endedSessionsRef = useRef(new Set<number>());
  const onSessionChangeRef = useRef(onSessionChange);
  const onElapsedSecondsRef = useRef(onElapsedSeconds);

  useEffect(() => {
    onSessionChangeRef.current = onSessionChange;
    onElapsedSecondsRef.current = onElapsedSeconds;
  }, [onElapsedSeconds, onSessionChange]);

  const stopCameraTracks = useCallback(() => {
    if (frameTimerRef.current !== null) {
      window.clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
    framePendingRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const finishSession = useCallback(async (sessionId: number) => {
    if (endedSessionsRef.current.has(sessionId)) return;
    endedSessionsRef.current.add(sessionId);
    try {
      const response = await sessionAPI.end(sessionId);
      onSessionChangeRef.current?.(response.data);
    } catch (error) {
      console.error("Unable to end monitoring session:", error);
      onSessionChangeRef.current?.(null);
    } finally {
      if (sessionIdRef.current === sessionId) {
        sessionIdRef.current = null;
        setActiveSession(null);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    vehicleAPI
      .getAll()
      .then((vehicleResponse) => {
        if (!mounted) return;
        setVehicles(vehicleResponse.data);
        if (vehicleResponse.data.length > 0) {
          setSelectedVehicleId(String(vehicleResponse.data[0].vehicle_id));
        }
      })
      .catch((error: unknown) => {
        if (mounted) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load monitoring requirements."
          );
        }
      });
    monitoringAPI
      .check()
      .then(() => {
        if (mounted) setServiceState("ready");
      })
      .catch(() => {
        if (mounted) setServiceState("unavailable");
      });

    return () => {
      mounted = false;
      intentionalStopRef.current = true;
      isActiveRef.current = false;
      stopCameraTracks();
      const socket = socketRef.current;
      const sessionId = sessionIdRef.current;
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.addEventListener(
          "close",
          () => {
            if (sessionId !== null) void finishSession(sessionId);
          },
          { once: true }
        );
        socket.send(JSON.stringify({ type: "stop" }));
      } else {
        socket?.close();
        if (sessionId !== null) void finishSession(sessionId);
      }
    };
  }, [finishSession, stopCameraTracks]);

  useEffect(() => {
    if (monitorState !== "active" || !activeSession) return;
    const updateElapsed = () => {
    const seconds = Math.max(
      0,
      Math.floor((Date.now() - new Date(activeSession.start_time).getTime()) / 1000)
    );
    setElapsedSeconds(seconds);
    onElapsedSecondsRef.current?.(seconds);
    };
    updateElapsed();
    const timer = window.setInterval(updateElapsed, 1000);
    return () => window.clearInterval(timer);
  }, [activeSession, monitorState]);

  useEffect(() => {
    const canvas = overlayRef.current;
    const video = videoRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !video || !context) return;

    const width = video.clientWidth;
    const height = video.clientHeight;
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    if (!detection?.hasFace || !detection.faceBox || !video.videoWidth) return;

    const scale = Math.max(width / video.videoWidth, height / video.videoHeight);
    const offsetX = (width - video.videoWidth * scale) / 2;
    const offsetY = (height - video.videoHeight * scale) / 2;
    const x = (value: number) => value * video.videoWidth * scale + offsetX;
    const y = (value: number) => value * video.videoHeight * scale + offsetY;
    const box = detection.faceBox;

    context.strokeStyle = "#9ca3af";
    context.lineWidth = 2;
    context.strokeRect(
      x(box.x),
      y(box.y),
      box.width * video.videoWidth * scale,
      box.height * video.videoHeight * scale
    );
    if (detection.eyeLandmarks) {
      context.strokeStyle = "#22d3ee";
      context.lineWidth = 2;
      for (let eye = 0; eye < 2; eye += 1) {
        const points = detection.eyeLandmarks.slice(eye * 4, eye * 4 + 4);
        if (points.length !== 4) continue;
        context.beginPath();
        points.forEach(([px, py], index) => {
          if (index === 0) context.moveTo(x(px), y(py));
          else context.lineTo(x(px), y(py));
        });
        context.closePath();
        context.stroke();
      }
    }
  }, [detection]);

  const startFrameCapture = () => {
    const video = videoRef.current;
    const socket = socketRef.current;
    if (!video || !socket) return;

    frameTimerRef.current = window.setInterval(() => {
      if (
        framePendingRef.current ||
        socket.readyState !== WebSocket.OPEN ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        video.videoWidth === 0
      ) {
        return;
      }
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 640 / video.videoWidth);
      canvas.width = Math.round(video.videoWidth * scale);
      canvas.height = Math.round(video.videoHeight * scale);
      const context = canvas.getContext("2d");
      if (!context) {
        setErrorMessage("Camera frame capture is unavailable in this browser.");
        stopCameraTracks();
        return;
      }
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      framePendingRef.current = true;
      canvas.toBlob(
        (blob) => {
          if (!blob || socket.readyState !== WebSocket.OPEN) {
            framePendingRef.current = false;
            return;
          }
          socket.send(blob);
        },
        "image/jpeg",
        0.7
      );
    }, 250);
  };

  const startMonitoring = async () => {
    setErrorMessage("");
    setEvents([]);
    setAlertCount(0);
    setDetection(null);
    setMonitorState("starting");
    intentionalStopRef.current = false;
    connectionErrorRef.current = "";
    setElapsedSeconds(0);

    let session: DrivingSession | null = null;
    let socket: WebSocket | null = null;
    try {
      if (!selectedVehicleId) {
        throw new Error("Add a vehicle to your profile before starting monitoring.");
      }
      try {
        await monitoringAPI.check();
        setServiceState("ready");
      } catch (error) {
        setServiceState("unavailable");
        throw error;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera access requires HTTPS or localhost in a supported browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          ...(selectedCameraId ? { deviceId: { exact: selectedCameraId } } : {}),
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Camera preview is unavailable.");
      video.srcObject = stream;
      await video.play();

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setCameraDevices(devices.filter((device) => device.kind === "videoinput"));
      } catch (error) {
        console.error("Unable to list available camera devices:", error);
      }

      const response = await sessionAPI.start(Number(selectedVehicleId));
      session = response.data;
      sessionIdRef.current = session.session_id;
      setActiveSession(session);
      onSessionChangeRef.current?.(session);
      const token = getToken();
      if (!token) throw new Error("Your sign-in session has expired. Please sign in again.");

      socket = new WebSocket(getMonitoringSocketUrl(), [
        "drivesafe",
        `bearer.${token}`,
      ]);
      socketRef.current = socket;

      await new Promise<void>((resolve, reject) => {
        let ready = false;
        const timeout = window.setTimeout(
          () => reject(new Error("Timed out connecting to the monitoring service.")),
          10000
        );
        socket?.addEventListener("open", () => {
          socket?.send(
            JSON.stringify({ type: "start", sessionId: session?.session_id })
          );
        });
        socket?.addEventListener("message", (event) => {
          let message: SocketMessage;
          try {
            message = JSON.parse(String(event.data)) as SocketMessage;
          } catch {
            setErrorMessage("Received an invalid response from the monitoring service.");
            return;
          }
          if (message.type === "ready") {
            ready = true;
            isActiveRef.current = true;
            setMonitorState("active");
            window.clearTimeout(timeout);
            resolve();
          } else if (message.type === "detection" && message.data) {
            framePendingRef.current = false;
            setDetection(message.data);
            onDetectionUpdate?.(message.data);
            const newEvents = message.data.events.map((item) => ({
              ...item,
              timestamp: message.data?.timestamp ?? new Date().toISOString(),
            }));
            if (newEvents.length > 0) {
              setAlertCount((count) => count + newEvents.length);
              setEvents((current) => [...newEvents, ...current].slice(0, 8));
            }
          } else if (message.type === "error") {
            framePendingRef.current = false;
            const errorText = message.message || "Monitoring service error.";
            connectionErrorRef.current = errorText;
            setErrorMessage(errorText);
            if (!ready) {
              window.clearTimeout(timeout);
              reject(new Error(errorText));
            } else {
              socket?.close();
            }
          }
        });
        socket?.addEventListener("error", () => {
          window.clearTimeout(timeout);
          reject(new Error("Unable to connect to the monitoring WebSocket."));
        });
        socket?.addEventListener("close", () => {
          window.clearTimeout(timeout);
          framePendingRef.current = false;
          if (!ready) {
            reject(new Error("Monitoring service disconnected before the session started."));
          } else if (isActiveRef.current && !intentionalStopRef.current) {
            isActiveRef.current = false;
            stopCameraTracks();
            setMonitorState("disconnected");
            setErrorMessage(
              connectionErrorRef.current ||
                "Live connection lost. This session has been stopped."
            );
            if (sessionIdRef.current !== null) {
              void finishSession(sessionIdRef.current);
            }
          }
        });
      });

      isActiveRef.current = true;
      setMonitorState("active");
      startFrameCapture();
    } catch (error) {
      intentionalStopRef.current = true;
      isActiveRef.current = false;
      stopCameraTracks();
      socket?.close();
      setMonitorState("idle");
      setErrorMessage(cameraErrorMessage(error));
      if (session) await finishSession(session.session_id);
      setActiveSession(null);
      sessionIdRef.current = null;
    }
  };

  const stopMonitoring = async () => {
    if (isStopping) return;
    setIsStopping(true);
    intentionalStopRef.current = true;
    isActiveRef.current = false;
    stopCameraTracks();
    setMonitorState("idle");

    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      const closed = new Promise<void>((resolve) => {
        socket.addEventListener("close", () => resolve(), { once: true });
        window.setTimeout(resolve, 3000);
      });
      socket.send(JSON.stringify({ type: "stop" }));
      await closed;
    } else {
      socket?.close();
    }

    if (sessionIdRef.current !== null) {
      await finishSession(sessionIdRef.current);
    }
    setDetection(null);
    onDetectionUpdate?.(null);
    setIsStopping(false);
  };

  const connectionText =
    monitorState === "active"
      ? "Connected"
      : monitorState === "starting"
        ? "Connecting"
        : monitorState === "disconnected"
          ? "Disconnected"
          : "Offline";

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Activity size={17} className="text-white/65" />
            Live driver monitoring
          </div>
          <p className="mt-1 text-xs text-white/50">
            Camera frames are processed live and are not saved.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70">
          {monitorState === "active" ? (
            <Wifi size={14} className="text-white/65" />
          ) : (
            <WifiOff size={14} className="text-white/40" />
          )}
          {connectionText}
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70">
            {serviceState === "ready" ? (
              <CheckCircle2 size={14} className="text-white/65" />
            ) : serviceState === "checking" ? (
              <LoaderCircle size={14} className="animate-spin text-white/40" />
            ) : (
              <WifiOff size={14} className="text-amber-400" />
            )}
            ML {serviceState === "ready" ? "ready" : serviceState}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
        <div className="space-y-3">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
              muted
            />
            <canvas
              ref={overlayRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
            {monitorState !== "active" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#080b10] text-center">
                {monitorState === "starting" ? (
                  <LoaderCircle className="animate-spin text-white/65" size={26} />
                ) : (
                  <Camera className="text-white/40" size={30} />
                )}
                <div>
                  <p className="text-sm font-medium text-white/80">
                    {monitorState === "starting"
                      ? "Connecting to camera and model…"
                      : monitorState === "disconnected"
                        ? "Monitoring connection ended"
                        : "Camera is off"}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    {monitorState === "starting"
                      ? "Please keep this page open."
                      : "Start monitoring when you are ready."}
                  </p>
                </div>
              </div>
            )}
            {monitorState === "active" && !detection?.hasFace && (
              <div className="absolute bottom-3 left-3 rounded-md bg-black/70 px-3 py-2 text-xs text-amber-300">
                No face detected
              </div>
            )}
            {monitorState === "active" && (
              <div className="absolute right-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                LIVE
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {vehicles.length > 0 && (
              <label className="flex min-w-48 flex-1 items-center gap-2 text-xs text-white/50">
                Vehicle
                <select
                  value={selectedVehicleId}
                  onChange={(event) => setSelectedVehicleId(event.target.value)}
                  disabled={monitorState !== "idle" || isStopping}
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0b0e14] px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.vehicle_id} value={vehicle.vehicle_id}>
                      {vehicle.make} {vehicle.model} · {vehicle.registration_no}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {cameraDevices.length > 1 && (
              <label className="flex min-w-48 flex-1 items-center gap-2 text-xs text-white/50">
                Camera
                <select
                  value={selectedCameraId}
                  onChange={(event) => setSelectedCameraId(event.target.value)}
                  disabled={monitorState !== "idle" || isStopping}
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0b0e14] px-3 py-2 text-sm text-white disabled:opacity-50"
                >
                  <option value="">Default camera</option>
                  {cameraDevices.map((device, index) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${index + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {monitorState === "active" ? (
              <button
                type="button"
                onClick={() => void stopMonitoring()}
                disabled={isStopping}
                className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
              >
                {isStopping ? <LoaderCircle className="animate-spin" size={16} /> : <Square size={15} />}
                Stop monitoring
              </button>
            ) : (
              <button
                type="button"
                onClick={() => void startMonitoring()}
                disabled={
                  monitorState === "starting" ||
                  vehicles.length === 0 ||
                  Boolean(loadError)
                }
                className="inline-flex items-center gap-2 rounded-lg bg-white/75 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {monitorState === "starting" ? (
                  <LoaderCircle className="animate-spin" size={16} />
                ) : (
                  <Play size={16} />
                )}
                Start monitoring
              </button>
            )}
          </div>
          {vehicles.length === 0 && !loadError && (
            <p className="text-xs text-amber-300">
              Add a vehicle in your profile before starting a session.{" "}
              <Link href="/dashboard/profile" className="underline underline-offset-2">
                Manage vehicles
              </Link>
            </p>
          )}
          {loadError && (
            <p role="alert" className="text-sm text-red-300">
              {loadError}
            </p>
          )}
          {errorMessage && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-200"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              {errorMessage}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div>
              <p className="text-xs text-white/45">Session duration</p>
              <p className="mt-1 font-mono text-lg text-white">
                {formatDuration(elapsedSeconds)}
              </p>
            </div>
            {monitorState === "active" ? (
              <CheckCircle2 size={19} className="text-white/65" />
            ) : (
              <WifiOff size={19} className="text-white/30" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric label="Eye status" value={detection?.eyeStatus ?? "—"} />
            <Metric label="EAR" value={detection?.ear?.toFixed(3) ?? "—"} />
            <Metric
              label="Yawning"
              value={
                detection?.yawnDetected === null || detection?.yawnDetected === undefined
                  ? "—"
                  : detection.yawnDetected
                    ? "Detected"
                    : "No"
              }
            />
            <Metric
              label="Head pose (P / Y / R)"
              value={
                detection?.headPose
                  ? `${detection.headPose.pitch.toFixed(0)}° / ${detection.headPose.yaw.toFixed(0)}° / ${detection.headPose.roll.toFixed(0)}°`
                  : "—"
              }
            />
            <Metric label="Attention" value={detection?.attentionStatus ?? "—"} />
            <Metric label="Drowsiness" value={detection?.drowsinessLevel ?? "—"} />
            <Metric
              label="Signal risk score"
              value={
                detection?.fatigueScore === null || detection?.fatigueScore === undefined
                  ? "—"
                  : `${detection.fatigueScore}/100`
              }
            />
            <Metric label="Alerts this session" value={alertCount} />
          </div>
          <p className="text-[11px] leading-relaxed text-white/40">
            Signal risk score is a rule-based indicator from eye closure, sustained yawning,
            and head pose; it is not a trained drowsiness probability.
          </p>

          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/65">
              Recent events
            </h3>
            {events.length === 0 ? (
              <p className="text-xs text-white/40">No detection events in this session.</p>
            ) : (
              <ul className="space-y-2">
                {events.map((event, index) => (
                  <li
                    key={`${event.timestamp}-${event.type}-${index}`}
                    className="flex items-start gap-2 text-xs"
                  >
                    <AlertTriangle
                      size={14}
                      className={
                        event.severity === "CRITICAL"
                          ? "mt-0.5 text-red-400"
                          : "mt-0.5 text-amber-400"
                      }
                    />
                    <span className="min-w-0 flex-1 text-white/70">{event.message}</span>
                    <time className="shrink-0 text-white/35">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <p className="truncate text-[11px] text-white/45">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
