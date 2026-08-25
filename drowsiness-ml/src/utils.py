"""Shared utilities: device selection, seeding, logging, I/O helpers."""

from __future__ import annotations

import json
import logging
import os
import random
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import numpy as np
import torch


def setup_logging(
    name: str = "drowsiness",
    log_dir: Optional[str | Path] = None,
    level: int = logging.INFO,
) -> logging.Logger:
    """Configure a console (and optional file) logger.

    Args:
        name: Logger name.
        log_dir: Optional directory for a rotating log file.
        level: Logging level.

    Returns:
        Configured logger instance.
    """
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger

    logger.setLevel(level)
    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console = logging.StreamHandler()
    console.setFormatter(formatter)
    logger.addHandler(console)

    if log_dir is not None:
        log_path = Path(log_dir)
        log_path.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_path / f"{name}.log", encoding="utf-8")
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger


def set_seed(seed: int = 42) -> None:
    """Set random seeds for reproducibility."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    # Deterministic algorithms can slow training; enable for validation fidelity.
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
    os.environ["PYTHONHASHSEED"] = str(seed)


def get_device(preference: str = "auto") -> torch.device:
    """Select compute device and print CUDA diagnostics.

    Args:
        preference: ``auto``, ``cuda``, or ``cpu``.

    Returns:
        Selected ``torch.device``.
    """
    cuda_available = torch.cuda.is_available()
    cuda_version = torch.version.cuda if cuda_available else "N/A"

    if preference == "cpu":
        device = torch.device("cpu")
        print("Device: CPU")
        print("CUDA Available: False (forced by config)")
        if cuda_available:
            print(
                "WARNING: CUDA is available but runtime.device=cpu was requested. "
                "Training and inference will use CPU."
            )
        return device

    if preference == "cuda":
        if not cuda_available:
            print("=" * 60)
            print("WARNING: CUDA was requested but is NOT available.")
            print("Falling back to CPU. Install a CUDA-enabled PyTorch build.")
            print("=" * 60)
            print("Device: CPU")
            print("CUDA Available: False")
            print(f"CUDA Version: {cuda_version}")
            return torch.device("cpu")
        device = torch.device("cuda")
    else:  # auto
        if cuda_available:
            device = torch.device("cuda")
        else:
            print("=" * 60)
            print("WARNING: CUDA is NOT available. Falling back to CPU.")
            print("For GPU acceleration, install PyTorch with CUDA support.")
            print("=" * 60)
            device = torch.device("cpu")

    if device.type == "cuda":
        gpu_name = torch.cuda.get_device_name(0)
        print("Device: CUDA")
        print(f"GPU: {gpu_name}")
        print("CUDA Available: True")
        print(f"CUDA Version: {cuda_version}")
    else:
        print("Device: CPU")
        print("CUDA Available: False")
        print(f"CUDA Version: {cuda_version}")

    return device


def ensure_dir(path: str | Path) -> Path:
    """Create a directory if it does not exist and return it."""
    directory = Path(path)
    directory.mkdir(parents=True, exist_ok=True)
    return directory


def save_json(data: Dict[str, Any], path: str | Path) -> None:
    """Save a dictionary as pretty-printed JSON."""
    destination = Path(path)
    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)


def load_json(path: str | Path) -> Dict[str, Any]:
    """Load a JSON file."""
    with Path(path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def format_duration(seconds: float) -> str:
    """Format seconds as ``Xm Ys``."""
    minutes, secs = divmod(int(seconds), 60)
    return f"{minutes}m {secs}s"


def count_parameters(model: torch.nn.Module) -> Tuple[int, int]:
    """Return (trainable, total) parameter counts."""
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    total = sum(p.numel() for p in model.parameters())
    return trainable, total
