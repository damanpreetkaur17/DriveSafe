# DriveSafe Dashboard

## Overview

Complete 6-page dashboard with real-time face detection using MediaPipe Face Landmarker.

## Pages

- `/dashboard` - Overview with camera, gauges, telemetry, timeline
- `/dashboard/live` - Full camera monitor with face detection overlays
- `/dashboard/analytics` - Historical trends and patterns
- `/dashboard/alerts` - Alert history with filtering
- `/dashboard/sessions` - Session history and statistics
- `/dashboard/settings` - System configuration

## Camera & Computer Vision

### Real Detection (MediaPipe Face Landmarker)
- âœ… Face detection from live camera frames
- âœ… Face bounding box (follows user's actual face movement)
- âœ… 478 facial landmarks (actual detected points)
- âœ… Eye landmarks (actual eye tracking regions)

### Simulated (Mock Data)
- EAR/MAR telemetry values
- Driver state (ALERT, DROWSY, FATIGUE, NORMAL)
- Fatigue risk percentage
- Alerts and session history

The camera uses `navigator.mediaDevices.getUserMedia()` for real webcam access. Face detection runs in browser using GPU acceleration. No backend required.

## Components

- `CameraMonitor` - Reusable camera with face detection
- `DashboardShell` - Layout wrapper with sidebar
- `DriverStateIndicator` - State badge
- `FatigueRiskGauge` - Radial gauge
- `MetricCard` - Metric display
- `Sparkline` - Mini chart

## Mock Data

Centralized in `lib/mockData.ts`. All functions are deterministic (SSR-safe). No `Math.random()` or `Date.now()` during render.

## Dependencies

- `@mediapipe/tasks-vision` - Face detection model
- `lucide-react` - Icons
- Next.js 16 + React 19

## Development

```bash
npm run dev
```

Dashboard accessible at `http://localhost:3000/dashboard`

## Authentication Flow

Landing â†’ Login (`/login`) â†’ Dashboard (`/dashboard`)

Login page redirects to dashboard on submit (frontend-only, no backend yet).

## Known Limitations

- CV analysis is real detection, but fatigue classification requires trained model
- Telemetry values (EAR/MAR) are simulated (require landmark-based calculation)
- No persistent storage (data resets on refresh)
- Camera requires HTTPS in production

## Integration Points

When backend is ready:
1. Replace mock data functions with API calls
2. Add authentication guards to dashboard routes
3. Integrate fatigue classification model
4. Add WebSocket for real-time updates
5. Calculate actual EAR/MAR from landmarks
