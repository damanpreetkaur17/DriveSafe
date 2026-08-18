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

const app = express();
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://192.168.56.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running"
  });
});

// Home endpoint
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Driver Fatigue Detection API is running"
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/emergency-contacts", emergencyRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/fatigue-events", fatigueRoutes);
app.use("/api/alerts", alertRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});