"""MediaPipe Face Landmarker (Tasks API) face detection and cropping.

Supports MediaPipe >= 0.10 Tasks ``FaceLandmarker``. Falls back to OpenCV Haar
if MediaPipe or the model asset is unavailable.
"""

from __future__ import annotations

import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np

from .config import PROJECT_ROOT
from .utils import ensure_dir, setup_logging

logger = setup_logging("drowsiness.face")

FACE_LANDMARKER_URL = (
    "https://storage.googleapis.com/mediapipe-models/"
    "face_landmarker/face_landmarker/float16/1/face_landmarker.task"
)
FACE_LANDMARKER_FILENAME = "face_landmarker.task"


@dataclass
class FaceBox:
    """Axis-aligned face bounding box in pixel coordinates."""

    x1: int
    y1: int
    x2: int
    y2: int
    score: float = 1.0

    @property
    def width(self) -> int:
        return max(0, self.x2 - self.x1)

    @property
    def height(self) -> int:
        return max(0, self.y2 - self.y1)

    @property
    def area(self) -> int:
        return self.width * self.height

    def as_tuple(self) -> Tuple[int, int, int, int]:
        return self.x1, self.y1, self.x2, self.y2


def _ensure_landmarker_model(models_dir: Path) -> Path:
    """Download the Face Landmarker ``.task`` model if missing."""
    ensure_dir(models_dir)
    model_path = models_dir / FACE_LANDMARKER_FILENAME
    if model_path.exists() and model_path.stat().st_size > 0:
        return model_path

    logger.info("Downloading MediaPipe Face Landmarker model → %s", model_path)
    try:
        urllib.request.urlretrieve(FACE_LANDMARKER_URL, model_path)
    except Exception as exc:  # noqa: BLE001
        if model_path.exists():
            model_path.unlink(missing_ok=True)
        raise RuntimeError(
            f"Failed to download Face Landmarker model from {FACE_LANDMARKER_URL}: {exc}"
        ) from exc
    return model_path


class FaceDetector:
    """Detect faces and return the primary face crop for classification.

    Prefers MediaPipe Tasks Face Landmarker (landmarks → bounding box).
    Falls back to OpenCV Haar cascade when MediaPipe is unavailable.
    """

    def __init__(self, config: Dict[str, Any]) -> None:
        webcam_cfg = config.get("webcam", {})
        self.padding = float(webcam_cfg.get("face_padding", 0.25))
        self.min_detection_confidence = float(
            webcam_cfg.get("min_detection_confidence", 0.5)
        )
        self.min_tracking_confidence = float(
            webcam_cfg.get("min_tracking_confidence", 0.5)
        )

        self._landmarker = None
        self._haar = None
        self._backend = "none"
        self._frame_ts_ms = 0
        self._init_backend(config)

    def _init_backend(self, config: Dict[str, Any]) -> None:
        try:
            import mediapipe as mp
            from mediapipe.tasks import python as mp_python
            from mediapipe.tasks.python import vision

            models_dir = Path(
                config.get("training", {}).get("checkpoint_dir", PROJECT_ROOT / "models")
            )
            # Keep MediaPipe assets under models/mediapipe/
            asset_dir = Path(models_dir) / "mediapipe"
            model_path = _ensure_landmarker_model(asset_dir)

            options = vision.FaceLandmarkerOptions(
                base_options=mp_python.BaseOptions(model_asset_path=str(model_path)),
                running_mode=vision.RunningMode.VIDEO,
                num_faces=3,
                min_face_detection_confidence=self.min_detection_confidence,
                min_face_presence_confidence=self.min_detection_confidence,
                min_tracking_confidence=self.min_tracking_confidence,
                output_face_blendshapes=False,
                output_facial_transformation_matrixes=False,
            )
            self._landmarker = vision.FaceLandmarker.create_from_options(options)
            self._mp = mp
            self._backend = "mediapipe"
            logger.info("Face detector backend: MediaPipe Face Landmarker")
            return
        except Exception as exc:  # noqa: BLE001
            logger.warning(
                "MediaPipe Face Landmarker unavailable (%s). Falling back to OpenCV Haar.",
                exc,
            )

        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self._haar = cv2.CascadeClassifier(cascade_path)
        if self._haar.empty():
            raise RuntimeError(
                "Failed to initialize both MediaPipe and OpenCV face detectors."
            )
        self._backend = "haar"
        logger.info("Face detector backend: OpenCV Haar cascade")

    def detect(self, frame_bgr: np.ndarray) -> List[FaceBox]:
        """Detect all faces in a BGR frame."""
        if frame_bgr is None or frame_bgr.size == 0:
            return []

        if self._backend == "mediapipe":
            return self._detect_mediapipe(frame_bgr)
        return self._detect_haar(frame_bgr)

    def _detect_mediapipe(self, frame_bgr: np.ndarray) -> List[FaceBox]:
        h, w = frame_bgr.shape[:2]
        rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        # MediaPipe Image requires contiguous uint8 RGB.
        rgb = np.ascontiguousarray(rgb)
        mp_image = self._mp.Image(
            image_format=self._mp.ImageFormat.SRGB, data=rgb
        )
        self._frame_ts_ms += 33  # ~30 FPS timestamp progression
        result = self._landmarker.detect_for_video(mp_image, self._frame_ts_ms)

        boxes: List[FaceBox] = []
        if not result.face_landmarks:
            return boxes

        for landmarks in result.face_landmarks:
            xs = [lm.x * w for lm in landmarks]
            ys = [lm.y * h for lm in landmarks]
            boxes.append(self._pad_box(min(xs), min(ys), max(xs), max(ys), w, h))
        return boxes

    def _detect_haar(self, frame_bgr: np.ndarray) -> List[FaceBox]:
        h, w = frame_bgr.shape[:2]
        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        detections = self._haar.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60)
        )
        boxes: List[FaceBox] = []
        for x, y, bw, bh in detections:
            boxes.append(self._pad_box(x, y, x + bw, y + bh, w, h))
        return boxes

    def _pad_box(
        self,
        x1: float,
        y1: float,
        x2: float,
        y2: float,
        frame_w: int,
        frame_h: int,
    ) -> FaceBox:
        bw = x2 - x1
        bh = y2 - y1
        pad_x = bw * self.padding
        pad_y = bh * self.padding
        nx1 = int(max(0, x1 - pad_x))
        ny1 = int(max(0, y1 - pad_y))
        nx2 = int(min(frame_w - 1, x2 + pad_x))
        ny2 = int(min(frame_h - 1, y2 + pad_y))
        return FaceBox(nx1, ny1, nx2, ny2)

    def get_primary_face(self, frame_bgr: np.ndarray) -> Optional[FaceBox]:
        """Return the largest detected face, or ``None``."""
        boxes = self.detect(frame_bgr)
        if not boxes:
            return None
        return max(boxes, key=lambda box: box.area)

    def crop_face(
        self,
        frame_bgr: np.ndarray,
        box: Optional[FaceBox] = None,
    ) -> Optional[np.ndarray]:
        """Crop the primary (or provided) face from the frame."""
        if box is None:
            box = self.get_primary_face(frame_bgr)
        if box is None or box.area == 0:
            return None
        crop = frame_bgr[box.y1 : box.y2, box.x1 : box.x2]
        if crop.size == 0:
            return None
        return crop

    def close(self) -> None:
        """Release MediaPipe resources."""
        if self._landmarker is not None:
            self._landmarker.close()
            self._landmarker = None
