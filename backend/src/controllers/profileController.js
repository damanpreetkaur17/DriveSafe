const prisma = require("../config/db");

/**
 * GET /api/profile
 * Get current user's profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.userId;

    const profile = await prisma.profile.findUnique({
      where: { user_id: userId },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found"
      });
    }

    // Flatten the response to include username and email at top level
    const response = {
      ...profile,
      username: profile.user.username,
      email: profile.user.email
    };

    return res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/profile
 * Create user profile
 */
const createProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { full_name, phone, date_of_birth, gender, address, username } = req.body;

    // Validation
    if (!full_name || !phone) {
      return res.status(400).json({
        success: false,
        message: "Full name and phone number are required"
      });
    }

    // Check if profile already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { user_id: userId }
    });

    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Profile already exists for this user"
      });
    }

    // Update username if provided
    if (username && username.trim()) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: username.trim() }
      });

      if (existingUsername && existingUsername.user_id !== userId) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken"
        });
      }

      await prisma.user.update({
        where: { user_id: userId },
        data: { username: username.trim() }
      });
    }

    // Create profile
    const profile = await prisma.profile.create({
      data: {
        user_id: userId,
        full_name,
        phone: phone.trim(),
        date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
        gender: gender || null,
        address: address || null
      }
    });

    return res.status(201).json({
      success: true,
      message: "Profile created successfully",
      data: profile
    });
  } catch (error) {
    console.error("Create profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PUT /api/profile
 * Update user profile
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const { full_name, phone, date_of_birth, gender, address, username } = req.body;

    if (!full_name || !full_name.trim() || !phone || !phone.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name and phone number are required"
      });
    }

    const profile = await prisma.profile.findUnique({
      where: { user_id: userId }
    });

    // Update username if provided
    if (username && username.trim()) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: username.trim() }
      });

      if (existingUsername && existingUsername.user_id !== userId) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken"
        });
      }

      await prisma.user.update({
        where: { user_id: userId },
        data: { username: username.trim() }
      });
    }

    const profileData = {
      full_name: full_name.trim(),
      phone: phone.trim(),
      gender: gender !== undefined ? (gender.trim() || null) : (profile?.gender || null),
      address: address !== undefined ? (address.trim() || null) : (profile?.address || null)
    };

    if (date_of_birth !== undefined) {
      if (!date_of_birth) {
        profileData.date_of_birth = null;
      } else {
        const parsedDate = new Date(date_of_birth);
        if (Number.isNaN(parsedDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Date of birth must be a valid date"
          });
        }
        profileData.date_of_birth = parsedDate;
      }
    }

    const savedProfile = profile
      ? await prisma.profile.update({
        where: { user_id: userId },
        data: profileData,
        include: {
          user: {
            select: {
              username: true,
              email: true
            }
          }
        }
      })
      : await prisma.profile.create({
        data: {
          user_id: userId,
          ...profileData
        },
        include: {
          user: {
            select: {
              username: true,
              email: true
            }
          }
        }
      });

    return res.status(200).json({
      success: true,
      message: profile ? "Profile updated successfully" : "Profile created successfully",
      data: {
        ...savedProfile,
        username: savedProfile.user.username,
        email: savedProfile.user.email
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  getProfile,
  createProfile,
  updateProfile
};
