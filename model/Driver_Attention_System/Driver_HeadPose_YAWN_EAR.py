import cv2
import time
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision
from mediapipe.tasks.python.vision import FaceLandmarker, FaceLandmarkerOptions, RunningMode
from mediapipe import Image, ImageFormat
from pygame import mixer
import urllib.request
import os

# ---------------------------------------------------------------------------
# Download the FaceLandmarker model if not already present
# ---------------------------------------------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "face_landmarker.task")
MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/"
    "face_landmarker/float16/1/face_landmarker.task"
)

if not os.path.exists(MODEL_PATH):
    print("Downloading face_landmarker.task model (~29 MB) ...")
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    print("Download complete.")

# ---------------------------------------------------------------------------
# Alert signal initialization
# ---------------------------------------------------------------------------
mixer.init()
mixer.music.load("music.wav")

# ---------------------------------------------------------------------------
# Build FaceLandmarker (new Tasks API)
# ---------------------------------------------------------------------------
options = FaceLandmarkerOptions(
    base_options=mp_python.BaseOptions(model_asset_path=MODEL_PATH),
    running_mode=RunningMode.IMAGE,
    num_faces=1,
    min_face_detection_confidence=0.5,
    min_face_presence_confidence=0.5,
    min_tracking_confidence=0.5,
    output_face_blendshapes=False,
    output_facial_transformation_matrixes=False,
)
face_landmarker = FaceLandmarker.create_from_options(options)

# ---------------------------------------------------------------------------
# Thresholds & counters
# ---------------------------------------------------------------------------
# Head Pose
HeadPose_Frames = 25
HeadPose_Counter = 0

# EAR - Eye Aspect Ratio
EAR_Thresh = 0.25
EAR_Frames = 30
EAR_Counter = 0

# Yawn
YAWN_Thresh = 0.3
YAWN_Frames = 36
YAWN_Counter = 0

# ---------------------------------------------------------------------------
# Landmark indices (same as original — MediaPipe 478-point face mesh)
# ---------------------------------------------------------------------------
HeadPose_Features = [1, 33, 61, 199, 263, 291]
LeftEye_Features  = [263, 362, 386, 374]   # width: 263-362, height: 386-374
RightEye_Features = [33, 133, 145, 159]    # width: 33-133,  height: 145-159
Mouth_Features    = [13, 14, 78, 308]      # height: 13-14,  width: 78-308

# Connection pairs for manual landmark drawing (replaces mp_drawing)
FACEMESH_CONTOUR_PAIRS = list(mp.solutions.face_mesh.FACEMESH_CONTOURS) \
    if hasattr(mp, "solutions") else []

def draw_landmarks_manual(image, landmarks, img_w, img_h):
    """Draw face mesh contour dots since mp_drawing is unavailable."""
    for lm in landmarks:
        cx, cy = int(lm.x * img_w), int(lm.y * img_h)
        cv2.circle(image, (cx, cy), 1, (0, 0, 255), -1)

# ---------------------------------------------------------------------------
# Start capturing video
# ---------------------------------------------------------------------------
vid = cv2.VideoCapture(0)

