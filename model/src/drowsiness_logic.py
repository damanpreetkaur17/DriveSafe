"""Temporal drowsiness logic, prediction smoothing, and fatigue scoring.

This module implements an engineering heuristic for driver monitoring.
It is NOT a medically validated fatigue assessment.
"""

from __future__ import annotations

from collections import Counter, deque
from dataclasses import dataclass, field
from typing import Any, Deque, Dict, List, Optional, Tuple

import numpy as np
import time

from .config import CLASS_NAMES, CLASS_TO_IDX


CLOSED_EYES = CLASS_TO_IDX["Closed_Eyes"]
NO_YAWN = CLASS_TO_IDX["No_yawn"]
OPEN_EYES = CLASS_TO_IDX["Open_Eyes"]
YAWN = CLASS_TO_IDX["Yawn"]


@dataclass
class DrowsinessState:
    """Snapshot of the temporal drowsiness / fatigue state."""

    smoothed_class: str
    smoothed_index: int
    confidence: float
    fatigue_score: float
    fatigue_level: str
    closed_eye_duration: float
    yawn_count_window: int
    alert_message: str
    probabilities: Dict[str, float] = field(default_factory=dict)
    is_prolonged_closure: bool = False
    is_normal_blink: bool = False


class PredictionSmoother:
    """Temporal smoothing via averaged probabilities and majority vote."""

    def __init__(self, history_size: int = 15, smoothing_window: int = 5) -> None:
        self.history_size = max(1, history_size)
        self.smoothing_window = max(1, min(smoothing_window, history_size))
        self._prob_history: Deque[np.ndarray] = deque(maxlen=self.history_size)
        self._class_history: Deque[int] = deque(maxlen=self.history_size)

    def update(
        self,
        probabilities: Dict[str, float] | np.ndarray,
        predicted_index: Optional[int] = None,
    ) -> Tuple[int, float, Dict[str, float]]:
        """Ingest a new prediction and return smoothed (index, confidence, probs)."""
        if isinstance(probabilities, dict):
            arr = np.array(
                [probabilities.get(name, 0.0) for name in CLASS_NAMES],
                dtype=np.float64,
            )
        else:
            arr = np.asarray(probabilities, dtype=np.float64)

        if arr.sum() > 0:
            arr = arr / arr.sum()

        self._prob_history.append(arr)
        raw_idx = int(np.argmax(arr)) if predicted_index is None else int(predicted_index)
        self._class_history.append(raw_idx)

        window = list(self._prob_history)[-self.smoothing_window :]
        avg = np.mean(window, axis=0)
        avg = avg / max(avg.sum(), 1e-8)

        # Majority vote over the same window as a stability check.
        vote_window = list(self._class_history)[-self.smoothing_window :]
        vote_idx = Counter(vote_window).most_common(1)[0][0]
        avg_idx = int(np.argmax(avg))

        # Prefer probability average; fall back to majority if they disagree
        # and the vote margin is clear (>= 60% of the window).
        if avg_idx != vote_idx:
            vote_share = vote_window.count(vote_idx) / len(vote_window)
            chosen = vote_idx if vote_share >= 0.6 else avg_idx
        else:
            chosen = avg_idx

        confidence = float(avg[chosen])
        prob_dict = {CLASS_NAMES[i]: float(avg[i]) for i in range(len(CLASS_NAMES))}
        return chosen, confidence, prob_dict

    def reset(self) -> None:
        self._prob_history.clear()
        self._class_history.clear()


