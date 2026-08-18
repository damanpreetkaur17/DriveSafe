import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver, FaceLandmarkerResult } from '@mediapipe/tasks-vision';

export interface FaceDetectionResult {
  hasFace: boolean;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  landmarks: { x: number; y: number }[] | null;
  leftEye: { x: number; y: number }[] | null;
  rightEye: { x: number; y: number }[] | null;
  confidence: number;
}

export function useFaceDetection() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  useEffect(() => {
    let mounted = true;

    const initializeFaceDetection = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        );

        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'CPU',
          },
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
        });

        if (mounted) {
          faceLandmarkerRef.current = faceLandmarker;
          setIsInitialized(true);
        }
      } catch (err) {
        console.error('[useFaceDetection] Failed to initialize:', err);
        if (mounted) {
          setError(`Failed to load face detection: ${(err as Error).message}`);
        }
      }
    };

    initializeFaceDetection();

    return () => {
      mounted = false;
      if (faceLandmarkerRef.current) {
        console.log('[useFaceDetection] Cleaning up MediaPipe');
        faceLandmarkerRef.current.close();
      }
    };
  }, []);

  const detectFace = useCallback(
    (videoElement: HTMLVideoElement): FaceDetectionResult | null => {
      if (!isInitialized || !faceLandmarkerRef.current || !videoElement || videoElement.readyState < 2) {
        return null;
      }

      try {
        const startTimeMs = performance.now();
        const results: FaceLandmarkerResult = faceLandmarkerRef.current.detectForVideo(videoElement, startTimeMs);

        if (results.faceLandmarks && results.faceLandmarks.length > 0) {
          const landmarks = results.faceLandmarks[0];

          // Calculate bounding box from landmarks
          const xCoords = landmarks.map(l => l.x);
          const yCoords = landmarks.map(l => l.y);
          const minX = Math.min(...xCoords);
          const maxX = Math.max(...xCoords);
          const minY = Math.min(...yCoords);
          const maxY = Math.max(...yCoords);

          // Add padding to bounding box
          const padding = 0.1;
          const width = maxX - minX;
          const height = maxY - minY;
          const paddedMinX = Math.max(0, minX - width * padding);
          const paddedMaxX = Math.min(1, maxX + width * padding);
          const paddedMinY = Math.max(0, minY - height * padding);
          const paddedMaxY = Math.min(1, maxY + height * padding);

          // Extract eye landmarks
          const leftEyeIndices = [33, 133, 160, 144, 145, 153];
          const rightEyeIndices = [362, 263, 387, 373, 374, 380];

          const leftEye = leftEyeIndices.map(i => ({ x: landmarks[i].x, y: landmarks[i].y }));
          const rightEye = rightEyeIndices.map(i => ({ x: landmarks[i].x, y: landmarks[i].y }));

          return {
            hasFace: true,
            boundingBox: {
              x: paddedMinX,
              y: paddedMinY,
              width: paddedMaxX - paddedMinX,
              height: paddedMaxY - paddedMinY,
            },
            landmarks: landmarks.map(l => ({ x: l.x, y: l.y })),
            leftEye,
            rightEye,
            confidence: 0.95,
          };
        }

        return {
          hasFace: false,
          boundingBox: null,
          landmarks: null,
          leftEye: null,
          rightEye: null,
          confidence: 0,
        };
      } catch (err) {
        console.error('[useFaceDetection] Detection error:', err);
        return null;
      }
    },
    [isInitialized]
  );

  return { isInitialized, error, detectFace };
}
