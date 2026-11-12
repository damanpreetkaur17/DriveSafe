const prisma = require("../config/db");

/**
 * POST /api/sessions/start
 * Start a new driving session
 */
const startSession = async (req, res) => {
  try {
    const userId = req.userId;
    const { vehicle_id } = req.body;
    const vehicleId = Number(vehicle_id);

    if (!Number.isSafeInteger(vehicleId) || vehicleId <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid vehicle ID is required"
      });
    }

    const activeSession = await prisma.drivingSession.findFirst({
      where: { user_id: userId, status: "ACTIVE" },
      select: { session_id: true }
    });
    if (activeSession) {
      return res.status(409).json({
        success: false,
        message: "Stop the active monitoring session before starting another"
      });
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { vehicle_id: vehicleId }
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
        vehicle_id: vehicleId,
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
    const parsedSessionId = Number(sessionId);
    if (!Number.isSafeInteger(parsedSessionId) || parsedSessionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID"
      });
    }

    const session = await prisma.drivingSession.findUnique({
      where: { session_id: parsedSessionId }
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

    const updatedSession = await prisma.drivingSession.update({
      where: { session_id: parsedSessionId },
      data: {
        end_time: new Date(),
        status: session.status === "INTERRUPTED" ? "INTERRUPTED" : "COMPLETED"
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
        vehicle: true,
        _count: { select: { fatigue_events: true, detection_samples: true } }
      },
      orderBy: { created_at: "desc" }
    });
    const sessionIds = sessions.map((session) => session.session_id);
    const [sampleGroups, alertRows, eventGroups] = sessionIds.length
      ? await Promise.all([
          prisma.detectionSample.groupBy({
            by: ["session_id"],
            where: { session_id: { in: sessionIds }, has_face: true },
            _avg: { fatigue_score: true },
            _max: { fatigue_score: true }
          }),
          prisma.alert.findMany({
            where: { event: { session: { user_id: userId } } },
            select: { event: { select: { session_id: true } } }
          }),
          prisma.fatigueEvent.groupBy({
            by: ["session_id", "event_type_id"],
            where: { session_id: { in: sessionIds } },
            _count: { event_id: true }
          })
        ])
      : [[], [], []];
    const eventTypes = eventGroups.length
      ? await prisma.fatigueEventType.findMany({
          where: {
            event_type_id: {
              in: [...new Set(eventGroups.map((group) => group.event_type_id))]
            }
          },
          select: { event_type_id: true, event_name: true }
        })
      : [];
    const samplesBySession = new Map(
      sampleGroups.map((group) => [group.session_id, group])
    );
    const alertsBySession = new Map();
    for (const alert of alertRows) {
      const sessionId = alert.event.session_id;
      alertsBySession.set(sessionId, (alertsBySession.get(sessionId) || 0) + 1);
    }
    const eventsBySession = new Map();
    for (const group of eventGroups) {
      const eventName =
        eventTypes.find((type) => type.event_type_id === group.event_type_id)?.event_name ??
        "UNKNOWN";
      const eventCounts = eventsBySession.get(group.session_id) || {};
      eventCounts[eventName] = group._count.event_id;
      eventsBySession.set(group.session_id, eventCounts);
    }

    return res.status(200).json({
      success: true,
      data: sessions.map((session) => ({
        ...session,
        duration_ms: Math.max(
          0,
          (session.end_time ?? new Date()).getTime() - session.start_time.getTime()
        ),
        average_fatigue_score:
          samplesBySession.get(session.session_id)?._avg.fatigue_score ?? null,
        maximum_fatigue_score:
          samplesBySession.get(session.session_id)?._max.fatigue_score ?? null,
        alert_count: alertsBySession.get(session.session_id) || 0,
        event_counts: eventsBySession.get(session.session_id) || {}
      }))
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
    const parsedSessionId = Number(sessionId);
    if (!Number.isSafeInteger(parsedSessionId) || parsedSessionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID"
      });
    }

    const session = await prisma.drivingSession.findUnique({
      where: { session_id: parsedSessionId },
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

const getSessionDetections = async (req, res) => {
  try {
    const userId = req.userId;
    const sessionId = Number(req.params.sessionId);
    const limit = Number(req.query.limit ?? 600);
    if (
      !Number.isSafeInteger(sessionId) ||
      sessionId <= 0 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 1000
    ) {
      return res.status(400).json({
        success: false,
        message: "Session ID or limit is invalid"
      });
    }

    const session = await prisma.drivingSession.findFirst({
      where: { session_id: sessionId, user_id: userId },
      select: { session_id: true }
    });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    const [samples, events] = await Promise.all([
      prisma.detectionSample.findMany({
        where: { session_id: sessionId },
        orderBy: { timestamp: "desc" },
        take: limit
      }),
      prisma.fatigueEvent.findMany({
        where: { session_id: sessionId },
        include: { event_type: true, alerts: true },
        orderBy: { timestamp: "desc" }
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        samples: samples.reverse(),
        events
      }
    });
  } catch (error) {
    console.error("Get session detections error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const getSessionSummary = async (req, res) => {
  try {
    const userId = req.userId;
    const sessionId = Number(req.params.sessionId);
    if (!Number.isSafeInteger(sessionId) || sessionId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID"
      });
    }

    const session = await prisma.drivingSession.findFirst({
      where: { session_id: sessionId, user_id: userId },
      include: {
        vehicle: true,
        _count: { select: { fatigue_events: true } }
      }
    });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    const [metrics, samples, eventGroups, alertCount, events] = await Promise.all([
      prisma.detectionSample.aggregate({
        where: { session_id: sessionId, has_face: true },
        _avg: { fatigue_score: true, ear: true },
        _max: { fatigue_score: true },
        _count: { sample_id: true }
      }),
      prisma.detectionSample.findMany({
        where: { session_id: sessionId },
        orderBy: { timestamp: "desc" },
        take: 1000
      }),
      prisma.fatigueEvent.groupBy({
        by: ["event_type_id"],
        where: { session_id: sessionId },
        _count: { event_id: true }
      }),
      prisma.alert.count({
        where: { event: { session_id: sessionId } }
      }),
      prisma.fatigueEvent.findMany({
        where: { session_id: sessionId },
        include: { event_type: true, alerts: true },
        orderBy: { timestamp: "desc" }
      })
    ]);
    const eventTypes = await prisma.fatigueEventType.findMany({
      where: { event_type_id: { in: eventGroups.map((group) => group.event_type_id) } }
    });
    const counts = Object.fromEntries(
      eventGroups.map((group) => [
        eventTypes.find((type) => type.event_type_id === group.event_type_id)?.event_name ??
          "UNKNOWN",
        group._count.event_id
      ])
    );
    const endTime = session.end_time ?? new Date();
    const durationMs = Math.max(0, endTime.getTime() - session.start_time.getTime());

    return res.status(200).json({
      success: true,
      data: {
        session: {
          ...session,
          duration_ms: durationMs,
          alert_count: alertCount
        },
        metrics: {
          average_fatigue_score: metrics._avg.fatigue_score,
          maximum_fatigue_score: metrics._max.fatigue_score,
          average_ear: metrics._avg.ear,
          sample_count: metrics._count.sample_id,
          event_counts: counts,
          alert_count: alertCount,
          attention_distribution: samples
            .filter((sample) => sample.has_face)
            .reduce((distribution, sample) => {
            distribution[sample.attention_status] =
              (distribution[sample.attention_status] || 0) + 1;
            return distribution;
          }, {})
        },
        samples: samples.reverse(),
        events
      }
    });
  } catch (error) {
    console.error("Get session summary error:", error);
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
  getSession,
  getSessionDetections,
  getSessionSummary
};
