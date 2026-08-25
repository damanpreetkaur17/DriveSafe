# Driver Drowsiness Detection ML Module

Production-oriented computer-vision / ML pipeline for a **driver-monitoring web application**.  
Classifies facial crops into four states and applies temporal logic for fatigue scoring and alerts.

> **Important:** This is a **prototype** driver-monitoring system. It is **not** a certified, medically validated, or safety-critical product. Do not rely on it as the sole means of preventing drowsy driving.

---

## Features

- **4-class classification:** `Closed_Eyes`, `No_yawn`, `Open_Eyes`, `Yawn`
- **MobileNetV3-Large** with ImageNet transfer learning (two stages)
- **CUDA / AMP** training and inference with automatic device detection
- Dataset analysis, training, validation, testing, and full metric reports
- TensorBoard logging
- Single-image inference CLI
- Real-time webcam pipeline with **MediaPipe Face Mesh**
- Temporal drowsiness logic (blink vs prolonged closure)
- Engineering fatigue score + audio alerts with cooldown

---

## Dataset structure

Configured root (default): `E:/Drowsiness`

```text
E:/Drowsiness/
├── Train/
│   ├── Closed_Eyes/
│   ├── Open_Eyes/
│   ├── Yawn/
│   └── No_yawn/
├── Val/
│   ├── Closed_Eyes/
│   ├── Open_Eyes/
│   ├── Yawn/
│   └── No_yawn/
└── Test/
    ├── Closed_Eyes/
    ├── Open_Eyes/
    ├── Yawn/
    └── No_yawn/
```

The original dataset is **never** modified, moved, renamed, or duplicated.

### Fixed class mapping

```python
{
    "Closed_Eyes": 0,
    "No_yawn": 1,
    "Open_Eyes": 2,
    "Yawn": 3
}
```

---

## Dataset statistics

Actual scanned counts (0 corrupted images):

| Class         | Train | Val | Test |
|---------------|------:|----:|-----:|
| Closed_Eyes   |  2029 | 336 |  361 |
| No_yawn       |  2165 | 455 |  469 |
| Open_Eyes     |  2204 | 336 |  186 |
| Yawn          |  2150 | 427 |  448 |
| **Total**     | **8548** | **1554** | **1464** |

Re-run `python scripts/analyze_dataset.py` anytime to refresh `results/metrics/dataset_report.json`.

---

## Tech stack

| Component        | Choice                                      |
|------------------|---------------------------------------------|
| Deep learning    | PyTorch + torchvision                       |
| Backbone         | MobileNetV3-Large (ImageNet pretrained)     |
| Face detection   | MediaPipe Face Mesh (OpenCV Haar fallback)  |
| Metrics / plots  | scikit-learn, matplotlib, seaborn           |
| Logging          | TensorBoard                                 |
| Config           | YAML                                        |

---

## Installation

```bash
cd drowsiness-ml
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt
```

### CUDA setup (PyTorch)

Install a CUDA-enabled PyTorch build **separately** (not listed in `requirements.txt`):

```bash
# Example: CUDA 12.1
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

Or CUDA 11.8:

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

CPU-only (not recommended for training):

```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
```

Confirm GPU:

```python
import torch
print(torch.cuda.is_available())
print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU")
```

At startup the project prints:

```text
Device: CUDA
GPU: <GPU name>
CUDA Available: True
CUDA Version: <version>
```

If CUDA is unavailable, a clear warning is printed and CPU fallback is used.

---

## Dataset configuration

Edit `configs/config.yaml`:

```yaml
dataset:
  root: "E:/Drowsiness"
  image_size: 224
  batch_size: 64
  num_workers: 4
```

All thresholds, learning rates, and alert settings live in this file — not hardcoded in source.

---

## Dataset analysis

```bash
python scripts/analyze_dataset.py
```

Produces:

- `results/metrics/dataset_report.json`
- `results/plots/class_distribution.png`

Scans Train / Val / Test, counts images, checks corruption, and measures dimensions.

---

## Training

```bash
python scripts/train_model.py
```

Two-stage transfer learning:

1. **Stage 1** — freeze backbone, train classifier (`epochs_stage1`, higher LR)
2. **Stage 2** — unfreeze later blocks, fine-tune (`epochs_stage2`, lower LR)

Best model selected by **validation Macro F1**.

Outputs:

- `models/best_model.pth`
- `models/last_model.pth`
- Training plots under `results/plots/`
- TensorBoard logs under `runs/`

```bash
tensorboard --logdir runs
```

Optional weighted CrossEntropyLoss (off by default):

```yaml
training:
  use_class_weights: false
