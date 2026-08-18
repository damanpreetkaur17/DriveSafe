"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Play, Square, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useFaceDetection, FaceDetectionResult } from "@/hooks/useFaceDetection";

type CameraState = 'IDLE' | 'STARTING' | 'ACTIVE' | 'ERROR' | 'STOPPED';

export default function CameraOverview() {
  const [cameraState, setCameraState] = useState<CameraState>('IDLE');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [faceData, setFaceData] = useState<FaceDetectionResult | null>(null);
  const [fps, setFps] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fpsCounterRef = useRef({ frames: 0, lastTime: 0 });
  const isDetectionActiveRef = useRef(false);

  const { isInitialized: isFaceDetectionReady, detectFace } = useFaceDetection();

  // Compact overview overlay - minimal and clean
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

    // Calculate scale and offset for object-cover
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

    // Minimal face bounding box with corner brackets
    if (result.boundingBox) {
      const box = result.boundingBox;
      const x = toCanvasX(box.x);
      const y = toCanvasY(box.y);
      const w = box.width * video.videoWidth * scale;
      const h = box.height * video.videoHeight * scale;

      ctx.strokeStyle = 'rgba(74, 222, 128, 0.8)';
      ctx.lineWidth = 2;

      const cornerLength = Math.min(w, h) * 0.12;

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
    }

    // Minimal eye indicators
    if (result.leftEye && result.rightEye) {
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.7)';
      ctx.lineWidth = 1.5;

      const leftEyePoints = result.leftEye.map(p => ({ x: toCanvasX(p.x), y: toCanvasY(p.y) }));
      const rightEyePoints = result.rightEye.map(p => ({ x: toCanvasX(p.x), y: toCanvasY(p.y) }));

      // Left eye
      ctx.beginPath();
      leftEyePoints.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();

      // Right eye
      ctx.beginPath();
      rightEyePoints.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.closePath();
      ctx.stroke();
    }
  }, []);

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
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraState('ACTIVE');
        startDetectionLoop();
      }
    } catch (error: unknown) {
      console.error('Camera error:', error);
      setCameraState('ERROR');

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
          setErrorMessage('Camera permission denied');
        } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
          setErrorMessage('No camera detected');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
          setErrorMessage('Camera unavailable');
        } else {
          setErrorMessage('Camera error');
        }
      } else {
        setErrorMessage('Unknown error');
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
  }, [detectFace, drawOverlays]);

  const isCameraActive = cameraState === 'ACTIVE';

  return (
    <div>
      {/* Video + Canvas container */}
      <div className="relative aspect-video overflow-hidden rounded-lg border border-white/10 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
        />

        {isCameraActive && (
          <canvas
            ref={canvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ zIndex: 10 }}
          />
        )}

        {/* Camera states */}
        {cameraState === 'IDLE' && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Camera size={48} className="mx-auto text-white/20" />
              <p style={{ fontFamily: "'Rajdhani', sans-serif" }} className="mt-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white/40">
                Camera Ready
              </p>
            </div>
          </div>
        )}

        {cameraState === 'STARTING' && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
              <p style={{ fontFamily: "'Rajdhani', sans-serif" }} className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/40">
                {isFaceDetectionReady ? 'Starting...' : 'Loading...'}
              </p>
            </div>
          </div>
        )}

        {cameraState === 'STOPPED' && (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Camera size={48} className="mx-auto text-white/20" />
              <p style={{ fontFamily: "'Rajdhani', sans-serif" }} className="mt-4 text-[11px] font-bold uppercase tracking-[0.15em] text-white/40">
                Camera Stopped
              </p>
            </div>
          </div>
        )}

        {cameraState === 'ERROR' && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-sm text-center">
              <AlertTriangle size={40} className="mx-auto text-red-400" />
              <p style={{ fontFamily: "'Rajdhani', sans-serif" }} className="mt-4 text-[11px] font-bold uppercase tracking-[0.15em] text-red-400">
                Camera Error
              </p>
              <p className="mt-2 text-xs text-white/50">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Compact status overlay */}
        {isCameraActive && (
          <div className="pointer-events-none absolute left-3 top-3 space-y-1.5">
            <div className={`flex items-center gap-1.5 text-[9px] font-medium ${faceData?.hasFace ? 'text-green-400' : 'text-white/30'}`}>
              <span>â—</span>
              <span>MONITORING</span>
            </div>
            <div className="text-[8px] text-white/40">
              {faceData?.hasFace ? 'FACE DETECTED' : 'NO FACE'}
            </div>
          </div>
        )}

        {/* Minimal stats */}
        {isCameraActive && (
          <div className="pointer-events-none absolute bottom-3 right-3 rounded border border-white/10 bg-black/60 px-2 py-1 font-mono text-[9px] text-white/50 backdrop-blur">
            {fps} FPS
          </div>
        )}
      </div>

      {/* Compact controls */}
      <div className="mt-3 flex items-center justify-between">
        {cameraState === 'ACTIVE' ? (
          <button
            onClick={stopCamera}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/20"
          >
            <Square size={12} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif" }} className="text-[10px] uppercase tracking-wider">
              Stop
            </span>
          </button>
        ) : (
          <button
            onClick={startCamera}
            disabled={cameraState === 'STARTING' || !isFaceDetectionReady}
            className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-1.5 text-xs font-semibold text-green-400 transition hover:bg-green-500/20 disabled:opacity-50"
          >
            <Play size={12} />
            <span style={{ fontFamily: "'Rajdhani', sans-serif" }} className="text-[10px] uppercase tracking-wider">
              {cameraState === 'STARTING' ? 'Starting...' : !isFaceDetectionReady ? 'Loading...' : 'Start'}
            </span>
          </button>
        )}

        <Link
          href="/dashboard/live"
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-white/60 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
        >
          <span style={{ fontFamily: "'Rajdhani', sans-serif" }} className="text-[10px] uppercase tracking-wider">
            Full Monitor
          </span>
          <ArrowRight size={12} />
        </Link>
      </div>
    </div>
  );
}
