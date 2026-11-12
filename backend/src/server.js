// Local development entry point.
// On Vercel, api/index.js is used instead (no app.listen needed there).
const app = require("./app");
const createMonitoringSocket = require("./services/monitoringSocket");

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

createMonitoringSocket(server, app.locals.allowedOrigins);
