const prisma = require("../config/db");

/**
 * POST /api/alerts
 * Create a new alert for a fatigue event
 */
const createAlert = async (req, res) => {
  try {
    const userId = req.userId;
    const { event_id, contact_id, alert_type, message } = req.body;

    // Validation
    if (!event_id || !alert_type || !message) {
      return res.status(400).json({
        success: false,
        message: "Event ID, alert type, and message are required"
      });
    }

    // Check if event exists and belongs to user's session
    const event = await prisma.fatigueEvent.findUnique({
      where: { event_id: parseInt(event_id) },
      include: {
        session: true
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Fatigue event not found"
      });
    }

    if (event.session.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // If contact_id is provided, verify it belongs to the user
    if (contact_id) {
      const contact = await prisma.emergencyContact.findUnique({
        where: { contact_id: parseInt(contact_id) }
      });

      if (!contact) {
        return res.status(404).json({
          success: false,
          message: "Emergency contact not found"
        });
      }

      if (contact.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized"
        });
      }
    }

    // Create alert
    const alert = await prisma.alert.create({
      data: {
        event_id: parseInt(event_id),
        contact_id: contact_id ? parseInt(contact_id) : null,
        alert_type,
        message,
        status: "PENDING"
      },
      include: {
        event: {
          include: {
            event_type: true
          }
        },
        contact: true
      }
    });

    return res.status(201).json({
      success: true,
      message: "Alert created successfully",
      data: alert
    });
  } catch (error) {
    console.error("Create alert error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/alerts
 * Get all alerts for current user
 */
const getAlerts = async (req, res) => {
  try {
    const userId = req.userId;

    // Get all alerts for events belonging to user's sessions
    const alerts = await prisma.alert.findMany({
      where: {
        event: {
          session: {
            user_id: userId
          }
        }
      },
      include: {
        event: {
          include: {
            event_type: true,
            session: true
          }
        },
        contact: true
      },
      orderBy: { created_at: "desc" }
    });

    return res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error("Get alerts error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/alerts/:alertId
 * Get a specific alert
 */
const getAlert = async (req, res) => {
  try {
    const userId = req.userId;
    const { alertId } = req.params;

    const alert = await prisma.alert.findUnique({
      where: { alert_id: parseInt(alertId) },
      include: {
        event: {
          include: {
            event_type: true,
            session: true
          }
        },
        contact: true
      }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: "Alert not found"
      });
    }

    if (alert.event.session.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    return res.status(200).json({
      success: true,
      data: alert
    });
  } catch (error) {
    console.error("Get alert error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  createAlert,
  getAlerts,
  getAlert
};
