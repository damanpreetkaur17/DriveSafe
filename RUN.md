# DriveSafe local run guide

This repository contains the existing Next.js frontend, Express/Prisma API, and
the original Python detection scripts. The integrated monitoring path reuses the
MediaPipe FaceLandmarker asset in `model/Driver_Attention_System` and runs it in
a private FastAPI service:

1. The browser asks the signed-in user for camera permission and captures JPEG
   frames locally.
2. The browser sends those frames over an authenticated WebSocket to Express.
3. Express verifies the JWT and session owner, forwards frames to FastAPI with
   a private service key, and streams real model results back to that browser.
4. Express stores one telemetry sample per second and only threshold-crossing
   events/alerts in PostgreSQL. Camera frames are not stored.

The MediaPipe implementation calculates EAR, mouth opening, and head pose.
There is no trained drowsiness classifier in the repository. The displayed
signal risk score is therefore a documented rule-based indicator, not a
probability from a trained model.

## Requirements

- Node.js 20 or newer and npm.
- Python 3.10 or newer (the checked-in model asset was exercised with Python
  3.12).
- PostgreSQL reachable from the backend.
- A browser with camera support. Camera permission requires `localhost` or
  HTTPS.

## Configure environment

### Backend

In PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
```

Set `DATABASE_URL`, a strong `JWT_SECRET`, and `ML_SERVICE_API_KEY` in
`backend\.env`. The same `ML_SERVICE_API_KEY` value must be set in
`model\ml_service\.env`. Do not expose this key in frontend variables or source
control. For local development, the ML service URL is
`http://127.0.0.1:8000`; `CLIENT_URL` should include the frontend origin,
normally `http://localhost:3000`.

### ML service

```powershell
Copy-Item model\ml_service\.env.example model\ml_service\.env
py -3.12 -m venv model\.venv
model\.venv\Scripts\Activate.ps1
python -m pip install -r model\ml_service\requirements.txt
```

Set the same private `ML_SERVICE_API_KEY` in `model\ml_service\.env`. The
service uses the existing
`model\Driver_Attention_System\face_landmarker.task` file. It does not download
model files at runtime. If that asset is missing or fails to load, its health
check reports unavailable and monitoring cannot start.

### Frontend

```powershell
Copy-Item frontend\.env.example frontend\.env
```

`BACKEND_API_URL` is used by the Next.js API proxy. The browser WebSocket
connects directly to the persistent Express server using
`NEXT_PUBLIC_BACKEND_WS_URL` (local default: `http://localhost:5000`). For
production, configure the public `wss://`-reachable backend URL and restrict
backend CORS/WebSocket origins to the deployed frontend.

## Start the application

Apply the Prisma migration and seed event types once:

```powershell
Set-Location backend
npm install
npx prisma migrate deploy
npm run prisma:seed
```

For a new local database, `npx prisma migrate dev` may be used instead of
`migrate deploy`.

Run each service in its own PowerShell terminal:

```powershell
# Terminal 1: Express REST API and WebSocket endpoint
Set-Location backend
npm run dev
```

```powershell
# Terminal 2: FastAPI inference service
Set-Location model\ml_service
..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --env-file .env
```

```powershell
# Terminal 3: Next.js website
Set-Location frontend
npm install
npm run dev
```

Open `http://localhost:3000`, sign in, ensure a vehicle is registered in the
profile, and start monitoring from the overview or Live Monitor page. Allow
camera access when prompted. The live page reports camera, backend, and ML
service failures explicitly. Stop monitoring to close the camera and finish
the session.

## Existing standalone model scripts

The scripts under `model\Driver_Attention_System` use MediaPipe and implement
eye closure (EAR), mouth opening/yawn, and `solvePnP` head pose. This is the
most complete existing implementation and is the algorithm reused by the web
service.

The three `Driver_Drowsiness_using_*` folders contain separate dlib scripts:

- `Driver_Drowsiness_using_EAR`: EAR-only eye-closure alert.
- `Driver_Drowsiness_using_EAR_YAWN`: eye closure and mouth-opening detection.
- `Driver_Drowsiness_using_Yawn`: mouth-opening detection only.

These are desktop webcam loops, not trained models or web services. They
require their local dlib shape-predictor data files and are retained for
standalone use. Their original setup and run instructions remain in
[`model/RUN.md`](model/RUN.md).

## Operational notes

- The ML HTTP service is intended to be private and bound to loopback locally;
  only Express should use its service key.
- The integrated WebSocket endpoint runs in `backend/src/server.js`. A
  serverless function such as the existing Vercel REST entry point cannot host
  this persistent WebSocket connection; production real-time monitoring needs
  a persistent Node.js host and a reachable private ML service.
- Detection history is authenticated and scoped to the owning user. Only
  derived signal values/events are persisted, not camera frames.
- Inference needs a working camera and a visible face for non-null EAR, yawn,
  head-pose, and risk values. A no-face frame is reported as `Unknown`, not
  replaced with a generated estimate.
