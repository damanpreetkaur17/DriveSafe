const { WebSocketServer, WebSocket } = require("ws");
const prisma = require("../config/db");
const { verifyToken } = require("../utils/generateToken");

const MAX_FRAME_BYTES = 2 * 1024 * 1024;
const SAMPLE_INTERVAL_MS = 1000;

const send = (socket, message) => {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message));
  }
};

const isAllowedOrigin = (origin, allowedOrigins) =>
  !origin || allowedOrigins.includes(origin);

const parseUser = (request) => {
  const protocols = (request.headers["sec-websocket-protocol"] || "")
    .split(",")
    .map((protocol) => protocol.trim());
  const tokenProtocol = protocols.find((protocol) =>
    protocol.startsWith("bearer.")
  );
  if (!protocols.includes("drivesafe") || !tokenProtocol) {
    throw new Error("Missing WebSocket credentials");
  }

  const payload = verifyToken(tokenProtocol.slice("bearer.".length));
  if (!Number.isInteger(payload.userId) || payload.userId <= 0) {
    throw new Error("Invalid WebSocket user");
  }
  return payload.userId;
};

const persistDetection = async (sessionId, result, lastSampleAt) => {
  const timestamp = new Date(result.timestamp);
  if (!Number.isFinite(timestamp.getTime())) {
    throw new Error("Inference service returned an invalid timestamp");
  }

  if (timestamp.getTime() - lastSampleAt >= SAMPLE_INTERVAL_MS) {
    await prisma.detectionSample.create({
      data: {
        session_id: sessionId,
        timestamp,
        has_face: result.hasFace,
        eye_status: result.eyeStatus,
        ear: result.ear,
        yawn_detected: result.yawnDetected,
        mouth_ratio: result.mouthRatio,
        head_pitch: result.headPose?.pitch ?? null,
        head_yaw: result.headPose?.yaw ?? null,
        head_roll: result.headPose?.roll ?? null,
        attention_status: result.attentionStatus,
        drowsiness_level: result.drowsinessLevel,
        fatigue_score: result.fatigueScore,
      },
    });
    lastSampleAt = timestamp.getTime();
  }

  for (const event of result.events || []) {
    await prisma.$transaction(async (transaction) => {
      const eventType = await transaction.fatigueEventType.upsert({
        where: { event_name: event.type },
        create: { event_name: event.type },
        update: {},
      });
      const fatigueEvent = await transaction.fatigueEvent.create({
        data: {
          session_id: sessionId,
          event_type_id: eventType.event_type_id,
          confidence: null,
          severity: event.severity,
          timestamp,
          duration: Number.isInteger(event.durationMs) ? event.durationMs : null,
        },
      });
      await transaction.alert.create({
        data: {
          event_id: fatigueEvent.event_id,
          alert_type: event.severity,
          message: event.message,
          status: "ACTIVE",
        },
      });
    });
  }

  return lastSampleAt;
};

const closeInferenceSession = async (sessionId) => {
  const serviceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
  const serviceKey = process.env.ML_SERVICE_API_KEY;
  if (!serviceKey) {
    console.error("ML_SERVICE_API_KEY is not configured; cannot clear inference state");
    return;
  }

  try {
    const response = await fetch(
      `${serviceUrl.replace(/\/$/, "")}/sessions/${encodeURIComponent(sessionId)}`,
      {
        method: "DELETE",
        headers: { "X-Service-Key": serviceKey },
        signal: AbortSignal.timeout(3000),
      }
    );
    if (!response.ok) {
      console.error(`ML service did not clear session ${sessionId} (${response.status})`);
    }
  } catch (error) {
    console.error("Unable to clear ML inference session:", error.message);
  }
};

