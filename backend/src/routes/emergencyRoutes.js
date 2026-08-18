const express = require("express");
const {
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact
} = require("../controllers/emergencyController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All emergency contact routes require authentication
router.use(authMiddleware);

/**
 * GET /api/emergency-contacts
 * Get all emergency contacts for current user
 */
router.get("/", getEmergencyContacts);

/**
 * POST /api/emergency-contacts
 * Create a new emergency contact
 */
router.post("/", createEmergencyContact);

/**
 * PUT /api/emergency-contacts/:contactId
 * Update an emergency contact
 */
router.put("/:contactId", updateEmergencyContact);

/**
 * DELETE /api/emergency-contacts/:contactId
 * Delete an emergency contact
 */
router.delete("/:contactId", deleteEmergencyContact);

module.exports = router;
