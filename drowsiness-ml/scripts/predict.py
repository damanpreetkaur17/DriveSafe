#!/usr/bin/env python3
"""Single-image prediction CLI."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.config import load_config
from src.inference import DrowsinessPredictor, format_prediction
from src.utils import ensure_dir, save_json, setup_logging

logger = setup_logging("drowsiness.predict_script")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Predict drowsiness class for a single image."
    )
    parser.add_argument(
        "--image",
        type=str,
        required=True,
        help="Path to input image",
    )
    parser.add_argument(
        "--config",
        type=str,
        default=None,
        help="Path to config YAML",
    )
    parser.add_argument(
        "--checkpoint",
        type=str,
        default=None,
        help="Checkpoint path (default: models/best_model.pth)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        config = load_config(args.config)
        ckpt = args.checkpoint or str(
            Path(config["training"]["checkpoint_dir"])
            / config["training"].get("best_model_name", "best_model.pth")
        )
        predictor = DrowsinessPredictor(ckpt, config)
        result = predictor.predict(args.image)
        print(format_prediction(result))

        out_dir = ensure_dir(config["paths"]["predictions"])
        out_path = Path(out_dir) / f"{Path(args.image).stem}_prediction.json"
        save_json(result, out_path)
        logger.info("Saved prediction → %s", out_path)
        return 0
    except FileNotFoundError as exc:
        logger.error("%s", exc)
        return 1
    except ValueError as exc:
        logger.error("%s", exc)
        return 1
    except Exception as exc:  # noqa: BLE001
        logger.exception("Prediction failed: %s", exc)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
