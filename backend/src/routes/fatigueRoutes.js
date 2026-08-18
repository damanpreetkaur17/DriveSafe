const express = require("express");
const {
  createFatigueEvent,
  getFatigueEventsBySession
} = require("../controllers/fatigueController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All fatigue event routes require authentication
router.use(authMiddleware);

/**
 * POST /api/fatigue-events
 * Create a new fatigue event
 */
router.post("/", createFatigueEvent);

/**
 * GET /api/fatigue-events/session/:sessionId
 * Get all fatigue events for a specific session
 */
router.get("/session/:sessionId", getFatigueEventsBySession);

module.exports = router;
