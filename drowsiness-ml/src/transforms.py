"""Image transforms for training, validation, and inference."""

from __future__ import annotations

from typing import Any, Dict, Tuple

from torchvision import transforms

IMAGENET_MEAN: Tuple[float, float, float] = (0.485, 0.456, 0.406)
IMAGENET_STD: Tuple[float, float, float] = (0.229, 0.224, 0.225)


def get_train_transforms(config: Dict[str, Any]) -> transforms.Compose:
    """Build training augmentation pipeline (mild, eye/yawn-preserving).

    Args:
        config: Full project configuration.

    Returns:
        Composed torchvision transforms for training.
    """
    image_size = int(config["dataset"]["image_size"])
    aug = config.get("augmentation", {})
    crop_scale = tuple(aug.get("random_resized_crop_scale", [0.85, 1.0]))
    flip_prob = float(aug.get("horizontal_flip_prob", 0.5))
    rotation = float(aug.get("rotation_degrees", 10))
    jitter = aug.get("color_jitter", {})
    affine = aug.get("affine", {})

    return transforms.Compose(
        [
            transforms.RandomResizedCrop(
                size=image_size,
                scale=crop_scale,
                ratio=(0.9, 1.1),
            ),
            transforms.RandomHorizontalFlip(p=flip_prob),
            transforms.RandomRotation(degrees=rotation),
            transforms.ColorJitter(
                brightness=float(jitter.get("brightness", 0.2)),
                contrast=float(jitter.get("contrast", 0.2)),
                saturation=float(jitter.get("saturation", 0.15)),
                hue=float(jitter.get("hue", 0.02)),
            ),
            transforms.RandomAffine(
                degrees=float(affine.get("degrees", 5)),
                translate=tuple(affine.get("translate", [0.05, 0.05])),
                scale=tuple(affine.get("scale", [0.95, 1.05])),
            ),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )


def get_eval_transforms(config: Dict[str, Any]) -> transforms.Compose:
    """Build deterministic validation/test/inference preprocessing.

    Pipeline: Resize → CenterCrop → Tensor → Normalize.
    """
    image_size = int(config["dataset"]["image_size"])
    resize_size = int(round(image_size * 256 / 224))

    return transforms.Compose(
        [
            transforms.Resize(resize_size),
            transforms.CenterCrop(image_size),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )


def get_inference_transforms(image_size: int = 224) -> transforms.Compose:
    """Deterministic transforms for single-image / webcam inference."""
    resize_size = int(round(image_size * 256 / 224))
    return transforms.Compose(
        [
            transforms.Resize(resize_size),
            transforms.CenterCrop(image_size),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )
