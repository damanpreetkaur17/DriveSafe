"""Two-stage transfer-learning training loop."""

from __future__ import annotations

import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import matplotlib.pyplot as plt
import torch
import torch.nn as nn
from torch.cuda.amp import GradScaler, autocast
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR, ReduceLROnPlateau
from torch.utils.data import DataLoader
from torch.utils.tensorboard import SummaryWriter
from tqdm import tqdm

from .config import CLASS_NAMES, CLASS_TO_IDX, save_config_snapshot
from .dataset import compute_class_weights, create_dataloaders
from .model import (
    create_model,
    freeze_backbone,
    get_trainable_parameters,
    unfreeze_later_layers,
)
from .utils import (
    ensure_dir,
    format_duration,
    get_device,
    save_json,
    set_seed,
    setup_logging,
)
from .validate import validate_one_epoch

logger = setup_logging("drowsiness.train")


def _build_optimizer(
    model: nn.Module,
    learning_rate: float,
    weight_decay: float,
) -> AdamW:
    return AdamW(
        get_trainable_parameters(model),
        lr=learning_rate,
        weight_decay=weight_decay,
    )


def _build_scheduler(optimizer: AdamW, config: Dict[str, Any], epochs: int):
    sched_cfg = config["training"].get("scheduler", {})
    sched_type = sched_cfg.get("type", "cosine")
    if sched_type == "plateau":
        return ReduceLROnPlateau(
            optimizer,
            mode="max",
            factor=0.5,
            patience=2,
            min_lr=float(sched_cfg.get("min_lr", 1e-6)),
        )
    return CosineAnnealingLR(
        optimizer,
        T_max=max(epochs, 1),
        eta_min=float(sched_cfg.get("min_lr", 1e-6)),
    )


def _save_checkpoint(
    path: Path,
    model: nn.Module,
    optimizer: torch.optim.Optimizer,
    scheduler,
    epoch: int,
    best_val_f1: float,
    config: Dict[str, Any],
) -> None:
    checkpoint = {
        "model_state_dict": model.state_dict(),
        "class_names": CLASS_NAMES,
        "class_to_idx": CLASS_TO_IDX,
        "image_size": int(config["dataset"]["image_size"]),
        "model_name": config["model"]["name"],
        "epoch": epoch,
        "optimizer_state_dict": optimizer.state_dict(),
        "scheduler_state_dict": scheduler.state_dict() if scheduler is not None else None,
        "best_val_f1": best_val_f1,
        "config_snapshot": {
            "dataset": config["dataset"],
            "model": config["model"],
            "training": {
                k: v
                for k, v in config["training"].items()
                if k not in {"checkpoint_dir"}
            },
        },
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(checkpoint, path)


def _train_one_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: torch.optim.Optimizer,
    device: torch.device,
    scaler: Optional[GradScaler],
    use_amp: bool,
) -> Dict[str, float]:
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    amp_enabled = use_amp and device.type == "cuda"

    for images, targets in tqdm(loader, desc="Train", leave=False):
        images = images.to(device, non_blocking=True)
        targets = targets.to(device, non_blocking=True)

        optimizer.zero_grad(set_to_none=True)
        with autocast(enabled=amp_enabled):
            outputs = model(images)
            loss = criterion(outputs, targets)

        if scaler is not None and amp_enabled:
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()
        else:
            loss.backward()
            optimizer.step()

        running_loss += loss.item() * images.size(0)
        preds = outputs.argmax(dim=1)
        correct += (preds == targets).sum().item()
        total += targets.size(0)

    return {
        "loss": running_loss / max(total, 1),
        "accuracy": correct / max(total, 1),
    }


def _plot_history(history: Dict[str, List[float]], plots_dir: Path) -> None:
    ensure_dir(plots_dir)
    mapping = {
        "train_loss": "training_loss.png",
        "val_loss": "validation_loss.png",
        "train_acc": "training_accuracy.png",
        "val_acc": "validation_accuracy.png",
        "train_f1": "training_f1.png",
        "val_f1": "validation_f1.png",
    }
    titles = {
        "train_loss": "Training Loss",
        "val_loss": "Validation Loss",
        "train_acc": "Training Accuracy",
        "val_acc": "Validation Accuracy",
        "train_f1": "Training Macro F1",
        "val_f1": "Validation Macro F1",
    }
    for key, filename in mapping.items():
        values = history.get(key, [])
        if not values:
            continue
        plt.figure(figsize=(8, 5))
        plt.plot(range(1, len(values) + 1), values, marker="o", linewidth=2)
        plt.title(titles[key])
        plt.xlabel("Epoch")
        plt.ylabel(key.replace("_", " ").title())
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        plt.savefig(plots_dir / filename, dpi=150)
        plt.close()


def _run_stage(
    stage_name: str,
    model: nn.Module,
    train_loader: DataLoader,
    val_loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
    config: Dict[str, Any],
    epochs: int,
    learning_rate: float,
    history: Dict[str, List[float]],
    writer: SummaryWriter,
    global_epoch_offset: int,
    best_val_f1: float,
    best_path: Path,
    last_path: Path,
    patience: int,
) -> Tuple[float, int, bool]:
    """Run one training stage. Returns (best_val_f1, epochs_ran, early_stopped)."""
    weight_decay = float(config["training"]["weight_decay"])
    use_amp = bool(config["training"].get("mixed_precision", True))
    scaler = GradScaler(enabled=use_amp and device.type == "cuda")

    optimizer = _build_optimizer(model, learning_rate, weight_decay)
    scheduler = _build_scheduler(optimizer, config, epochs)

    epochs_without_improvement = 0
    epochs_ran = 0
    early_stopped = False

    logger.info(
        "=== %s | epochs=%d | lr=%.6f | amp=%s ===",
        stage_name,
        epochs,
        learning_rate,
        use_amp and device.type == "cuda",
    )

    for epoch in range(1, epochs + 1):
        epochs_ran += 1
        global_epoch = global_epoch_offset + epoch
        start = time.perf_counter()

        train_metrics = _train_one_epoch(
            model, train_loader, criterion, optimizer, device, scaler, use_amp
        )
        # Approximate train F1 via a quick validation-style pass on train is expensive;
        # store train accuracy-derived placeholder and compute proper F1 on val.
        val_metrics = validate_one_epoch(
            model, val_loader, criterion, device, use_amp=use_amp, desc="Val"
        )

        # Optional: lightweight train F1 proxy from accuracy for plotting continuity.
        train_f1 = train_metrics["accuracy"]

        if isinstance(scheduler, ReduceLROnPlateau):
            scheduler.step(val_metrics["macro_f1"])
        else:
            scheduler.step()

        current_lr = optimizer.param_groups[0]["lr"]
        elapsed = time.perf_counter() - start

        history["train_loss"].append(train_metrics["loss"])
        history["val_loss"].append(val_metrics["loss"])
        history["train_acc"].append(train_metrics["accuracy"])
        history["val_acc"].append(val_metrics["accuracy"])
        history["train_f1"].append(train_f1)
        history["val_f1"].append(val_metrics["macro_f1"])
        history["lr"].append(current_lr)

        writer.add_scalar("Loss/train", train_metrics["loss"], global_epoch)
        writer.add_scalar("Loss/val", val_metrics["loss"], global_epoch)
        writer.add_scalar("Accuracy/train", train_metrics["accuracy"], global_epoch)
        writer.add_scalar("Accuracy/val", val_metrics["accuracy"], global_epoch)
        writer.add_scalar("F1/val_macro", val_metrics["macro_f1"], global_epoch)
        writer.add_scalar("LR", current_lr, global_epoch)

        logger.info(
            "%s Epoch %d/%d | "
            "train_loss=%.4f acc=%.4f | "
            "val_loss=%.4f acc=%.4f f1=%.4f | "
            "lr=%.6f | time=%s",
            stage_name,
            epoch,
            epochs,
            train_metrics["loss"],
            train_metrics["accuracy"],
            val_metrics["loss"],
            val_metrics["accuracy"],
            val_metrics["macro_f1"],
            current_lr,
            format_duration(elapsed),
        )

        _save_checkpoint(
            last_path, model, optimizer, scheduler, global_epoch, best_val_f1, config
        )

        if val_metrics["macro_f1"] > best_val_f1:
            best_val_f1 = val_metrics["macro_f1"]
            epochs_without_improvement = 0
            _save_checkpoint(
                best_path,
                model,
                optimizer,
                scheduler,
                global_epoch,
                best_val_f1,
                config,
            )
            logger.info("New best model saved (val Macro F1=%.4f)", best_val_f1)
        else:
            epochs_without_improvement += 1
            if epochs_without_improvement >= patience:
                logger.info(
                    "Early stopping triggered after %d epochs without improvement.",
                    patience,
                )
                early_stopped = True
                break

    return best_val_f1, epochs_ran, early_stopped


