"""Dataset and DataLoader factories for the drowsiness classification task."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

import torch
from PIL import Image, UnidentifiedImageError
from torch.utils.data import DataLoader, Dataset

from .config import CLASS_NAMES, CLASS_TO_IDX
from .transforms import get_eval_transforms, get_train_transforms
from .utils import setup_logging

logger = setup_logging("drowsiness.dataset")

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}


class DrowsinessDataset(Dataset):
    """Folder-based image dataset with a fixed class mapping.

    Expected layout::

        split_dir/
            Closed_Eyes/
            No_yawn/
            Open_Eyes/
            Yawn/
    """

    def __init__(
        self,
        root: str | Path,
        transform: Optional[Callable] = None,
        class_to_idx: Optional[Dict[str, int]] = None,
    ) -> None:
        self.root = Path(root)
        self.transform = transform
        self.class_to_idx = class_to_idx or dict(CLASS_TO_IDX)
        self.idx_to_class = {v: k for k, v in self.class_to_idx.items()}
        self.samples: List[Tuple[Path, int]] = []
        self.targets: List[int] = []

        if not self.root.exists():
            raise FileNotFoundError(f"Dataset split directory not found: {self.root}")

        self._scan()

    def _scan(self) -> None:
        """Scan class folders and collect readable image paths."""
        missing_dirs = []
        for class_name, class_idx in sorted(
            self.class_to_idx.items(), key=lambda item: item[1]
        ):
            class_dir = self.root / class_name
            if not class_dir.is_dir():
                missing_dirs.append(str(class_dir))
                continue

            for path in sorted(class_dir.rglob("*")):
                if not path.is_file():
                    continue
                if path.suffix.lower() not in IMAGE_EXTENSIONS:
                    continue
                # Fast path listing: corrupt files are handled in __getitem__.
                # Use scripts/analyze_dataset.py for a full integrity scan.
                self.samples.append((path, class_idx))
                self.targets.append(class_idx)

        if missing_dirs:
            raise FileNotFoundError(
                "Missing required class directories:\n  " + "\n  ".join(missing_dirs)
            )

        if not self.samples:
            raise RuntimeError(f"No valid images found under {self.root}")

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, index: int) -> Tuple[torch.Tensor, int]:
        path, label = self.samples[index]
        try:
            with Image.open(path) as image:
                image = image.convert("RGB")
                if self.transform is not None:
                    image = self.transform(image)
                return image, label
        except (OSError, UnidentifiedImageError, ValueError) as exc:
            logger.error("Failed to load image %s: %s", path, exc)
            # Return a black image so one bad sample does not crash training.
            size = 224
            if self.transform is not None:
                blank = Image.new("RGB", (size, size), color=(0, 0, 0))
                return self.transform(blank), label
            return torch.zeros(3, size, size), label

    def class_counts(self) -> Dict[str, int]:
        """Return per-class sample counts."""
        counts = {name: 0 for name in CLASS_NAMES}
        for target in self.targets:
            counts[self.idx_to_class[target]] += 1
        return counts


def compute_class_weights(dataset: DrowsinessDataset) -> torch.Tensor:
    """Inverse-frequency class weights for optional weighted CrossEntropyLoss."""
    counts = dataset.class_counts()
    total = sum(counts.values())
    num_classes = len(CLASS_NAMES)
    weights = []
    for name in CLASS_NAMES:
        count = max(counts[name], 1)
        weights.append(total / (num_classes * count))
    return torch.tensor(weights, dtype=torch.float32)


def create_dataloaders(
    config: Dict[str, Any],
) -> Tuple[DataLoader, DataLoader, DataLoader, DrowsinessDataset]:
    """Create train / val / test DataLoaders.

    Returns:
        ``(train_loader, val_loader, test_loader, train_dataset)``
    """
    root = Path(config["dataset"]["root"])
    if not root.exists():
        raise FileNotFoundError(
            f"Dataset root not found: {root}. "
            "Update dataset.root in configs/config.yaml."
        )

    splits = config["dataset"]["splits"]
    class_to_idx = config["dataset"]["class_to_idx"]
    batch_size = int(config["dataset"]["batch_size"])
    num_workers = int(config["dataset"]["num_workers"])
    pin_memory = bool(config["dataset"].get("pin_memory", True))
    persistent = bool(config["dataset"].get("persistent_workers", True)) and num_workers > 0

    train_ds = DrowsinessDataset(
        root / splits["train"],
        transform=get_train_transforms(config),
        class_to_idx=class_to_idx,
    )
    val_ds = DrowsinessDataset(
        root / splits["val"],
        transform=get_eval_transforms(config),
        class_to_idx=class_to_idx,
    )
    test_ds = DrowsinessDataset(
        root / splits["test"],
        transform=get_eval_transforms(config),
        class_to_idx=class_to_idx,
    )

    train_loader = DataLoader(
        train_ds,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        pin_memory=pin_memory,
        persistent_workers=persistent,
        drop_last=False,
    )
    val_loader = DataLoader(
        val_ds,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=pin_memory,
        persistent_workers=persistent,
    )
    test_loader = DataLoader(
        test_ds,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        pin_memory=pin_memory,
        persistent_workers=persistent,
    )

    logger.info(
        "DataLoaders ready — train=%d val=%d test=%d batch=%d workers=%d",
        len(train_ds),
        len(val_ds),
        len(test_ds),
        batch_size,
        num_workers,
    )
    return train_loader, val_loader, test_loader, train_ds
