"""Configuration loading and validation utilities."""

from __future__ import annotations

import copy
from pathlib import Path
from typing import Any, Dict, List, Optional

import yaml

# Fixed class mapping used everywhere in the project.
CLASS_TO_IDX: Dict[str, int] = {
    "Closed_Eyes": 0,
    "No_yawn": 1,
    "Open_Eyes": 2,
    "Yawn": 3,
}

IDX_TO_CLASS: Dict[int, str] = {v: k for k, v in CLASS_TO_IDX.items()}
CLASS_NAMES: List[str] = [IDX_TO_CLASS[i] for i in range(len(IDX_TO_CLASS))]

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_CONFIG_PATH = PROJECT_ROOT / "configs" / "config.yaml"


def _deep_merge(base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
    """Recursively merge *override* into a copy of *base*."""
    result = copy.deepcopy(base)
    for key, value in override.items():
        if key in result and isinstance(result[key], dict) and isinstance(value, dict):
            result[key] = _deep_merge(result[key], value)
        else:
            result[key] = copy.deepcopy(value)
    return result


def load_config(config_path: Optional[str | Path] = None) -> Dict[str, Any]:
    """Load YAML configuration and resolve project-relative paths.

    Args:
        config_path: Optional path to a YAML config file. Defaults to
            ``configs/config.yaml`` relative to the project root.

    Returns:
        Configuration dictionary with absolute paths where applicable.

    Raises:
        FileNotFoundError: If the config file does not exist.
        ValueError: If required keys are missing or class mapping is invalid.
    """
    path = Path(config_path) if config_path else DEFAULT_CONFIG_PATH
    if not path.is_absolute():
        path = PROJECT_ROOT / path
    if not path.exists():
        raise FileNotFoundError(f"Configuration file not found: {path}")

    with path.open("r", encoding="utf-8") as handle:
        config = yaml.safe_load(handle)

    if not isinstance(config, dict):
        raise ValueError(f"Invalid configuration format in {path}")

    _validate_config(config)
    return _resolve_paths(config)


def _validate_config(config: Dict[str, Any]) -> None:
    """Validate required sections and the fixed class mapping."""
    required = [
        "dataset",
        "model",
        "training",
        "runtime",
        "drowsiness",
        "fatigue_score",
        "alerts",
    ]
    missing = [key for key in required if key not in config]
    if missing:
        raise ValueError(f"Missing required config sections: {missing}")

    mapping = config["dataset"].get("class_to_idx", {})
    if mapping != CLASS_TO_IDX:
        raise ValueError(
            "dataset.class_to_idx must match the fixed mapping "
            f"{CLASS_TO_IDX}, got {mapping}"
        )


def _resolve_paths(config: Dict[str, Any]) -> Dict[str, Any]:
    """Convert relative project paths to absolute paths."""
    resolved = copy.deepcopy(config)
    path_keys = [
        "results",
        "plots",
        "confusion_matrix",
        "metrics",
        "predictions",
        "runs",
        "logs",
    ]
    paths = resolved.setdefault("paths", {})
    for key in path_keys:
        value = paths.get(key, key if key != "results" else "results")
        path = Path(value)
        if not path.is_absolute():
            path = PROJECT_ROOT / path
        paths[key] = str(path)

    checkpoint_dir = resolved["training"].get("checkpoint_dir", "models")
    ckpt = Path(checkpoint_dir)
    if not ckpt.is_absolute():
        ckpt = PROJECT_ROOT / ckpt
    resolved["training"]["checkpoint_dir"] = str(ckpt)

    return resolved


def get_class_names(config: Optional[Dict[str, Any]] = None) -> List[str]:
    """Return ordered class names."""
    if config is None:
        return list(CLASS_NAMES)
    mapping = config["dataset"]["class_to_idx"]
    return [name for name, _ in sorted(mapping.items(), key=lambda item: item[1])]


def save_config_snapshot(config: Dict[str, Any], destination: str | Path) -> None:
    """Persist a copy of the active configuration for reproducibility."""
    dest = Path(destination)
    dest.parent.mkdir(parents=True, exist_ok=True)
    with dest.open("w", encoding="utf-8") as handle:
        yaml.safe_dump(config, handle, default_flow_style=False, sort_keys=False)
