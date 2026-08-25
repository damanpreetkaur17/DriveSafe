#!/usr/bin/env python3
"""Evaluate the best checkpoint on the Test split."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config import load_config
from src.test import run_test
from src.utils import setup_logging

logger = setup_logging("drowsiness.eval_script")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Evaluate best model on the test set."
    )
    parser.add_argument(
        "--config",
        type=str,
        default=None,
        help="Path to config YAML (default: configs/config.yaml)",
    )
    parser.add_argument(
        "--checkpoint",
        type=str,
        default=None,
        help="Optional checkpoint path (default: models/best_model.pth)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        config = load_config(args.config)
        metrics = run_test(config, checkpoint_path=args.checkpoint)
        logger.info(
            "Test Results | accuracy=%.4f macro_f1=%.4f weighted_f1=%.4f",
            metrics["accuracy"],
            metrics["macro_f1"],
            metrics["weighted_f1"],
        )
        print("\n" + metrics["classification_report"])
        return 0
    except FileNotFoundError as exc:
        logger.error("%s", exc)
        return 1
    except Exception as exc:  # noqa: BLE001
        logger.exception("Evaluation failed: %s", exc)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
