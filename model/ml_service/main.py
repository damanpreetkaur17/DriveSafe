import logging
import os
import threading
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import cv2
import mediapipe as mp
import numpy as np
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision


logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("driver-attention-ml")

MODEL_PATH = Path(
    os.getenv(
        "FACE_LANDMARKER_MODEL",
        str(
            Path(__file__).resolve().parents[1]
            / "Driver_Attention_System"
            / "face_landmarker.task"
        ),
    )
)
MAX_FRAME_BYTES = 2 * 1024 * 1024
EYE_CLOSED_THRESHOLD = 0.25
YAWN_THRESHOLD = 0.30
HEAD_POSE_THRESHOLD_DEGREES = 10.0
EYE_CLOSURE_SECONDS = 2.5
YAWN_SECONDS = 3.0
DISTRACTION_SECONDS = 1.0

EYE_LANDMARKS = {
    "left": (263, 362, 386, 374),
    "right": (33, 133, 145, 159),
}
MOUTH_LANDMARKS = (13, 14, 78, 308)
POSE_LANDMARKS = (1, 152, 33, 263, 61, 291)
POSE_MODEL_POINTS = np.array(
    [
        (0.0, 0.0, 0.0),
        (0.0, -63.6, -12.5),
        (-43.3, 32.7, -26.0),
        (43.3, 32.7, -26.0),
        (-28.9, -28.9, -24.1),
        (28.9, -28.9, -24.1),
    ],
    dtype=np.float64,
)


class HeadPose(BaseModel):
    pitch: float
    yaw: float
    roll: float


class DetectionEvent(BaseModel):
    type: str
    severity: str
    message: str
    durationMs: int


class DetectionResponse(BaseModel):
    sessionId: str
    timestamp: datetime
    hasFace: bool
    eyeStatus: str
    ear: float | None
    yawnDetected: bool | None
    mouthRatio: float | None
    headPose: HeadPose | None
    attentionStatus: str
    drowsinessLevel: str
    fatigueScore: int | None
    faceBox: dict[str, float] | None
    eyeLandmarks: list[list[float]] | None
    events: list[DetectionEvent]