def train(config: Dict[str, Any]) -> Dict[str, Any]:
    """Execute the full two-stage training pipeline.

    Returns:
        Training summary dictionary.
    """
    set_seed(int(config.get("seed", 42)))
    device = get_device(config["runtime"].get("device", "auto"))

    ensure_dir(config["paths"]["logs"])
    ensure_dir(config["paths"]["runs"])
    ensure_dir(config["paths"]["plots"])
    ensure_dir(config["paths"]["metrics"])
    checkpoint_dir = ensure_dir(config["training"]["checkpoint_dir"])

    save_config_snapshot(config, Path(config["paths"]["metrics"]) / "train_config.yaml")

    train_loader, val_loader, _, train_ds = create_dataloaders(config)
    model = create_model(config, device=device)

    use_weights = bool(config["training"].get("use_class_weights", False))
    if use_weights:
        weights = compute_class_weights(train_ds).to(device)
        logger.info("Using class weights: %s", weights.tolist())
        criterion = nn.CrossEntropyLoss(weight=weights)
    else:
        criterion = nn.CrossEntropyLoss()

    best_path = checkpoint_dir / config["training"].get("best_model_name", "best_model.pth")
    last_path = checkpoint_dir / config["training"].get("last_model_name", "last_model.pth")
    patience = int(config["training"].get("early_stopping_patience", 5))

    history: Dict[str, List[float]] = {
        "train_loss": [],
        "val_loss": [],
        "train_acc": [],
        "val_acc": [],
        "train_f1": [],
        "val_f1": [],
        "lr": [],
    }

    writer = SummaryWriter(log_dir=str(Path(config["paths"]["runs"]) / "train"))
    best_val_f1 = -1.0
    total_epochs_ran = 0

    # ---- Stage 1: freeze backbone, train classifier ----
    freeze_backbone(model)
    best_val_f1, ran, stopped = _run_stage(
        stage_name="Stage1",
        model=model,
        train_loader=train_loader,
        val_loader=val_loader,
        criterion=criterion,
        device=device,
        config=config,
        epochs=int(config["training"]["epochs_stage1"]),
        learning_rate=float(config["training"]["learning_rate_stage1"]),
        history=history,
        writer=writer,
        global_epoch_offset=0,
        best_val_f1=best_val_f1,
        best_path=best_path,
        last_path=last_path,
        patience=patience,
    )
    total_epochs_ran += ran

    # ---- Stage 2: unfreeze later layers ----
    if not stopped and int(config["training"]["epochs_stage2"]) > 0:
        # Reload best weights before fine-tuning for stability.
        if best_path.exists():
            ckpt = torch.load(best_path, map_location=device, weights_only=False)
            model.load_state_dict(ckpt["model_state_dict"])
            best_val_f1 = float(ckpt.get("best_val_f1", best_val_f1))

        unfreeze_later_layers(
            model,
            unfreeze_from_block=int(config["model"].get("unfreeze_from_block", 12)),
        )
        best_val_f1, ran, _ = _run_stage(
            stage_name="Stage2",
            model=model,
            train_loader=train_loader,
            val_loader=val_loader,
            criterion=criterion,
            device=device,
            config=config,
            epochs=int(config["training"]["epochs_stage2"]),
            learning_rate=float(config["training"]["learning_rate_stage2"]),
            history=history,
            writer=writer,
            global_epoch_offset=total_epochs_ran,
            best_val_f1=best_val_f1,
            best_path=best_path,
            last_path=last_path,
            patience=patience,
        )
        total_epochs_ran += ran

    writer.close()
    _plot_history(history, Path(config["paths"]["plots"]))
    save_json(history, Path(config["paths"]["metrics"]) / "training_history.json")

    summary = {
        "best_val_f1": best_val_f1,
        "epochs_ran": total_epochs_ran,
        "best_model": str(best_path),
        "last_model": str(last_path),
        "device": str(device),
    }
    save_json(summary, Path(config["paths"]["metrics"]) / "training_summary.json")
    logger.info("Training complete. Best val Macro F1=%.4f", best_val_f1)
    return summary
