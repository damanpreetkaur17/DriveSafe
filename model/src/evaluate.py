"""Metrics computation and evaluation artifact generation."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_recall_fscore_support,
)

from .config import CLASS_NAMES
from .utils import ensure_dir, save_json, setup_logging

logger = setup_logging("drowsiness.evaluate")


def evaluate_predictions(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_proba: np.ndarray,
    config: Dict[str, Any],
) -> Dict[str, Any]:
    """Compute classification metrics for the test set.

    Args:
        y_true: Ground-truth labels.
        y_pred: Predicted labels.
        y_proba: Softmax probabilities (N, C).
        config: Project configuration.

    Returns:
        Nested metrics dictionary.
    """
    # Ordered class names matching indices 0..3
    class_names: List[str] = list(CLASS_NAMES)

    precision, recall, f1, support = precision_recall_fscore_support(
        y_true, y_pred, labels=list(range(len(class_names))), zero_division=0
    )

    metrics: Dict[str, Any] = {
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "macro_f1": float(f1_score(y_true, y_pred, average="macro", zero_division=0)),
        "weighted_f1": float(
            f1_score(y_true, y_pred, average="weighted", zero_division=0)
        ),
        "macro_precision": float(np.mean(precision)),
        "macro_recall": float(np.mean(recall)),
        "per_class": {},
        "num_samples": int(len(y_true)),
        "class_names": class_names,
    }

    for idx, name in enumerate(class_names):
        metrics["per_class"][name] = {
            "precision": float(precision[idx]),
            "recall": float(recall[idx]),
            "f1": float(f1[idx]),
            "support": int(support[idx]),
        }

    metrics["classification_report"] = classification_report(
        y_true,
        y_pred,
        target_names=class_names,
        digits=4,
        zero_division=0,
    )
    return metrics


def plot_confusion_matrix(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    class_names: List[str],
    output_path: Path,
) -> None:
    """Save a seaborn confusion-matrix heatmap."""
    cm = confusion_matrix(y_true, y_pred, labels=list(range(len(class_names))))
    plt.figure(figsize=(8, 6))
    sns.heatmap(
        cm,
        annot=True,
        fmt="d",
        cmap="Blues",
        xticklabels=class_names,
        yticklabels=class_names,
    )
    plt.xlabel("Predicted")
    plt.ylabel("True")
    plt.title("Confusion Matrix — Test Set")
    plt.tight_layout()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(output_path, dpi=150)
    plt.close()
    logger.info("Saved confusion matrix → %s", output_path)


def save_evaluation_artifacts(
    metrics: Dict[str, Any],
    y_true: np.ndarray,
    y_pred: np.ndarray,
    config: Dict[str, Any],
) -> None:
    """Persist metrics JSON, classification report, and confusion matrix."""
    metrics_dir = ensure_dir(config["paths"]["metrics"])
    cm_dir = ensure_dir(config["paths"]["confusion_matrix"])

    # Strip the long text report from JSON (saved separately).
    metrics_for_json = {k: v for k, v in metrics.items() if k != "classification_report"}
    save_json(metrics_for_json, metrics_dir / "test_metrics.json")

    report_path = metrics_dir / "classification_report.txt"
    report_path.write_text(metrics["classification_report"], encoding="utf-8")
    logger.info("Saved classification report → %s", report_path)

    plot_confusion_matrix(
        y_true,
        y_pred,
        metrics["class_names"],
        cm_dir / "confusion_matrix.png",
    )
