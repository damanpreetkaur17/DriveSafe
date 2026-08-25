"""Validation-loop helpers."""

from __future__ import annotations

from typing import Dict, List, Optional, Tuple

import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import f1_score
from torch.cuda.amp import autocast
from torch.utils.data import DataLoader
from tqdm import tqdm


@torch.no_grad()
def validate_one_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
    use_amp: bool = True,
    desc: str = "Validation",
) -> Dict[str, float]:
    """Run a full validation (or test) pass.

    Returns:
        Dictionary with ``loss``, ``accuracy``, and ``macro_f1``.
    """
    model.eval()
    running_loss = 0.0
    all_preds: List[int] = []
    all_targets: List[int] = []

    amp_enabled = use_amp and device.type == "cuda"

    for images, targets in tqdm(loader, desc=desc, leave=False):
        images = images.to(device, non_blocking=True)
        targets = targets.to(device, non_blocking=True)

        with autocast(enabled=amp_enabled):
            outputs = model(images)
            loss = criterion(outputs, targets)

        running_loss += loss.item() * images.size(0)
        preds = outputs.argmax(dim=1)
        all_preds.extend(preds.cpu().tolist())
        all_targets.extend(targets.cpu().tolist())

    num_samples = len(all_targets)
    avg_loss = running_loss / max(num_samples, 1)
    accuracy = float(np.mean(np.array(all_preds) == np.array(all_targets)))
    macro_f1 = float(
        f1_score(all_targets, all_preds, average="macro", zero_division=0)
    )

    return {
        "loss": avg_loss,
        "accuracy": accuracy,
        "macro_f1": macro_f1,
    }


@torch.no_grad()
def collect_predictions(
    model: nn.Module,
    loader: DataLoader,
    device: torch.device,
    use_amp: bool = True,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Collect targets, predictions, and softmax probabilities.

    Returns:
        ``(y_true, y_pred, y_proba)``
    """
    model.eval()
    all_targets: List[int] = []
    all_preds: List[int] = []
    all_proba: List[np.ndarray] = []
    amp_enabled = use_amp and device.type == "cuda"

    for images, targets in tqdm(loader, desc="Collecting predictions", leave=False):
        images = images.to(device, non_blocking=True)
        with autocast(enabled=amp_enabled):
            outputs = model(images)
            probs = torch.softmax(outputs.float(), dim=1)

        preds = probs.argmax(dim=1)
        all_targets.extend(targets.tolist())
        all_preds.extend(preds.cpu().tolist())
        all_proba.append(probs.cpu().numpy())

    return (
        np.array(all_targets),
        np.array(all_preds),
        np.concatenate(all_proba, axis=0),
    )
