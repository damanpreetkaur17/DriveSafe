"""Alert management with cooldown / debounce for drowsiness warnings."""

from __future__ import annotations

import time
from typing import Any, Dict, Optional, Tuple

from .utils import setup_logging

logger = setup_logging("drowsiness.alert")


class AlertManager:
    """Map fatigue levels to display messages and optional audio alerts.

    Audio is best-effort: uses ``winsound`` on Windows, otherwise a terminal bell.
    Alerts for DROWSY / CRITICAL are rate-limited by ``cooldown_seconds``.
    """

    LEVEL_COLORS = {
        "NORMAL": (40, 180, 40),      # BGR green
        "WARNING": (0, 200, 255),     # BGR amber
        "DROWSY": (0, 140, 255),      # BGR orange
        "CRITICAL": (0, 0, 255),      # BGR red
    }

    def __init__(self, config: Dict[str, Any]) -> None:
        acfg = config.get("alerts", {})
        self.enabled = bool(acfg.get("enabled", True))
        self.cooldown = float(acfg.get("cooldown_seconds", 5))
        self.audio_enabled = bool(acfg.get("audio_enabled", True))
        self._last_alert_time: float = 0.0
        self._last_alert_level: Optional[str] = None

    def process(self, fatigue_level: str, alert_message: str) -> Tuple[str, bool]:
        """Process a fatigue level and decide whether to fire an alert.

        Returns:
            ``(display_message, audio_triggered)``
        """
        if not self.enabled:
            return "", False

        level = fatigue_level.upper()
        message = alert_message or self._default_message(level)

        if level in {"NORMAL"}:
            return "", False

        if level == "WARNING":
            return message, False

        # DROWSY / CRITICAL → audio with cooldown
        now = time.time()
        should_sound = (
            self.audio_enabled
            and level in {"DROWSY", "CRITICAL"}
            and (now - self._last_alert_time) >= self.cooldown
        )

        if should_sound:
            self._play_audio(level)
            self._last_alert_time = now
            self._last_alert_level = level
            logger.info("Audio alert triggered: %s", level)

        return message, should_sound

    def _default_message(self, level: str) -> str:
        if level == "CRITICAL":
            return "CRITICAL: TAKE A BREAK"
        if level == "DROWSY":
            return "WARNING: DRIVER FATIGUE DETECTED"
        if level == "WARNING":
            return "WARNING: ELEVATED FATIGUE"
        return ""

    def _play_audio(self, level: str) -> None:
        """Best-effort audio alert (non-blocking where possible)."""
        try:
            import sys

            if sys.platform.startswith("win"):
                import winsound
                # Higher frequency / longer for CRITICAL.
                freq = 1200 if level == "CRITICAL" else 900
                duration_ms = 600 if level == "CRITICAL" else 350
                winsound.Beep(freq, duration_ms)
            else:
                # Terminal bell fallback.
                print("\a", end="", flush=True)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Audio alert failed: %s", exc)

    def color_for(self, level: str) -> Tuple[int, int, int]:
        """Return a BGR color for overlay rendering."""
        return self.LEVEL_COLORS.get(level.upper(), (200, 200, 200))

    def reset(self) -> None:
        self._last_alert_time = 0.0
        self._last_alert_level = None
