const express = require("express");
const {
  startSession,
  endSession,
  getSessions,
  getSession,
  getSessionDetections,
  getSessionSummary
} = require("../controllers/sessionController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All session routes require authentication
router.use(authMiddleware);

/**
 * POST /api/sessions/start
 * Start a new driving session
 */
router.post("/start", startSession);

/**
 * GET /api/sessions
 * Get all sessions for current user
 */
router.get("/", getSessions);

/**
 * GET /api/sessions/:sessionId/detections
 * Get persisted telemetry samples and events for a session.
 */
router.get("/:sessionId/detections", getSessionDetections);

/**
 * GET /api/sessions/:sessionId/summary
 * Get aggregated metrics and a bounded chart series for a session.
 */
router.get("/:sessionId/summary", getSessionSummary);

/**
 * GET /api/sessions/:sessionId
 * Get a specific session
 */
router.get("/:sessionId", getSession);

/**
 * POST /api/sessions/:sessionId/end
 * End a driving session
 */
router.post("/:sessionId/end", endSession);

module.exports = router;
