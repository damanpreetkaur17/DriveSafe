const express = require("express");
const { getProfile, createProfile, updateProfile } = require("../controllers/profileController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All profile routes require authentication
router.use(authMiddleware);

/**
 * GET /api/profile
 * Get current user's profile
 */
router.get("/", getProfile);

/**
 * POST /api/profile
 * Create user profile
 */
router.post("/", createProfile);

/**
 * PUT /api/profile
 * Update user profile
 */
router.put("/", updateProfile);

module.exports = router;