while vid.isOpened():
    retval, frame = vid.read()
    if not retval:
        break

    start = time.time()

    # Flip for selfie view
    frame = cv2.flip(frame, 1)

    img_h, img_w, _ = frame.shape

    # Convert BGR → RGB for MediaPipe
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = Image(image_format=ImageFormat.SRGB, data=rgb_frame)

    # Run inference
    detection_result = face_landmarker.detect(mp_image)

    face_3d = []; face_2d = []
    l_eye = []; r_eye = []
    mouth = []
    nose_2d = (0, 0)

    if detection_result.face_landmarks:
        landmarks = detection_result.face_landmarks[0]  # first face

        for idx, lm in enumerate(landmarks):
            # Head Pose
            if idx in HeadPose_Features:
                if idx == 1:
                    nose_2d = (lm.x * img_w, lm.y * img_h)
                x_px, y_px = int(lm.x * img_w), int(lm.y * img_h)
                face_2d.append([x_px, y_px])
                face_3d.append([x_px, y_px, lm.z])

            # Left Eye
            if idx in LeftEye_Features:
                l_eye.append([int(lm.x * img_w), int(lm.y * img_h)])

            # Right Eye
            if idx in RightEye_Features:
                r_eye.append([int(lm.x * img_w), int(lm.y * img_h)])

            # Mouth
            if idx in Mouth_Features:
                mouth.append([int(lm.x * img_w), int(lm.y * img_h)])

        # ----------------------------------------------------------------
        # Head Pose Estimation
        # ----------------------------------------------------------------
        face_2d = np.array(face_2d, dtype=np.float64)
        face_3d = np.array(face_3d, dtype=np.float64)

        focal_length = 1 * img_w
        cam_matrix = np.array([
            [focal_length, 0,            img_h / 2],
            [0,            focal_length, img_w / 2],
            [0,            0,            1        ]
        ])
        dist_matrix = np.zeros((4, 1), dtype=np.float64)

        success, rot_vec, trans_vec = cv2.solvePnP(
            face_3d, face_2d, cam_matrix, dist_matrix
        )

        rmat, _ = cv2.Rodrigues(rot_vec)
        angles, _, _, _, _, _ = cv2.RQDecomp3x3(rmat)

        x_ang = angles[0] * 360
        y_ang = angles[1] * 360
        z_ang = angles[2] * 360

        distracted = True
        if y_ang < -10:
            text = "Looking Left"
        elif y_ang > 10:
            text = "Looking Right"
        elif x_ang < -10:
            text = "Looking Down"
        elif x_ang > 10:
            text = "Looking Up"
        else:
            distracted = False
            text = "Forward"

        if distracted:
            HeadPose_Counter += 1
            if HeadPose_Counter > HeadPose_Frames:
                cv2.putText(frame, "Distracted!", (20, 100),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 2)
                mixer.music.play()
        else:
            HeadPose_Counter = 0

        # Draw nose direction line
        p1 = (int(nose_2d[0]), int(nose_2d[1]))
        p2 = (int(nose_2d[0] + y_ang * 10), int(nose_2d[1] - x_ang * 10))
        cv2.line(frame, p1, p2, (255, 0, 0), 3)

        cv2.putText(frame, text,                               (20, 50),  cv2.FONT_HERSHEY_SIMPLEX, 1.7, (0, 255, 0), 2)
        cv2.putText(frame, "x: " + str(np.round(x_ang, 2)),   (520, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        cv2.putText(frame, "y: " + str(np.round(y_ang, 2)),   (520, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
        cv2.putText(frame, "z: " + str(np.round(z_ang, 2)),   (520, 120),cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)

        # ----------------------------------------------------------------
        # EAR (Eye Aspect Ratio)
        # ----------------------------------------------------------------
        l_EAR_Width  = abs(l_eye[0][0] - l_eye[1][0])  # 263 - 362
        l_EAR_Height = abs(l_eye[2][1] - l_eye[3][1])  # 386 - 374
        l_EAR = l_EAR_Height / l_EAR_Width if l_EAR_Width else 0

        r_EAR_Width  = abs(r_eye[0][0] - r_eye[1][0])  # 33 - 133
        r_EAR_Height = abs(r_eye[2][1] - r_eye[3][1])  # 145 - 159
        r_EAR = r_EAR_Height / r_EAR_Width if r_EAR_Width else 0

        EAR = (l_EAR + r_EAR) / 2.0

        cv2.putText(frame, "EAR: {:.2f}".format(EAR), (20, 430),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        if EAR < EAR_Thresh:
            EAR_Counter += 1
            if EAR_Counter > EAR_Frames:
                cv2.putText(frame, "Eye Closed!", (20, 150),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 2)
                mixer.music.play()
        else:
            EAR_Counter = 0

        # ----------------------------------------------------------------
        # Yawn Detection
        # ----------------------------------------------------------------
        mouth_Height = abs(mouth[0][1] - mouth[1][1])  # 13 - 14
        mouth_Width  = abs(mouth[2][0] - mouth[3][0])  # 78 - 308
        YAWN = mouth_Height / mouth_Width if mouth_Width else 0

        cv2.putText(frame, "YAWN: {:.2f}".format(YAWN), (20, 470),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

        if YAWN > YAWN_Thresh:
            YAWN_Counter += 1
            if YAWN_Counter > YAWN_Frames:
                cv2.putText(frame, "Yawning!", (20, 200),
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 2)
                mixer.music.play()
        else:
            YAWN_Counter = 0

        # ----------------------------------------------------------------
        # FPS & landmark overlay
        # ----------------------------------------------------------------
        end = time.time()
        fps = 1 / (end - start) if (end - start) > 0 else 0
        cv2.putText(frame, f'FPS: {int(fps)}', (500, 470),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

        draw_landmarks_manual(frame, landmarks, img_w, img_h)

    cv2.imshow("Driver Attention System - Press 'esc' to exit", frame)

    if cv2.waitKey(5) & 0xFF == 27:
        break

vid.release()
cv2.destroyAllWindows()
face_landmarker.close()
