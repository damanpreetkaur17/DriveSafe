const prisma = require("../config/db");

/**
 * GET /api/vehicles
 * Get all vehicles for current user
 */
const getVehicles = async (req, res) => {
  try {
    const userId = req.userId;

    const vehicles = await prisma.vehicle.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" }
    });

    return res.status(200).json({
      success: true,
      data: vehicles
    });
  } catch (error) {
    console.error("Get vehicles error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/vehicles
 * Create a new vehicle for current user
 */
const createVehicle = async (req, res) => {
  try {
    const userId = req.userId;
    const { registration_no, vehicle_type, make, model, manufacturing_year } = req.body;

    // Validation
    if (!registration_no || !vehicle_type || !make || !model || !manufacturing_year) {
      return res.status(400).json({
        success: false,
        message: "All vehicle fields are required"
      });
    }

    // Check if registration number already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { registration_no }
    });

    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: "Vehicle with this registration number already exists"
      });
    }

    // Create vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        user_id: userId,
        registration_no,
        vehicle_type,
        make,
        model,
        manufacturing_year: parseInt(manufacturing_year)
      }
    });

    return res.status(201).json({
      success: true,
      message: "Vehicle created successfully",
      data: vehicle
    });
  } catch (error) {
    console.error("Create vehicle error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PUT /api/vehicles/:vehicleId
 * Update a vehicle
 */
const updateVehicle = async (req, res) => {
  try {
    const userId = req.userId;
    const { vehicleId } = req.params;
    const { registration_no, vehicle_type, make, model, manufacturing_year } = req.body;

    // Check if vehicle exists and belongs to user
    const vehicle = await prisma.vehicle.findUnique({
      where: { vehicle_id: parseInt(vehicleId) }
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    if (vehicle.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Check if new registration number is unique (if changed)
    if (registration_no && registration_no !== vehicle.registration_no) {
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { registration_no }
      });
      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: "Vehicle with this registration number already exists"
        });
      }
    }

    // Update vehicle
    const updatedVehicle = await prisma.vehicle.update({
      where: { vehicle_id: parseInt(vehicleId) },
      data: {
        registration_no: registration_no || vehicle.registration_no,
        vehicle_type: vehicle_type || vehicle.vehicle_type,
        make: make || vehicle.make,
        model: model || vehicle.model,
        manufacturing_year: manufacturing_year ? parseInt(manufacturing_year) : vehicle.manufacturing_year
      }
    });

    return res.status(200).json({
      success: true,
      message: "Vehicle updated successfully",
      data: updatedVehicle
    });
  } catch (error) {
    console.error("Update vehicle error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * DELETE /api/vehicles/:vehicleId
 * Delete a vehicle
 */
const deleteVehicle = async (req, res) => {
  try {
    const userId = req.userId;
    const { vehicleId } = req.params;

    // Check if vehicle exists and belongs to user
    const vehicle = await prisma.vehicle.findUnique({
      where: { vehicle_id: parseInt(vehicleId) }
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found"
      });
    }

    if (vehicle.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Delete vehicle
    await prisma.vehicle.delete({
      where: { vehicle_id: parseInt(vehicleId) }
    });

    return res.status(200).json({
      success: true,
      message: "Vehicle deleted successfully"
    });
  } catch (error) {
    console.error("Delete vehicle error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle
};