const createMonitoringSocket = (httpServer, allowedOrigins) => {
  const websocketServer = new WebSocketServer({
    server: httpServer,
    path: "/ws/monitoring",
    maxPayload: MAX_FRAME_BYTES,
    handleProtocols: (protocols) =>
      protocols.has("drivesafe") ? "drivesafe" : false,
  });

  websocketServer.on("connection", (socket, request) => {
    let userId;
    try {
      const origin = request.headers.origin;
      if (!isAllowedOrigin(origin, allowedOrigins)) {
        socket.close(4403, "Origin is not allowed");
        return;
      }
      userId = parseUser(request);
    } catch (error) {
      socket.close(4401, "Authentication failed");
      return;
    }

    let sessionId = null;
    let lastSampleAt = 0;
    let intentionalStop = false;
    let messageQueue = Promise.resolve();
    send(socket, { type: "connected" });

    const processMessage = async (data, isBinary) => {
      if (!isBinary) {
        let message;
        try {
          message = JSON.parse(data.toString());
        } catch {
          send(socket, { type: "error", message: "Invalid WebSocket message" });
          return;
        }

        if (message.type === "start") {
          if (sessionId || !Number.isSafeInteger(Number(message.sessionId))) {
            send(socket, { type: "error", message: "Invalid session start request" });
            return;
          }
          const session = await prisma.drivingSession.findFirst({
            where: {
              session_id: Number(message.sessionId),
              user_id: userId,
              status: "ACTIVE",
            },
            select: { session_id: true },
          });
          if (!session) {
            send(socket, { type: "error", message: "Active session not found" });
            socket.close(4403, "Session is not available");
            return;
          }
          sessionId = session.session_id;
          send(socket, { type: "ready", sessionId });
          return;
        }

        if (message.type === "stop") {
          intentionalStop = true;
          socket.close(1000, "Monitoring stopped");
          return;
        }

        send(socket, { type: "error", message: "Unsupported WebSocket message" });
        return;
      }

      if (!sessionId) {
        send(socket, { type: "error", message: "Start a session before sending frames" });
        return;
      }
      if (data.length === 0 || data.length > MAX_FRAME_BYTES) {
        send(socket, { type: "error", message: "Frame must be between 1 byte and 2 MB" });
        return;
      }

      const serviceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
      const serviceKey = process.env.ML_SERVICE_API_KEY;
      if (!serviceKey) {
        send(socket, { type: "error", message: "ML service credentials are not configured" });
        socket.close(1011, "ML service configuration error");
        return;
      }

      let response;
      try {
        response = await fetch(
          `${serviceUrl.replace(/\/$/, "")}/infer?session_id=${encodeURIComponent(sessionId)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "image/jpeg",
              "X-Service-Key": serviceKey,
            },
            body: data,
            signal: AbortSignal.timeout(10000),
          }
        );
      } catch (error) {
        console.error("ML service request failed:", error.message);
        send(socket, { type: "error", message: "ML service is unavailable" });
        socket.close(1011, "ML service unavailable");
        return;
      }

      if (!response.ok) {
        console.error(`ML inference failed (${response.status})`);
        send(socket, {
          type: "error",
          message:
            response.status === 503
              ? "ML model is unavailable; check the ML service health endpoint"
              : `ML inference failed (${response.status})`,
        });
        socket.close(1011, "ML inference failed");
        return;
      }

      const result = await response.json();
      try {
        lastSampleAt = await persistDetection(sessionId, result, lastSampleAt);
      } catch (error) {
        console.error("Unable to persist monitoring results:", error);
        send(socket, {
          type: "error",
          message:
            "Monitoring results could not be saved. Apply pending database migrations and check the backend database connection.",
        });
        socket.close(1011, "Monitoring persistence failed");
        return;
      }
      send(socket, { type: "detection", data: result });
    };

    socket.on("message", (data, isBinary) => {
      messageQueue = messageQueue
        .then(() => processMessage(data, isBinary))
        .catch((error) => {
          console.error("Monitoring stream failed:", error);
          send(socket, { type: "error", message: "Unable to process monitoring data" });
          socket.close(1011, "Monitoring stream failed");
        });
    });

    socket.on("close", () => {
      if (!sessionId) return;
      void closeInferenceSession(sessionId);
      if (!intentionalStop) {
        prisma.drivingSession
          .updateMany({
            where: { session_id: sessionId, user_id: userId, status: "ACTIVE" },
            data: { end_time: new Date(), status: "INTERRUPTED" },
          })
          .catch((error) =>
            console.error("Unable to close interrupted session:", error)
          );
      }
    });
  });

  websocketServer.on("error", (error) => {
    console.error("Monitoring WebSocket server error:", error);
  });

  return websocketServer;
};

module.exports = createMonitoringSocket;
