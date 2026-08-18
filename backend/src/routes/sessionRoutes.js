const express = require("express");
const {
  startSession,
  endSession,
  getSessions,
  getSession
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
