const express = require("express");
const { signup, login, getMe, logout, googleLogin } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * POST /api/auth/signup
 * Register new user
 */
router.post("/signup", signup);

/**
 * POST /api/auth/login
 * Login user
 */
router.post("/login", login);

/**
 * POST /api/auth/google
 * Continue with Google
 */
router.post("/google", googleLogin);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get("/me", authMiddleware, getMe);

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post("/logout", authMiddleware, logout);

module.exports = router;
