const getServiceHealth = async (_req, res) => {
  const serviceUrl = process.env.ML_SERVICE_URL || "http://127.0.0.1:8000";
  const serviceKey = process.env.ML_SERVICE_API_KEY;
  if (!serviceKey) {
    return res.status(503).json({
      success: false,
      data: { status: "unavailable" },
      message: "ML service credentials are not configured"
    });
  }

  try {
    const response = await fetch(`${serviceUrl.replace(/\/$/, "")}/health`, {
      headers: { "X-Service-Key": serviceKey },
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) {
      return res.status(503).json({
        success: false,
        data: { status: "unavailable" },
        message:
          response.status === 503
            ? "ML model is unavailable"
            : "ML service health check failed"
      });
    }

    return res.status(200).json({
      success: true,
      data: { status: "ready" }
    });
  } catch (error) {
    console.error("ML service health check failed:", error.message);
    return res.status(503).json({
      success: false,
      data: { status: "unavailable" },
      message: "ML service is unavailable"
    });
  }
};

module.exports = { getServiceHealth };
