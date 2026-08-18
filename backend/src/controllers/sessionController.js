const prisma = require("../config/db");

/**
 * POST /api/sessions/start
 * Start a new driving session
 */
const startSession = async (req, res) => {
  try {
    const userId = req.userId;
    const { vehicle_id } = req.body;

    // Validation
    if (!vehicle_id) {
      return res.status(400).json({
        success: false,
        message: "Vehicle ID is required"
      });
    }

    // Check if vehicle exists and belongs to user
    const vehicle = await prisma.vehicle.findUnique({
      where: { vehicle_id: parseInt(vehicle_id) }
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

    // Create driving session
    const session = await prisma.drivingSession.create({
      data: {
        user_id: userId,
        vehicle_id: parseInt(vehicle_id),
        status: "ACTIVE"
      }
    });

    return res.status(201).json({
      success: true,
      message: "Driving session started successfully",
      data: session
    });
  } catch (error) {
    console.error("Start session error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/sessions/:sessionId/end
 * End a driving session
 */
const endSession = async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    // Check if session exists and belongs to user
    const session = await prisma.drivingSession.findUnique({
      where: { session_id: parseInt(sessionId) }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    if (session.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Update session to ended
    const updatedSession = await prisma.drivingSession.update({
      where: { session_id: parseInt(sessionId) },
      data: {
        end_time: new Date(),
        status: "COMPLETED"
      }
    });

    return res.status(200).json({
      success: true,
      message: "Driving session ended successfully",
      data: updatedSession
    });
  } catch (error) {
    console.error("End session error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/sessions
 * Get all sessions for current user
 */
const getSessions = async (req, res) => {
  try {
    const userId = req.userId;

    const sessions = await prisma.drivingSession.findMany({
      where: { user_id: userId },
      include: {
        vehicle: true
      },
      orderBy: { created_at: "desc" }
    });

    return res.status(200).json({
      success: true,
      data: sessions
    });
  } catch (error) {
    console.error("Get sessions error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/sessions/:sessionId
 * Get a specific session
 */
const getSession = async (req, res) => {
  try {
    const userId = req.userId;
    const { sessionId } = req.params;

    const session = await prisma.drivingSession.findUnique({
      where: { session_id: parseInt(sessionId) },
      include: {
        vehicle: true,
        fatigue_events: {
          include: {
            event_type: true
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    if (session.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    return res.status(200).json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error("Get session error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  startSession,
  endSession,
  getSessions,
  getSession
};
