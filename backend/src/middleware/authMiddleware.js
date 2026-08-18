const { verifyToken } = require("../utils/generateToken");

/**
 * Authentication middleware to protect routes
 * Extracts JWT token from Authorization header and verifies it
 */
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "No authorization header provided"
      });
    }

    // Extract token from "Bearer <token>"
    const token = authHeader.startsWith("Bearer ") 
      ? authHeader.slice(7) 
      : authHeader;

    // Verify token
    const decoded = verifyToken(token);
    
    // Attach user ID to request
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

module.exports = authMiddleware;
