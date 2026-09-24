# How to Run the Driver Drowsiness & Attention System

This document provides step-by-step instructions to set up dependencies and run the Driver Drowsiness & Attention Detection models.

---

## Step 1: Open Terminal & Navigate to Model Directory

Open PowerShell or Command Prompt and run:
```powershell
cd d:\Projects\AIML\model
```

---

## Step 2: (Recommended) Create and Activate Virtual Environment

Create a clean virtual environment:
```powershell
python -m venv venv
```

Activate the environment (PowerShell):
```powershell
.\venv\Scripts\activate
```

---

## Step 3: Install Required Dependencies

Install the core dependencies required for the MediaPipe-based system:
```powershell
pip install opencv-python numpy mediapipe pygame
```

*(Optional: If you wish to run the dlib-based scripts as well, run `pip install dlib imutils scipy`)*

---

## Step 4: Run the System

### Option 1: Complete Driver Attention System (Recommended)
Tracks **Eye Closure**, **Yawning**, and **Head Pose Direction** using MediaPipe Face Mesh.

1. Navigate to the module directory:
   ```powershell
   cd d:\Projects\AIML\model\Driver_Attention_System
   ```
2. Run the detection script:
   ```powershell
   python Driver_HeadPose_YAWN_EAR.py
   ```
*(Press **`q`** or **`Esc`** on the video window to quit).*

---

### Option 2: EAR & Yawn Detection (dlib version)
1. Navigate to the directory:
   ```powershell
   cd d:\Projects\AIML\model\Driver_Drowsiness_using_EAR_YAWN
   ```
2. Run the script:
   ```powershell
   python EAR_and_Yawn.py
   ```

---

### Option 3: Eye Closure (EAR) Only
1. Navigate to the directory:
   ```powershell
   cd d:\Projects\AIML\model\Driver_Drowsiness_using_EAR
   ```
2. Run the script:
   ```powershell
   python Drowsiness_Detection.py
   ```

---

### Option 4: Yawn Detection Only
1. Navigate to the directory:
   ```powershell
   cd d:\Projects\AIML\model\Driver_Drowsiness_using_Yawn
   ```
2. Run the script:
   ```powershell
   python Yawn_Detection.py
   ```
