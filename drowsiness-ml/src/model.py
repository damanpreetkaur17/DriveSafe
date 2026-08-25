"""MobileNetV3-Large model factory with staged transfer learning."""

from __future__ import annotations

from typing import Any, Dict, Optional

import torch
import torch.nn as nn
from torchvision import models
from torchvision.models import MobileNet_V3_Large_Weights

from .utils import count_parameters, setup_logging

logger = setup_logging("drowsiness.model")


def create_model(
    config: Dict[str, Any],
    device: Optional[torch.device] = None,
) -> nn.Module:
    """Create MobileNetV3-Large with a 4-class classifier head.

    Args:
        config: Project configuration.
        device: Optional device to move the model onto.

    Returns:
        Instantiated model (optionally on *device*).
    """
    model_cfg = config["model"]
    name = model_cfg.get("name", "mobilenet_v3_large")
    num_classes = int(model_cfg.get("num_classes", 4))
    pretrained = bool(model_cfg.get("pretrained", True))

    if name != "mobilenet_v3_large":
        raise ValueError(
            f"Unsupported model '{name}'. Only 'mobilenet_v3_large' is implemented."
        )

    weights = MobileNet_V3_Large_Weights.IMAGENET1K_V2 if pretrained else None
    model = models.mobilenet_v3_large(weights=weights)

    in_features = model.classifier[-1].in_features
    model.classifier[-1] = nn.Linear(in_features, num_classes)

    if device is not None:
        model = model.to(device)

    trainable, total = count_parameters(model)
    logger.info(
        "Created %s | classes=%d | pretrained=%s | params trainable/total=%s/%s",
        name,
        num_classes,
        pretrained,
        f"{trainable:,}",
        f"{total:,}",
    )
    return model


def freeze_backbone(model: nn.Module) -> None:
    """Freeze all layers except the classifier head (Stage 1)."""
    for param in model.features.parameters():
        param.requires_grad = False
    for param in model.classifier.parameters():
        param.requires_grad = True
    trainable, total = count_parameters(model)
    logger.info(
        "Stage 1 freeze: trainable=%s / total=%s",
        f"{trainable:,}",
        f"{total:,}",
    )


def unfreeze_later_layers(model: nn.Module, unfreeze_from_block: int = 12) -> None:
    """Unfreeze later feature blocks plus classifier (Stage 2).

    MobileNetV3-Large ``features`` is a Sequential of inverted residual blocks.
    Blocks with index ``>= unfreeze_from_block`` are unfrozen.

    Args:
        model: MobileNetV3 model.
        unfreeze_from_block: First feature block index to unfreeze.
    """
    for param in model.parameters():
        param.requires_grad = False

    num_blocks = len(model.features)
    start = max(0, min(unfreeze_from_block, num_blocks - 1))
    for idx in range(start, num_blocks):
        for param in model.features[idx].parameters():
            param.requires_grad = True

    for param in model.classifier.parameters():
        param.requires_grad = True

    trainable, total = count_parameters(model)
    logger.info(
        "Stage 2 unfreeze from block %d/%d: trainable=%s / total=%s",
        start,
        num_blocks - 1,
        f"{trainable:,}",
        f"{total:,}",
    )


def get_trainable_parameters(model: nn.Module):
    """Yield parameters that require gradients."""
    return (param for param in model.parameters() if param.requires_grad)