```

---

## Evaluation

```bash
python scripts/evaluate_model.py
```

Writes:

- `results/metrics/test_metrics.json`
- `results/metrics/classification_report.txt`
- `results/confusion_matrix/confusion_matrix.png`

Metrics: Accuracy, Precision, Recall, F1, Macro F1, Weighted F1.

---

## Single-image inference

```bash
python scripts/predict.py --image path/to/image.jpg
```

Example output:

```text
Prediction: Closed_Eyes
Confidence: 96.42%

Closed_Eyes: 96.42%
No_yawn:      0.54%
Open_Eyes:    2.13%
Yawn:         0.91%
```

---

## Real-time webcam inference

```bash
python scripts/realtime_detection.py
```

Pipeline:

```text
Webcam → Face Detection → Face Crop → 224×224 preprocess → MobileNetV3 → 4-class prediction
→ temporal smoothing → fatigue score → alerts
```

Overlay shows state, confidence, fatigue level, FPS, and latency.  
Keys: `q` quit · `r` reset temporal state.

---

## Drowsiness logic

A single `Closed_Eyes` frame does **not** imply drowsiness.

Configurable thresholds (`configs/config.yaml`):

```yaml
drowsiness:
  closed_eye_warning_seconds: 1.5
  closed_eye_critical_seconds: 3.0
  yawn_warning_count: 2
  yawn_window_seconds: 60
  prediction_history_size: 15
  smoothing_window: 5
```

Distinguishes normal blinks from prolonged eye closure; tracks yawn frequency and prediction history with probability averaging / majority voting.

---

## Fatigue scoring

Engineering heuristic (not medical):

| Score  | Level    |
|--------|----------|
| 0–29   | NORMAL   |
| 30–59  | WARNING  |
| 60–79  | DROWSY   |
| 80–100 | CRITICAL |

Weights:

```yaml
fatigue_score:
  eye_closure_weight: 60
  yawning_weight: 30
  repeated_closure_weight: 10
```

Alerts for DROWSY / CRITICAL use audio with cooldown:

```yaml
alerts:
  enabled: true
  cooldown_seconds: 5
```

---

## Project structure

```text
drowsiness-ml/
├── configs/config.yaml
├── src/
│   ├── config.py
│   ├── dataset.py
│   ├── transforms.py
│   ├── model.py
│   ├── train.py
│   ├── validate.py
│   ├── test.py
│   ├── evaluate.py
│   ├── inference.py
│   ├── face_detection.py
│   ├── drowsiness_logic.py
│   ├── alert.py
│   └── utils.py
├── scripts/
│   ├── analyze_dataset.py
│   ├── train_model.py
│   ├── evaluate_model.py
│   ├── predict.py
│   └── realtime_detection.py
├── models/
├── results/
├── runs/
├── logs/
├── requirements.txt
├── README.md
└── .gitignore
```

---

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Dataset not found | Set `dataset.root` in `configs/config.yaml` |
| CUDA unavailable | Install CUDA PyTorch; check `nvidia-smi` |
| Missing checkpoint | Run `python scripts/train_model.py` first |
| Webcam fails | Try `--camera 1` (or another index); check OS permissions |
| No face detected | Improve lighting; move closer; MediaPipe needs a visible face |
| MediaPipe import error | `pip install mediapipe` (Haar cascade fallback is automatic) |
| OOM during training | Lower `dataset.batch_size` |
| Slow DataLoader on Windows | Set `num_workers: 0` temporarily |

---

## Limitations

- Prototype only — **not** a certified safety-critical system
- Fatigue score is an **engineering heuristic**, not a clinical metric
- Performance depends on lighting, camera angle, occlusion, and glasses
- Classes mix eye state and yawn state; joint interpretation is temporal
- Webcam path classifies face crops, not full-scene context (cabin, road, etc.)

---

## Future improvements

- Eye Aspect Ratio (EAR) fusion with the CNN
- Multi-camera / IR night support
- ONNX / TensorRT export for low-latency deployment
- Driver identity calibration and personalized thresholds
- REST / WebSocket API for the companion web application
- Hard-negative mining and active learning on fleet data

---

## License / usage note

Intended for research and product prototyping. Always design vehicle systems with redundant human and hardware safety measures.
