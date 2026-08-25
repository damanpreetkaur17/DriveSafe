#!/usr/bin/env python3
"""Train the MobileNetV3 drowsiness classifier (two-stage transfer learning)."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config import load_config
from src.train import train
from src.utils import setup_logging

logger = setup_logging("drowsiness.train_script")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Train driver drowsiness detection model."
    )
    parser.add_argument(
        "--config",
        type=str,
        default=None,
        help="Path to config YAML (default: configs/config.yaml)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        config = load_config(args.config)
        summary = train(config)
        logger.info("Training finished: %s", summary)
        return 0
    except FileNotFoundError as exc:
        logger.error("%s", exc)
        return 1
    except Exception as exc:  # noqa: BLE001
        logger.exception("Training failed: %s", exc)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
