const express = require("express");
const {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle
} = require("../controllers/vehicleController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// All vehicle routes require authentication
router.use(authMiddleware);

/**
 * GET /api/vehicles
 * Get all vehicles for current user
 */
router.get("/", getVehicles);

/**
 * POST /api/vehicles
 * Create a new vehicle
 */
router.post("/", createVehicle);

/**
 * PUT /api/vehicles/:vehicleId
 * Update a vehicle
 */
router.put("/:vehicleId", updateVehicle);

/**
 * DELETE /api/vehicles/:vehicleId
 * Delete a vehicle
 */
router.delete("/:vehicleId", deleteVehicle);

module.exports = router;
