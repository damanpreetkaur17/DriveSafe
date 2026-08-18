const express = require("express");
const {
  createAlert,
  getAlerts,
  getAlert
} = require("../controllers/alertController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All alert routes require authentication
router.use(authMiddleware);

/**
 * POST /api/alerts
 * Create a new alert
 */
router.post("/", createAlert);

/**
 * GET /api/alerts
 * Get all alerts for current user
 */
router.get("/", getAlerts);

/**
 * GET /api/alerts/:alertId
 * Get a specific alert
 */
router.get("/:alertId", getAlert);

module.exports = router;