class DrowsinessMonitor:
    """Track eye-closure / yawn events and compute a fatigue score."""

    def __init__(self, config: Dict[str, Any]) -> None:
        dcfg = config["drowsiness"]
        fcfg = config["fatigue_score"]

        self.closed_eye_warning = float(dcfg["closed_eye_warning_seconds"])
        self.closed_eye_critical = float(dcfg["closed_eye_critical_seconds"])
        self.yawn_warning_count = int(dcfg["yawn_warning_count"])
        self.yawn_window = float(dcfg["yawn_window_seconds"])
        self.yawn_min_duration = float(dcfg.get("yawn_min_duration_seconds", 0.8))
        self.blink_max = float(dcfg.get("blink_max_seconds", 0.5))

        self.eye_weight = float(fcfg["eye_closure_weight"])
        self.yawn_weight = float(fcfg["yawning_weight"])
        self.repeat_weight = float(fcfg["repeated_closure_weight"])
        levels = fcfg.get("levels", {})
        self.normal_max = float(levels.get("normal_max", 29))
        self.warning_max = float(levels.get("warning_max", 59))
        self.drowsy_max = float(levels.get("drowsy_max", 79))

        self.smoother = PredictionSmoother(
            history_size=int(dcfg["prediction_history_size"]),
            smoothing_window=int(dcfg["smoothing_window"]),
        )

        self._closed_start: Optional[float] = None
        self._yawn_start: Optional[float] = None
        self._closure_events: Deque[float] = deque()
        self._yawn_events: Deque[float] = deque()
        self._last_state: Optional[DrowsinessState] = None

    def update(
        self,
        probabilities: Dict[str, float] | np.ndarray,
        predicted_index: Optional[int] = None,
        timestamp: Optional[float] = None,
    ) -> DrowsinessState:
        """Update temporal state from a new model prediction."""
        now = timestamp if timestamp is not None else time.time()
        idx, confidence, probs = self.smoother.update(probabilities, predicted_index)
        class_name = CLASS_NAMES[idx]

        closed_duration = self._update_eye_closure(idx, now)
        yawn_count = self._update_yawning(idx, now)

        is_blink = (
            0.0 < closed_duration <= self.blink_max and idx != CLOSED_EYES
        )
        is_prolonged = closed_duration >= self.closed_eye_warning

        fatigue = self._compute_fatigue(
            closed_duration=closed_duration,
            yawn_count=yawn_count,
            confidence=confidence,
            now=now,
        )
        level = self._score_to_level(fatigue)
        alert = self._alert_message(level, closed_duration, yawn_count)

        state = DrowsinessState(
            smoothed_class=class_name,
            smoothed_index=idx,
            confidence=confidence,
            fatigue_score=fatigue,
            fatigue_level=level,
            closed_eye_duration=closed_duration,
            yawn_count_window=yawn_count,
            alert_message=alert,
            probabilities=probs,
            is_prolonged_closure=is_prolonged,
            is_normal_blink=is_blink,
        )
        self._last_state = state
        return state

    def _update_eye_closure(self, idx: int, now: float) -> float:
        if idx == CLOSED_EYES:
            if self._closed_start is None:
                self._closed_start = now
            return now - self._closed_start

        # Eyes reopened — record event if it was a meaningful closure.
        if self._closed_start is not None:
            duration = now - self._closed_start
            if duration >= self.blink_max:
                self._closure_events.append(now)
            self._closed_start = None
            return 0.0
        return 0.0

    def _update_yawning(self, idx: int, now: float) -> int:
        if idx == YAWN:
            if self._yawn_start is None:
                self._yawn_start = now
        else:
            if self._yawn_start is not None:
                duration = now - self._yawn_start
                if duration >= self.yawn_min_duration:
                    self._yawn_events.append(now)
                self._yawn_start = None

        # Prune events outside the rolling window.
        cutoff = now - self.yawn_window
        while self._yawn_events and self._yawn_events[0] < cutoff:
            self._yawn_events.popleft()
        while self._closure_events and self._closure_events[0] < cutoff:
            self._closure_events.popleft()

        # Count an in-progress prolonged yawn as well.
        count = len(self._yawn_events)
        if self._yawn_start is not None and (now - self._yawn_start) >= self.yawn_min_duration:
            count += 1
        return count

    def _compute_fatigue(
        self,
        closed_duration: float,
        yawn_count: int,
        confidence: float,
        now: float,
    ) -> float:
        # Eye-closure component (0–eye_weight).
        if closed_duration <= 0:
            eye_score = 0.0
        elif closed_duration < self.closed_eye_warning:
            eye_score = (closed_duration / self.closed_eye_warning) * (self.eye_weight * 0.4)
        elif closed_duration < self.closed_eye_critical:
            ratio = (closed_duration - self.closed_eye_warning) / max(
                self.closed_eye_critical - self.closed_eye_warning, 1e-6
            )
            eye_score = self.eye_weight * (0.4 + 0.4 * ratio)
        else:
            eye_score = self.eye_weight

        # Yawning component (0–yawn_weight).
        yawn_ratio = min(yawn_count / max(self.yawn_warning_count, 1), 2.0) / 2.0
        yawn_score = yawn_ratio * self.yawn_weight

        # Repeated closure events in the yawn window (0–repeat_weight).
        repeat_ratio = min(len(self._closure_events) / 3.0, 1.0)
        repeat_score = repeat_ratio * self.repeat_weight

        # Slight confidence modulation: low confidence softens the score.
        confidence_factor = 0.7 + 0.3 * float(np.clip(confidence, 0.0, 1.0))

        total = (eye_score + yawn_score + repeat_score) * confidence_factor
        return float(np.clip(total, 0.0, 100.0))

    def _score_to_level(self, score: float) -> str:
        if score <= self.normal_max:
            return "NORMAL"
        if score <= self.warning_max:
            return "WARNING"
        if score <= self.drowsy_max:
            return "DROWSY"
        return "CRITICAL"

    def _alert_message(
        self,
        level: str,
        closed_duration: float,
        yawn_count: int,
    ) -> str:
        if level == "CRITICAL":
            return "CRITICAL: TAKE A BREAK"
        if level == "DROWSY":
            return "WARNING: DRIVER FATIGUE DETECTED"
        if level == "WARNING":
            if closed_duration >= self.closed_eye_warning:
                return "WARNING: PROLONGED EYE CLOSURE"
            if yawn_count >= self.yawn_warning_count:
                return "WARNING: FREQUENT YAWNING"
            return "WARNING: ELEVATED FATIGUE"
        return ""

    def reset(self) -> None:
        """Clear all temporal state."""
        self.smoother.reset()
        self._closed_start = None
        self._yawn_start = None
        self._closure_events.clear()
        self._yawn_events.clear()
        self._last_state = None
