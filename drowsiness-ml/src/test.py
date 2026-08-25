"""Test-set evaluation entry helpers."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional

import torch
import torch.nn as nn
from torch.utils.data import DataLoader

from .dataset import create_dataloaders
from .evaluate import evaluate_predictions, save_evaluation_artifacts
from .model import create_model
from .utils import get_device, setup_logging
from .validate import collect_predictions

logger = setup_logging("drowsiness.test")


def load_model_from_checkpoint(
    checkpoint_path: str | Path,
    config: Dict[str, Any],
    device: torch.device,
) -> tuple[nn.Module, Dict[str, Any]]:
    """Load a trained model from a checkpoint file.

    Returns:
        ``(model, checkpoint_dict)``
    """
    path = Path(checkpoint_path)
    if not path.exists():
        raise FileNotFoundError(
            f"Model checkpoint not found: {path}. "
            "Train a model first with scripts/train_model.py."
        )

    checkpoint = torch.load(path, map_location=device, weights_only=False)
    model = create_model(config, device=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()
    logger.info(
        "Loaded checkpoint from %s (epoch=%s, best_val_f1=%.4f)",
        path,
        checkpoint.get("epoch"),
        float(checkpoint.get("best_val_f1", 0.0)),
    )
    return model, checkpoint


def run_test(
    config: Dict[str, Any],
    checkpoint_path: Optional[str | Path] = None,
) -> Dict[str, Any]:
    """Evaluate the best model on the held-out test set.

    Returns:
        Metrics dictionary.
    """
    device = get_device(config["runtime"].get("device", "auto"))
    ckpt_dir = Path(config["training"]["checkpoint_dir"])
    ckpt_path = Path(checkpoint_path) if checkpoint_path else (
        ckpt_dir / config["training"].get("best_model_name", "best_model.pth")
    )

    model, _ = load_model_from_checkpoint(ckpt_path, config, device)
    _, _, test_loader, _ = create_dataloaders(config)

    use_amp = bool(config["training"].get("mixed_precision", True))
    y_true, y_pred, y_proba = collect_predictions(
        model, test_loader, device, use_amp=use_amp
    )

    metrics = evaluate_predictions(y_true, y_pred, y_proba, config)
    save_evaluation_artifacts(metrics, y_true, y_pred, config)
    logger.info(
        "Test accuracy=%.4f | macro_f1=%.4f | weighted_f1=%.4f",
        metrics["accuracy"],
        metrics["macro_f1"],
        metrics["weighted_f1"],
    )
    return metrics
