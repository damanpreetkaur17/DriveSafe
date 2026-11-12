const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const sessionRoutes = require("./routes/sessionRoutes");
const fatigueRoutes = require("./routes/fatigueRoutes");
const alertRoutes = require("./routes/alertRoutes");
const monitoringRoutes = require("./routes/monitoringRoutes");

const app = express();

// Build the CORS allow-list from hard-coded locals + CLIENT_URL env var.
// On Vercel set CLIENT_URL to your frontend URL, e.g.:
//   CLIENT_URL="https://aiml-oms6.vercel.app"
// Multiple origins are supported as a comma-separated list.
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://drivesafe-smoky.vercel.app/",
  "https://drivesafe-smoky.vercel.app",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
];
app.locals.allowedOrigins = allowedOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no origin header) and listed origins.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────

app.get("/", (_req, res) => {
  res.json({ success: true, message: "DriveSafe API is running" });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, message: "API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/emergency-contacts", emergencyRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/fatigue-events", fatigueRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/monitoring", monitoringRoutes);

// ── Error handlers ────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { error: err.message }),
  });
});

module.exports = app;
