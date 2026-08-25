#!/usr/bin/env python3
"""Real-time webcam drowsiness detection with temporal fatigue logic."""

from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import cv2
import numpy as np

from src.alert import AlertManager
from src.config import load_config
from src.drowsiness_logic import DrowsinessMonitor
from src.face_detection import FaceDetector
from src.inference import DrowsinessPredictor
from src.utils import setup_logging

logger = setup_logging("drowsiness.realtime")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Real-time driver drowsiness detection via webcam."
    )
    parser.add_argument("--config", type=str, default=None)
    parser.add_argument(
        "--checkpoint",
        type=str,
        default=None,
        help="Model checkpoint (default: models/best_model.pth)",
    )
    parser.add_argument(
        "--camera",
        type=int,
        default=None,
        help="Camera index override",
    )
    return parser.parse_args()


def _draw_overlay(
    frame: np.ndarray,
    box,
    state,
    alert_message: str,
    alert_mgr: AlertManager,
    fps: float,
    latency_ms: float,
) -> None:
    h, w = frame.shape[:2]
    color = alert_mgr.color_for(state.fatigue_level)

    if box is not None:
        cv2.rectangle(frame, (box.x1, box.y1), (box.x2, box.y2), color, 2)

    state_text = state.smoothed_class.replace("_", " ").upper()
    lines = [
        f"State: {state_text}",
        f"Confidence: {state.confidence * 100:.0f}%",
        f"Fatigue Level: {state.fatigue_level}",
        f"Fatigue Score: {state.fatigue_score:.0f}",
        f"FPS: {fps:.1f}",
        f"Latency: {latency_ms:.1f} ms",
    ]

    y0 = 28
    for i, line in enumerate(lines):
        y = y0 + i * 26
        cv2.putText(
            frame,
            line,
            (12, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 0, 0),
            3,
            cv2.LINE_AA,
        )
        cv2.putText(
            frame,
            line,
            (12, y),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            color if i < 3 else (240, 240, 240),
            2,
            cv2.LINE_AA,
        )

    if alert_message:
        cv2.rectangle(frame, (0, h - 50), (w, h), color, -1)
        cv2.putText(
            frame,
            alert_message,
            (16, h - 18),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2,
            cv2.LINE_AA,
        )


def main() -> int:
    args = parse_args()
    try:
        config = load_config(args.config)
    except FileNotFoundError as exc:
        logger.error("%s", exc)
        return 1

    ckpt = args.checkpoint or str(
        Path(config["training"]["checkpoint_dir"])
        / config["training"].get("best_model_name", "best_model.pth")
    )

    try:
        predictor = DrowsinessPredictor(ckpt, config)
    except FileNotFoundError as exc:
        logger.error("%s", exc)
        return 1

    detector = FaceDetector(config)
    monitor = DrowsinessMonitor(config)
    alert_mgr = AlertManager(config)

    camera_index = (
        args.camera
        if args.camera is not None
        else int(config.get("webcam", {}).get("camera_index", 0))
    )
    mirror = bool(config.get("webcam", {}).get("mirror", True))

    cap = cv2.VideoCapture(camera_index)
    if not cap.isOpened():
        logger.error(
            "Webcam unavailable (index=%d). Check camera permissions / index.",
            camera_index,
        )
        detector.close()
        return 1

    logger.info("Webcam opened (index=%d). Press 'q' to quit, 'r' to reset.", camera_index)

    fps = 0.0
    frame_count = 0
    fps_timer = time.perf_counter()

    try:
        while True:
            ok, frame = cap.read()
            if not ok or frame is None or frame.size == 0:
                logger.warning("Empty frame received from webcam.")
                continue

            if mirror:
                frame = cv2.flip(frame, 1)

            box = detector.get_primary_face(frame)
            latency_ms = 0.0

            if box is None:
                cv2.putText(
                    frame,
                    "No face detected",
                    (12, 40),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.9,
                    (0, 0, 255),
                    2,
                    cv2.LINE_AA,
                )
            else:
                crop = detector.crop_face(frame, box)
                if crop is None or crop.size == 0:
                    cv2.putText(
                        frame,
                        "Invalid face crop",
                        (12, 40),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.9,
                        (0, 0, 255),
                        2,
                        cv2.LINE_AA,
                    )
                else:
                    t0 = time.perf_counter()
                    result = predictor.predict(crop)
                    latency_ms = (time.perf_counter() - t0) * 1000.0

                    state = monitor.update(
                        result["probabilities"],
                        predicted_index=result["predicted_index"],
                    )
                    message, _ = alert_mgr.process(
                        state.fatigue_level, state.alert_message
                    )
                    _draw_overlay(
                        frame, box, state, message, alert_mgr, fps, latency_ms
                    )

            frame_count += 1
            elapsed = time.perf_counter() - fps_timer
            if elapsed >= 1.0:
                fps = frame_count / elapsed
                frame_count = 0
                fps_timer = time.perf_counter()

            cv2.imshow("Driver Drowsiness Detection", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            if key == ord("r"):
                monitor.reset()
                alert_mgr.reset()
                logger.info("Temporal state reset.")

    except KeyboardInterrupt:
        logger.info("Interrupted by user.")
    finally:
        cap.release()
        cv2.destroyAllWindows()
        detector.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
