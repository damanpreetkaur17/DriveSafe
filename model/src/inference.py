"""Single-image and batch inference utilities."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import numpy as np
import torch
import torch.nn as nn
from PIL import Image, UnidentifiedImageError

from .config import CLASS_NAMES, CLASS_TO_IDX
from .model import create_model
from .transforms import get_inference_transforms
from .utils import get_device, setup_logging

logger = setup_logging("drowsiness.inference")


class DrowsinessPredictor:
    """Loads a checkpoint once and runs inference on images or tensors."""

    def __init__(
        self,
        checkpoint_path: str | Path,
        config: Dict[str, Any],
        device: Optional[torch.device] = None,
    ) -> None:
        self.config = config
        self.device = device or get_device(config["runtime"].get("device", "auto"))

        path = Path(checkpoint_path)
        if not path.exists():
            raise FileNotFoundError(
                f"Model checkpoint not found: {path}. "
                "Train a model first with: python scripts/train_model.py"
            )

        checkpoint = torch.load(path, map_location=self.device, weights_only=False)
        self.class_names: List[str] = checkpoint.get("class_names", CLASS_NAMES)
        self.class_to_idx: Dict[str, int] = checkpoint.get("class_to_idx", CLASS_TO_IDX)
        self.image_size: int = int(
            checkpoint.get("image_size", config["dataset"]["image_size"])
        )
        self.model_name: str = checkpoint.get(
            "model_name", config["model"]["name"]
        )

        self.model: nn.Module = create_model(config, device=self.device)
        self.model.load_state_dict(checkpoint["model_state_dict"])
        self.model.eval()

        self.transform = get_inference_transforms(self.image_size)
        logger.info(
            "Predictor ready | model=%s | image_size=%d | device=%s",
            self.model_name,
            self.image_size,
            self.device,
        )

    def _load_image(self, image: Union[str, Path, Image.Image, np.ndarray]) -> Image.Image:
        if isinstance(image, Image.Image):
            return image.convert("RGB")
        if isinstance(image, np.ndarray):
            # Assume BGR from OpenCV unless already RGB-like with 3 channels.
            if image.ndim == 3 and image.shape[2] == 3:
                rgb = image[:, :, ::-1] if image.dtype == np.uint8 else image
                return Image.fromarray(rgb.astype(np.uint8)).convert("RGB")
            raise ValueError("NumPy image must be HxWx3.")
        path = Path(image)
        if not path.exists():
            raise FileNotFoundError(f"Image not found: {path}")
        try:
            with Image.open(path) as img:
                return img.convert("RGB")
        except (OSError, UnidentifiedImageError) as exc:
            raise ValueError(f"Invalid or corrupted image: {path}") from exc

    @torch.inference_mode()
    def predict(
        self,
        image: Union[str, Path, Image.Image, np.ndarray],
    ) -> Dict[str, Any]:
        """Predict class probabilities for a single image.

        Returns:
            Dictionary with ``predicted_class``, ``confidence``, ``probabilities``,
            and ``class_names``.
        """
        pil_image = self._load_image(image)
        tensor = self.transform(pil_image).unsqueeze(0).to(
            self.device, non_blocking=self.device.type == "cuda"
        )

        logits = self.model(tensor)
        probs = torch.softmax(logits.float(), dim=1).squeeze(0).cpu().numpy()
        pred_idx = int(np.argmax(probs))
        confidence = float(probs[pred_idx])

        probabilities = {
            self.class_names[i]: float(probs[i]) for i in range(len(self.class_names))
        }

        return {
            "predicted_class": self.class_names[pred_idx],
            "predicted_index": pred_idx,
            "confidence": confidence,
            "probabilities": probabilities,
            "class_names": self.class_names,
        }

    @torch.inference_mode()
    def predict_tensor(self, tensor: torch.Tensor) -> Dict[str, Any]:
        """Predict from a preprocessed tensor of shape ``(1, 3, H, W)`` or ``(3, H, W)``."""
        if tensor.ndim == 3:
            tensor = tensor.unsqueeze(0)
        tensor = tensor.to(self.device, non_blocking=self.device.type == "cuda")
        logits = self.model(tensor)
        probs = torch.softmax(logits.float(), dim=1).squeeze(0).cpu().numpy()
        pred_idx = int(np.argmax(probs))
        return {
            "predicted_class": self.class_names[pred_idx],
            "predicted_index": pred_idx,
            "confidence": float(probs[pred_idx]),
            "probabilities": {
                self.class_names[i]: float(probs[i]) for i in range(len(self.class_names))
            },
            "probabilities_array": probs,
        }


def format_prediction(result: Dict[str, Any]) -> str:
    """Pretty-print a prediction result."""
    lines = [
        f"Prediction: {result['predicted_class']}",
        f"Confidence: {result['confidence'] * 100:.2f}%",
        "",
    ]
    for name, prob in result["probabilities"].items():
        lines.append(f"{name}: {prob * 100:6.2f}%")
    return "\n".join(lines)