class InferenceEngine:
    def __init__(self) -> None:
        self._landmarker: Any | None = None
        self._model_error: str | None = None
        self._lock = threading.Lock()
        self._sessions: dict[str, dict[str, Any]] = {}

    def initialize(self) -> None:
        if not MODEL_PATH.is_file():
            self._model_error = f"FaceLandmarker model not found: {MODEL_PATH}"
            logger.error(self._model_error)
            return

        try:
            options = vision.FaceLandmarkerOptions(
                base_options=mp_python.BaseOptions(model_asset_path=str(MODEL_PATH)),
                running_mode=vision.RunningMode.IMAGE,
                num_faces=1,
                min_face_detection_confidence=0.5,
                min_face_presence_confidence=0.5,
                min_tracking_confidence=0.5,
                output_face_blendshapes=False,
                output_facial_transformation_matrixes=False,
            )
            self._landmarker = vision.FaceLandmarker.create_from_options(options)
            self._model_error = None
        except Exception as exc:
            self._model_error = f"Unable to load FaceLandmarker model: {exc}"
            logger.exception("FaceLandmarker initialization failed")

    @property
    def ready(self) -> bool:
        return self._landmarker is not None

    @property
    def model_error(self) -> str | None:
        return self._model_error

    def close_session(self, session_id: str) -> None:
        with self._lock:
            self._sessions.pop(session_id, None)

    def close(self) -> None:
        if self._landmarker is not None:
            self._landmarker.close()
            self._landmarker = None

    def infer(self, session_id: str, encoded_frame: bytes) -> dict[str, Any]:
        if self._landmarker is None:
            raise RuntimeError(self._model_error or "FaceLandmarker is unavailable")

        image_buffer = np.frombuffer(encoded_frame, dtype=np.uint8)
        frame = cv2.imdecode(image_buffer, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Frame is not a valid encoded image")

        height, width = frame.shape[:2]
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        with self._lock:
            result = self._landmarker.detect(image)
            now = time.monotonic()
            state = self._sessions.setdefault(
                session_id,
                {
                    "last_frame": now,
                    "eye_closed_seconds": 0.0,
                    "yawn_seconds": 0.0,
                    "distracted_seconds": 0.0,
                    "eye_event_sent": False,
                    "yawn_event_sent": False,
                    "distraction_event_sent": False,
                },
            )
            elapsed = min(max(now - state["last_frame"], 0.0), 1.0)
            state["last_frame"] = now

            faces = result.face_landmarks
            if not faces:
                self._reset_signals(state)
                return self._empty_result(session_id)

            landmarks = faces[0]
            ear = self._eye_aspect_ratio(landmarks)
            mouth_ratio = self._mouth_ratio(landmarks)
            head_pose = self._head_pose(landmarks, width, height)
            eye_closed = ear < EYE_CLOSED_THRESHOLD
            mouth_open = mouth_ratio > YAWN_THRESHOLD
            inattentive = (
                abs(head_pose["yaw"]) > HEAD_POSE_THRESHOLD_DEGREES
                or abs(head_pose["pitch"]) > HEAD_POSE_THRESHOLD_DEGREES
            )

            state["eye_closed_seconds"] = (
                state["eye_closed_seconds"] + elapsed if eye_closed else 0.0
            )
            state["yawn_seconds"] = (
                state["yawn_seconds"] + elapsed if mouth_open else 0.0
            )
            state["distracted_seconds"] = (
                state["distracted_seconds"] + elapsed if inattentive else 0.0
            )

            yawn_detected = state["yawn_seconds"] >= YAWN_SECONDS
            eye_closure_alert = state["eye_closed_seconds"] >= EYE_CLOSURE_SECONDS
            distraction_alert = state["distracted_seconds"] >= DISTRACTION_SECONDS
            events = self._events(
                state, eye_closure_alert, yawn_detected, distraction_alert
            )

            drowsiness_level = (
                "High"
                if eye_closure_alert or (eye_closed and yawn_detected)
                else "Moderate"
                if eye_closed or yawn_detected or inattentive
                else "Low"
            )
            fatigue_score = min(
                100,
                (45 if eye_closure_alert else 0)
                + (25 if yawn_detected else 0)
                + (30 if inattentive else 0),
            )
            points = np.array(
                [[landmarks[index].x, landmarks[index].y] for index in range(len(landmarks))],
                dtype=np.float64,
            )
            min_x, min_y = points.min(axis=0)
            max_x, max_y = points.max(axis=0)

            return {
                "sessionId": session_id,
                "timestamp": datetime.now(timezone.utc),
                "hasFace": True,
                "eyeStatus": "Closed" if eye_closed else "Open",
                "ear": round(float(ear), 4),
                "yawnDetected": yawn_detected,
                "mouthRatio": round(float(mouth_ratio), 4),
                "headPose": {
                    key: round(float(value), 2)
                    for key, value in head_pose.items()
                },
                "attentionStatus": "Inattentive" if inattentive else "Attentive",
                "drowsinessLevel": drowsiness_level,
                "fatigueScore": fatigue_score,
                "faceBox": {
                    "x": max(0.0, float(min_x)),
                    "y": max(0.0, float(min_y)),
                    "width": min(1.0, float(max_x - min_x)),
                    "height": min(1.0, float(max_y - min_y)),
                },
                "eyeLandmarks": [
                    [float(landmarks[index].x), float(landmarks[index].y)]
                    for indices in EYE_LANDMARKS.values()
                    for index in indices
                ],
                "events": events,
            }

    @staticmethod
    def _eye_aspect_ratio(landmarks: list[Any]) -> float:
        ratios = []
        for left, right, upper, lower in EYE_LANDMARKS.values():
            width = np.linalg.norm(
                np.array([landmarks[left].x, landmarks[left].y])
                - np.array([landmarks[right].x, landmarks[right].y])
            )
            height = np.linalg.norm(
                np.array([landmarks[upper].x, landmarks[upper].y])
                - np.array([landmarks[lower].x, landmarks[lower].y])
            )
            ratios.append(float(height / width) if width > 0 else 0.0)
        return float(sum(ratios) / len(ratios))

    @staticmethod
    def _mouth_ratio(landmarks: list[Any]) -> float:
        top, bottom, left, right = MOUTH_LANDMARKS
        mouth_height = abs(landmarks[top].y - landmarks[bottom].y)
        mouth_width = abs(landmarks[left].x - landmarks[right].x)
        return float(mouth_height / mouth_width) if mouth_width > 0 else 0.0

    @staticmethod
    def _head_pose(landmarks: list[Any], width: int, height: int) -> dict[str, float]:
        image_points = np.array(
            [
                (landmarks[index].x * width, landmarks[index].y * height)
                for index in POSE_LANDMARKS
            ],
            dtype=np.float64,
        )
        focal_length = float(width)
        camera_matrix = np.array(
            [
                [focal_length, 0.0, width / 2.0],
                [0.0, focal_length, height / 2.0],
                [0.0, 0.0, 1.0],
            ],
            dtype=np.float64,
        )
        success, rotation_vector, _ = cv2.solvePnP(
            POSE_MODEL_POINTS,
            image_points,
            camera_matrix,
            np.zeros((4, 1), dtype=np.float64),
            flags=cv2.SOLVEPNP_ITERATIVE,
        )
        if not success:
            raise RuntimeError("Head pose estimation failed")

        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
        angles, *_ = cv2.RQDecomp3x3(rotation_matrix)
        return {
            "pitch": float(angles[0] * 360),
            "yaw": float(angles[1] * 360),
            "roll": float(angles[2] * 360),
        }

    @staticmethod
    def _events(
        state: dict[str, Any],
        eye_alert: bool,
        yawn_alert: bool,
        distraction_alert: bool,
    ) -> list[dict[str, Any]]:
        rules = (
            (
                "EYE_CLOSURE",
                "CRITICAL",
                "Prolonged eye closure detected",
                eye_alert,
                "eye_event_sent",
                "eye_closed_seconds",
            ),
            (
                "YAWNING",
                "WARNING",
                "Sustained yawn detected",
                yawn_alert,
                "yawn_event_sent",
                "yawn_seconds",
            ),
            (
                "DISTRACTION",
                "WARNING",
                "Prolonged head pose away from the forward direction",
                distraction_alert,
                "distraction_event_sent",
                "distracted_seconds",
            ),
        )
        events = []
        for event_type, severity, message, active, sent_key, duration_key in rules:
            if active and not state[sent_key]:
                events.append(
                    {
                        "type": event_type,
                        "severity": severity,
                        "message": message,
                        "durationMs": round(state[duration_key] * 1000),
                    }
                )
                state[sent_key] = True
            elif not active:
                state[sent_key] = False
        return events

    @staticmethod
    def _reset_signals(state: dict[str, Any]) -> None:
        for key in (
            "eye_closed_seconds",
            "yawn_seconds",
            "distracted_seconds",
        ):
            state[key] = 0.0
        for key in ("eye_event_sent", "yawn_event_sent", "distraction_event_sent"):
            state[key] = False

    @staticmethod
    def _empty_result(session_id: str) -> dict[str, Any]:
        return {
            "sessionId": session_id,
            "timestamp": datetime.now(timezone.utc),
            "hasFace": False,
            "eyeStatus": "Unknown",
            "ear": None,
            "yawnDetected": None,
            "mouthRatio": None,
            "headPose": None,
            "attentionStatus": "Unknown",
            "drowsinessLevel": "Unknown",
            "fatigueScore": None,
            "faceBox": None,
            "eyeLandmarks": None,
            "events": [],
        }


engine = InferenceEngine()
app = FastAPI(title="Driver Attention Inference Service", version="1.0.0")


@app.on_event("startup")
def initialize_model() -> None:
    engine.initialize()


@app.on_event("shutdown")
def close_model() -> None:
    engine.close()


def require_service_key(provided_key: str | None) -> None:
    expected_key = os.getenv("ML_SERVICE_API_KEY")
    if not expected_key:
        raise HTTPException(
            status_code=503, detail="ML_SERVICE_API_KEY is not configured"
        )
    if provided_key is None or provided_key != expected_key:
        raise HTTPException(status_code=401, detail="Invalid service credentials")


@app.get("/health")
def health(x_service_key: str | None = Header(default=None)) -> dict[str, Any]:
    require_service_key(x_service_key)
    if not engine.ready:
        raise HTTPException(
            status_code=503,
            detail="FaceLandmarker model is unavailable",
        )
    return {"status": "ready", "model": MODEL_PATH.name}


@app.post("/infer", response_model=DetectionResponse)
async def infer(
    request: Request,
    session_id: str,
    x_service_key: str | None = Header(default=None),
) -> dict[str, Any]:
    require_service_key(x_service_key)
    if not session_id or len(session_id) > 64:
        raise HTTPException(status_code=400, detail="Invalid session ID")
    if not engine.ready:
        raise HTTPException(
            status_code=503,
            detail=engine.model_error or "FaceLandmarker is unavailable",
        )

    frame = await request.body()
    if not frame or len(frame) > MAX_FRAME_BYTES:
        raise HTTPException(
            status_code=413 if frame else 400,
            detail="Frame must be non-empty and no larger than 2 MB",
        )

    try:
        return await run_in_threadpool(engine.infer, session_id, frame)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("Inference failed for session %s", session_id)
        raise HTTPException(status_code=500, detail="Frame inference failed") from exc


@app.delete("/sessions/{session_id}")
def close_session(
    session_id: str,
    x_service_key: str | None = Header(default=None),
) -> dict[str, str]:
    require_service_key(x_service_key)
    engine.close_session(session_id)
    return {"status": "closed"}
