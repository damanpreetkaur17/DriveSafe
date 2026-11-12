const express = require("express");
const { getServiceHealth } = require("../controllers/monitoringController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.get("/health", getServiceHealth);

module.exports = router;
