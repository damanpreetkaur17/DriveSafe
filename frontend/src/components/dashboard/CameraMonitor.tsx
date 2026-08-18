"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Play, Square, AlertTriangle } from "lucide-react";
import { useFaceDetection, FaceDetectionResult } from "@/hooks/useFaceDetection";

type CameraState = 'IDLE' | 'STARTING' | 'ACTIVE' | 'ERROR' | 'STOPPED';

interface CameraMonitorProps {
  showControls?: boolean;
  showOverlays?: boolean;
  onFaceDetectionUpdate?: (result: FaceDetectionResult | null) => void;
}

export default function CameraMonitor({
  showControls = true,
  showOverlays = true,
  onFaceDetectionUpdate
}: CameraMonitorProps) {
  const [cameraState, setCameraState] = useState<CameraState>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [faceData, setFaceData] = useState<FaceDetectionResult | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showFaceBox, setShowFaceBox] = useState(true);
  const [showEyeTracking, setShowEyeTracking] = useState(true);
  const [fps, setFps] = useState(0);
  const [resolution, setResolution] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0 });
  const isDetectionActiveRef = useRef(false);

  const { isInitialized: isFaceDetectionReady, error: faceDetectionError, detectFace } = useFaceDetection();

  // Draw overlays function - detailed for Live Monitor
  const drawOverlays = useCallback((canvas: HTMLCanvasElement, video: HTMLVideoElement, result: FaceDetectionResult) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const displayWidth = video.clientWidth;
    const displayHeight = video.clientHeight;

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!result.hasFace) return;

    // Calculate the scale and offset for object-cover
    const videoAspect = video.videoWidth / video.videoHeight;
    const displayAspect = displayWidth / displayHeight;

    let scale, offsetX, offsetY;

    if (videoAspect > displayAspect) {
      scale = displayHeight / video.videoHeight;
      offsetX = (displayWidth - video.videoWidth * scale) / 2;
      offsetY = 0;
    } else {
      scale = displayWidth / video.videoWidth;
      offsetX = 0;
      offsetY = (displayHeight - video.videoHeight * scale) / 2;
    }

    const toCanvasX = (normX: number) => normX * video.videoWidth * scale + offsetX;
    const toCanvasY = (normY: number) => normY * video.videoHeight * scale + offsetY;

    // Draw face bounding box with technical HUD style
    if (showFaceBox && result.boundingBox) {
      const box = result.boundingBox;
      const x = toCanvasX(box.x);
      const y = toCanvasY(box.y);
      const w = box.width * video.videoWidth * scale;
      const h = box.height * video.videoHeight * scale;

      ctx.strokeStyle = 'rgba(74, 222, 128, 0.9)';
      ctx.lineWidth = 3;

      const cornerLength = Math.min(w, h) * 0.18;

      // Top-left
      ctx.beginPath();
      ctx.moveTo(x, y + cornerLength);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerLength, y);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLength, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + cornerLength);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(x, y + h - cornerLength);
      ctx.lineTo(x, y + h);
      ctx.lineTo(x + cornerLength, y + h);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(x + w - cornerLength, y + h);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w, y + h - cornerLength);
      ctx.stroke();

      // Subtle scan lines inside box
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const lineY = y + (h / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x, lineY);
        ctx.lineTo(x + w, lineY);
        ctx.stroke();
      }
    }

    // Draw facial landmarks - selective and clean
    if (showLandmarks && result.landmarks && result.landmarks.length > 0) {
      ctx.fillStyle = 'rgba(74, 222, 128, 0.7)';

      // Face oval landmarks (0-16)
      for (let i = 0; i <= 16 && i < result.landmarks.length; i++) {
        if (result.landmarks[i]) {
          const x = toCanvasX(result.landmarks[i].x);
          const y = toCanvasY(result.landmarks[i].y);
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      // Emphasize key facial points
      const keyPoints = [1, 4, 6, 10, 152, 234, 454];
      ctx.fillStyle = 'rgba(74, 222, 128, 0.9)';
      keyPoints.forEach(i => {
        if (result.landmarks && i < result.landmarks.length && result.landmarks[i]) {
          const x = toCanvasX(result.landmarks[i].x);
          const y = toCanvasY(result.landmarks[i].y);
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      // Draw subtle connection lines for face structure
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.3)';
      ctx.lineWidth = 1.5;

      // Face contour line
      if (result.landmarks.length > 16) {
        ctx.beginPath();
        for (let i = 0; i <= 16; i++) {
          if (result.landmarks[i]) {
            const x = toCanvasX(result.landmarks[i].x);
            const y = toCanvasY(result.landmarks[i].y);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }
    }

    // Draw eye tracking with enhanced visualization
    if (showEyeTracking && result.leftEye && result.rightEye) {
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(34, 211, 238, 0.2)';

      // Left eye
      const leftEyePoints = result.leftEye.map(p => ({ x: toCanvasX(p.x), y: toCanvasY(p.y) }));
      ctx.beginPath();
      leftEyePoints.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Left eye center
      const leftCenterX = leftEyePoints.reduce((sum, p) => sum + p.x, 0) / leftEyePoints.length;
      const leftCenterY = leftEyePoints.reduce((sum, p) => sum + p.y, 0) / leftEyePoints.length;
      ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
      ctx.beginPath();
      ctx.arc(leftCenterX, leftCenterY, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Right eye
      const rightEyePoints = result.rightEye.map(p => ({ x: toCanvasX(p.x), y: toCanvasY(p.y) }));
      ctx.beginPath();
      rightEyePoints.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.fillStyle = 'rgba(34, 211, 238, 0.2)';
      ctx.fill();
      ctx.stroke();

      // Right eye center
      const rightCenterX = rightEyePoints.reduce((sum, p) => sum + p.x, 0) / rightEyePoints.length;
      const rightCenterY = rightEyePoints.reduce((sum, p) => sum + p.y, 0) / rightEyePoints.length;
      ctx.fillStyle = 'rgba(34, 211, 238, 0.9)';
      ctx.beginPath();
      ctx.arc(rightCenterX, rightCenterY, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  }, [showFaceBox, showLandmarks, showEyeTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const currentFrame = animationFrameRef.current;
      if (currentFrame) {
        cancelAnimationFrame(currentFrame);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      setCameraState('STARTING');
      setErrorMessage('');

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;

        // Get actual resolution
        const track = stream.getVideoTracks()[0];
        const settings = track.getSettings();
        setResolution(`${settings.width}x${settings.height}`);

        setCameraState('ACTIVE');

        // Start face detection loop
        startDetectionLoop();
      }
    } catch (error: unknown) {
      console.error('Camera error:', error);
      setCameraState('ERROR');

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setErrorMessage('Camera permission was denied. Please allow camera access to start tracking.');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setErrorMessage('No compatible camera was detected.');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          setErrorMessage('Camera is currently unavailable or in use by another application.');
        } else {
          setErrorMessage(error.message || 'An error occurred while accessing the camera.');
        }
      } else {
        setErrorMessage('An unknown error occurred while accessing the camera.');
      }
    }
  };

  const stopCamera = useCallback(() => {
    isDetectionActiveRef.current = false;

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraState('STOPPED');
    setErrorMessage('');
    setFaceData(null);
    setFps(0);
  }, []);

  const startDetectionLoop = useCallback(() => {
    isDetectionActiveRef.current = true;
    fpsCounterRef.current.lastTime = performance.now();
    fpsCounterRef.current.frames = 0;

    const detect = () => {
      if (!isDetectionActiveRef.current || !videoRef.current) {
        return;
      }

      const result = detectFace(videoRef.current);
      setFaceData(result);

      if (onFaceDetectionUpdate) {
        onFaceDetectionUpdate(result);
      }

      fpsCounterRef.current.frames++;
      const now = performance.now();
      const elapsed = now - fpsCounterRef.current.lastTime;
      if (elapsed >= 1000) {
        setFps(Math.round((fpsCounterRef.current.frames * 1000) / elapsed));
        fpsCounterRef.current.frames = 0;
        fpsCounterRef.current.lastTime = now;
      }

      if (canvasRef.current && videoRef.current && result) {
        drawOverlays(canvasRef.current, videoRef.current, result);
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
  }, [detectFace, onFaceDetectionUpdate, drawOverlays]);

  const isCameraActive = cameraState === 'ACTIVE';

  return (
    <div className="relative">
      {/* MediaPipe Error Warning */}
      {faceDetectionError && (
        <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5" />
            <div className="flex-1 text-xs">
              <div className="font-semibold text-amber-400">Face Detection Unavailable</div>
              <div className="mt-1 text-amber-300/70">{faceDetectionError}</div>
              <div className="mt-1 text-amber-300/50">Check browser console for details.</div>
            </div>
          </div>
        </div>
      )}

      {/* Video + Canvas container */}
      <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-black">
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
        />

        {/* Canvas for overlays - positioned absolutely over video */}
        {isCameraActive && showOverlays && (
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ zIndex: 10 }}
          />
        )}

        {/* Camera states UI */}
        {cameraState === 'IDLE' && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Camera size={64} className="mx-auto text-white/20" />
              <p
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
                className="mt-4 text-[12px] font-bold uppercase tracking-[0.15em] text-white/40"
              >
                Camera Ready
              </p>
              <p className="mt-2 text-xs text-white/30">Press Start Tracking to activate camera</p>
            </div>
          </div>
        )}

        {cameraState === 'STARTING' && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
              <p
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
                className="text-[12px] font-bold uppercase tracking-[0.15em] text-white/40"
              >
                {isFaceDetectionReady ? 'Initializing Camera...' : 'Loading Face Detection...'}
              </p>
            </div>
          </div>
        )}

        {cameraState === 'STOPPED' && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Camera size={64} className="mx-auto text-white/20" />
              <p
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
                className="mt-4 text-[12px] font-bold uppercase tracking-[0.15em] text-white/40"
              >
                Camera Stopped
              </p>
              <p className="mt-2 text-xs text-white/30">Press Start Tracking to resume</p>
            </div>
          </div>
        )}

        {cameraState === 'ERROR' && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-md text-center">
              <AlertTriangle size={48} className="mx-auto text-red-400" />
              <p
                style={{ fontFamily: "'Rajdhani', sans-serif" }}
                className="mt-4 text-[12px] font-bold uppercase tracking-[0.15em] text-red-400"
              >
                Camera Error
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/50">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Status indicators overlay */}
        {isCameraActive && (
          <div className="pointer-events-none absolute left-4 top-4 space-y-2">
            <StatusBadge icon="â—" label="CAMERA" status="LIVE" active={true} />
            <StatusBadge icon="â—" label="FACE DETECTED" active={faceData?.hasFace || false} />
            <StatusBadge icon="â—" label="LANDMARKS" active={faceData?.hasFace || false} count={faceData?.landmarks?.length} />
            <StatusBadge icon="â—" label="CV MODEL" status="MEDIAPIPE" active={isFaceDetectionReady} />
          </div>
        )}

        {/* Technical readout */}
        {isCameraActive && (
          <div className="pointer-events-none absolute bottom-4 left-4 space-y-1 rounded-lg border border-white/10 bg-black/60 px-3 py-2 font-mono text-[10px] text-white/50 backdrop-blur">
            <div>FPS: {fps}</div>
            {resolution && <div>RES: {resolution}</div>}
            <div>CONF: {Math.round((faceData?.confidence || 0) * 100)}%</div>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Start/Stop */}
          {cameraState === 'ACTIVE' ? (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              <Square size={14} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif" }} className="text-[11px] uppercase tracking-wider">
                Stop Tracking
              </span>
            </button>
          ) : (
            <button
              onClick={startCamera}
              disabled={cameraState === 'STARTING' || !isFaceDetectionReady}
              className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400 transition hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={14} />
              <span style={{ fontFamily: "'Rajdhani', sans-serif" }} className="text-[11px] uppercase tracking-wider">
                {cameraState === 'STARTING' ? 'Starting...' : !isFaceDetectionReady ? 'Loading...' : 'Start Tracking'}
              </span>
            </button>
          )}

          {/* Divider */}
          {isCameraActive && <div className="h-6 w-px bg-white/10" />}

          {/* Overlay toggles */}
          {isCameraActive && (
            <>
              <ToggleButton
                label="Face Box"
                active={showFaceBox}
                onClick={() => setShowFaceBox(!showFaceBox)}
              />
              <ToggleButton
                label="Landmarks"
                active={showLandmarks}
                onClick={() => setShowLandmarks(!showLandmarks)}
              />
              <ToggleButton
                label="Eye Tracking"
                active={showEyeTracking}
                onClick={() => setShowEyeTracking(!showEyeTracking)}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({
  icon,
  label,
  active,
  count,
  status
}: {
  icon: string;
  label: string;
  active: boolean;
  count?: number;
  status?: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 text-[10px] font-medium ${
      active ? 'text-green-400' : 'text-white/30'
    }`}>
      <span>{icon}</span>
      <span>{label}</span>
      {count !== undefined && <span className="text-white/40">({count})</span>}
      {status && <span className="text-white/40">Â· {status}</span>}
    </div>
  );
}

function ToggleButton({
  label,
  active,
  onClick
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition ${
        active
          ? 'border-white/20 bg-white/[0.08] text-white'
          : 'border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.04]'
      }`}
    >
      <span>{label}</span>
    </button>
  );
}
