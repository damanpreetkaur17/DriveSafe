// Vercel serverless entry point.
// Vercel imports this file and calls the exported handler for every request.
// app.listen is NOT called here — Vercel manages the server lifecycle.
const app = require("../src/app");

module.exports = app;
