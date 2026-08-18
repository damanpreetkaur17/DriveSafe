const prisma = require("../config/db");

/**
 * POST /api/fatigue-events
 * Create a new fatigue event (typically from AI/ML detection)
 */
const createFatigueEvent = async (req, res) => {
  try {
    const userId = req.userId;
    const { session_id, event_type_id, confidence, severity, timestamp, duration, snapshot_url } = req.body;

    // Validation
    if (!session_id || !event_type_id || confidence === undefined || !severity) {
      return res.status(400).json({
        success: false,
        message: "Session ID, event type ID, confidence, and severity are required"
      });
    }

    // Check if session exists and belongs to user
    const session = await prisma.drivingSession.findUnique({
      where: { session_id: parseInt(session_id) }
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

    // Check if event type exists
    const eventType = await prisma.fatigueEventType.findUnique({
      where: { event_type_id: parseInt(event_type_id) }
    });

    if (!eventType) {
      return res.status(404).json({
        success: false,
        message: "Event type not found"
      });
    }

    // Create fatigue event
    const event = await prisma.fatigueEvent.create({
      data: {
        session_id: parseInt(session_id),
        event_type_id: parseInt(event_type_id),
        confidence: parseFloat(confidence),
        severity,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
        duration: duration ? parseInt(duration) : null,
        snapshot_url: snapshot_url || null
      },
      include: {
        event_type: true
      }
    });

    return res.status(201).json({
      success: true,
      message: "Fatigue event created successfully",
      data: event
    });
  } catch (error) {
    console.error("Create fatigue event error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/fatigue-events/session/:sessionId
 * Get all fatigue events for a specific session
 */
const getFatigueEventsBySession = async (req, res) => {
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

    // Get fatigue events
    const events = await prisma.fatigueEvent.findMany({
      where: { session_id: parseInt(sessionId) },
      include: {
        event_type: true
      },
      orderBy: { timestamp: "desc" }
    });

    return res.status(200).json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error("Get fatigue events error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  createFatigueEvent,
  getFatigueEventsBySession
};
