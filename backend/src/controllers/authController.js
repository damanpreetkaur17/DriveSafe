const bcrypt = require("bcryptjs");
const { OAuth2Client } = require("google-auth-library");
const prisma = require("../config/db");
const { generateToken } = require("../utils/generateToken");

/**
 * POST /api/auth/signup
 * Register a new user with username, email, and password
 */
const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Username, email, and password are required"
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Validate password length (minimum 6 characters)
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({
          success: false,
          message: "Email already registered"
        });
      }
      if (existingUser.username === username) {
        return res.status(400).json({
          success: false,
          message: "Username already taken"
        });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password_hash: hashedPassword
      }
    });

    // Generate JWT token
    const token = generateToken(newUser.user_id);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user_id: newUser.user_id,
        username: newUser.username,
        email: newUser.email,
        token
      }
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/auth/login
 * Login user with email and password
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Generate JWT token
    const token = generateToken(user.user_id);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
const getMe = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated"
      });
    }

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        username: true,
        email: true,
        created_at: true,
        updated_at: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Get me error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout user (client-side token removal)
 */
const logout = (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

const googleLogin = async (req, res) => {
  try {
    const { credential, email, name } = req.body || {};
    const clientId = process.env.GOOGLE_CLIENT_ID;

    let normalizedEmail = String(email || "").trim().toLowerCase();
    let displayName = String(name || "Google User").trim();

    if (!clientId || clientId.includes("YOUR_")) {
      return res.status(400).json({
        success: false,
        message: "Google OAuth is not configured. Add GOOGLE_CLIENT_ID to backend/.env."
      });
    }

    if (credential) {
      const oauthClient = new OAuth2Client(clientId);
      const ticket = await oauthClient.verifyIdToken({
        idToken: credential,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        return res.status(400).json({
          success: false,
          message: "Google user information is missing"
        });
      }

      normalizedEmail = payload.email.toLowerCase();
      displayName = payload.name || payload.given_name || "Google User";
    }

    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "A valid Google email is required"
      });
    }

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user) {
      const baseUsername = String(normalizedEmail.split("@")[0] || "googleuser")
        .trim()
        .replace(/[^a-zA-Z0-9_.-]/g, "")
        .slice(0, 20) || "googleuser";
      
      let generatedUsername = baseUsername;
      let counter = 1;

      while (await prisma.user.findUnique({ where: { username: generatedUsername } })) {
        generatedUsername = `${baseUsername}${counter}`;
        counter += 1;
      }

      user = await prisma.user.create({
        data: {
          username: generatedUsername,
          email: normalizedEmail,
          password_hash: await bcrypt.hash(`${normalizedEmail}-google-login-${Date.now()}`, 10)
        }
      });
    }

    const token = generateToken(user.user_id);

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      data: {
        user_id: user.user_id,
        username: user.username,
        email: user.email,
        token
      }
    });
  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    });
  }
};

module.exports = {
  signup,
  login,
  getMe,
  logout,
  googleLogin
};
