#!/usr/bin/env python3
"""Analyze the drowsiness dataset and write a report + class-distribution plot."""

from __future__ import annotations

import sys
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Ensure project root is on sys.path when run as a script.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import matplotlib.pyplot as plt
import numpy as np
from PIL import Image, UnidentifiedImageError

from src.config import CLASS_NAMES, CLASS_TO_IDX, load_config
from src.utils import ensure_dir, get_device, save_json, setup_logging

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
logger = setup_logging("drowsiness.analyze")


def _scan_split(
    split_dir: Path,
) -> Dict[str, Any]:
    """Scan one split directory for per-class counts and image stats."""
    class_counts: Dict[str, int] = {name: 0 for name in CLASS_NAMES}
    corrupted: List[str] = []
    widths: List[int] = []
    heights: List[int] = []
    missing_dirs: List[str] = []

    for class_name in CLASS_NAMES:
        class_dir = split_dir / class_name
        if not class_dir.is_dir():
            missing_dirs.append(str(class_dir))
            continue

        for path in sorted(class_dir.rglob("*")):
            if not path.is_file() or path.suffix.lower() not in IMAGE_EXTENSIONS:
                continue
            try:
                with Image.open(path) as img:
                    img.verify()
                with Image.open(path) as img:
                    img = img.convert("RGB")
                    w, h = img.size
                widths.append(w)
                heights.append(h)
                class_counts[class_name] += 1
            except (OSError, UnidentifiedImageError, ValueError) as exc:
                corrupted.append(f"{path} ({exc})")

    total = sum(class_counts.values())
    percentages = {
        name: (count / total * 100.0 if total else 0.0)
        for name, count in class_counts.items()
    }

    dim_stats: Dict[str, Any] = {}
    if widths:
        dim_stats = {
            "min_width": int(min(widths)),
            "max_width": int(max(widths)),
            "avg_width": float(np.mean(widths)),
            "min_height": int(min(heights)),
            "max_height": int(max(heights)),
            "avg_height": float(np.mean(heights)),
            "min_size": [int(min(widths)), int(min(heights))],
            "max_size": [int(max(widths)), int(max(heights))],
            "avg_size": [float(np.mean(widths)), float(np.mean(heights))],
        }

    return {
        "path": str(split_dir),
        "class_counts": class_counts,
        "percentages": percentages,
        "total": total,
        "corrupted_count": len(corrupted),
        "corrupted_files": corrupted[:50],  # cap list size in report
        "missing_directories": missing_dirs,
        "dimension_stats": dim_stats,
    }


def _plot_distribution(report: Dict[str, Any], output_path: Path) -> None:
    splits = ["Train", "Val", "Test"]
    x = np.arange(len(CLASS_NAMES))
    width = 0.25

    fig, ax = plt.subplots(figsize=(10, 6))
    for i, split in enumerate(splits):
        key = split.lower()
        counts = [
            report["splits"][key]["class_counts"].get(name, 0) for name in CLASS_NAMES
        ]
        ax.bar(x + (i - 1) * width, counts, width, label=split)

    ax.set_xticks(x)
    ax.set_xticklabels(CLASS_NAMES, rotation=15)
    ax.set_ylabel("Image count")
    ax.set_title("Class Distribution — Train / Val / Test")
    ax.legend()
    ax.grid(True, axis="y", alpha=0.3)
    fig.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=150)
    plt.close(fig)


def main() -> int:
    config = load_config()
    get_device(config["runtime"].get("device", "auto"))

    root = Path(config["dataset"]["root"])
    if not root.exists():
        logger.error("Dataset root not found: %s", root)
        return 1

    splits_cfg = config["dataset"]["splits"]
    report: Dict[str, Any] = {
        "dataset_root": str(root),
        "class_to_idx": CLASS_TO_IDX,
        "class_names": CLASS_NAMES,
        "splits": {},
        "totals": {"Train": 0, "Val": 0, "Test": 0, "all": 0},
    }

    for split_key, split_name in [
        ("train", "Train"),
        ("val", "Val"),
        ("test", "Test"),
    ]:
        split_dir = root / splits_cfg[split_key]
        logger.info("Scanning %s ...", split_dir)
        if not split_dir.exists():
            logger.error("Missing split directory: %s", split_dir)
            report["splits"][split_key] = {
                "path": str(split_dir),
                "error": "directory not found",
                "class_counts": {n: 0 for n in CLASS_NAMES},
                "percentages": {n: 0.0 for n in CLASS_NAMES},
                "total": 0,
                "corrupted_count": 0,
                "corrupted_files": [],
                "missing_directories": [str(split_dir)],
                "dimension_stats": {},
            }
            continue

        split_report = _scan_split(split_dir)
        report["splits"][split_key] = split_report
        report["totals"][split_name] = split_report["total"]
        report["totals"]["all"] += split_report["total"]

        logger.info(
            "%s: %d images | corrupted=%d | missing_dirs=%d",
            split_name,
            split_report["total"],
            split_report["corrupted_count"],
            len(split_report["missing_directories"]),
        )
        for name in CLASS_NAMES:
            logger.info(
                "  %-12s %5d  (%.1f%%)",
                name,
                split_report["class_counts"][name],
                split_report["percentages"][name],
            )

    metrics_dir = ensure_dir(config["paths"]["metrics"])
    plots_dir = ensure_dir(config["paths"]["plots"])
    report_path = Path(metrics_dir) / "dataset_report.json"
    plot_path = Path(plots_dir) / "class_distribution.png"

    save_json(report, report_path)
    _plot_distribution(report, plot_path)

    logger.info("Saved dataset report → %s", report_path)
    logger.info("Saved class distribution plot → %s", plot_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
