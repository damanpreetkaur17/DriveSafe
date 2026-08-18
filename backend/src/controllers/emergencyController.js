const prisma = require("../config/db");

/**
 * GET /api/emergency-contacts
 * Get all emergency contacts for current user
 */
const getEmergencyContacts = async (req, res) => {
  try {
    const userId = req.userId;

    const contacts = await prisma.emergencyContact.findMany({
      where: { user_id: userId },
      orderBy: { priority: "asc" }
    });

    return res.status(200).json({
      success: true,
      data: contacts
    });
  } catch (error) {
    console.error("Get emergency contacts error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * POST /api/emergency-contacts
 * Create a new emergency contact
 */
const createEmergencyContact = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, phone, relationship, priority } = req.body;

    // Validation
    if (!name || !phone || !relationship) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and relationship are required"
      });
    }

    // Create emergency contact
    const contact = await prisma.emergencyContact.create({
      data: {
        user_id: userId,
        name,
        phone,
        relationship,
        priority: priority || 1
      }
    });

    return res.status(201).json({
      success: true,
      message: "Emergency contact created successfully",
      data: contact
    });
  } catch (error) {
    console.error("Create emergency contact error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * PUT /api/emergency-contacts/:contactId
 * Update an emergency contact
 */
const updateEmergencyContact = async (req, res) => {
  try {
    const userId = req.userId;
    const { contactId } = req.params;
    const { name, phone, relationship, priority } = req.body;

    // Check if contact exists and belongs to user
    const contact = await prisma.emergencyContact.findUnique({
      where: { contact_id: parseInt(contactId) }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Emergency contact not found"
      });
    }

    if (contact.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Update emergency contact
    const updatedContact = await prisma.emergencyContact.update({
      where: { contact_id: parseInt(contactId) },
      data: {
        name: name || contact.name,
        phone: phone || contact.phone,
        relationship: relationship || contact.relationship,
        priority: priority !== undefined ? priority : contact.priority
      }
    });

    return res.status(200).json({
      success: true,
      message: "Emergency contact updated successfully",
      data: updatedContact
    });
  } catch (error) {
    console.error("Update emergency contact error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * DELETE /api/emergency-contacts/:contactId
 * Delete an emergency contact
 */
const deleteEmergencyContact = async (req, res) => {
  try {
    const userId = req.userId;
    const { contactId } = req.params;

    // Check if contact exists and belongs to user
    const contact = await prisma.emergencyContact.findUnique({
      where: { contact_id: parseInt(contactId) }
    });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Emergency contact not found"
      });
    }

    if (contact.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized"
      });
    }

    // Delete emergency contact
    await prisma.emergencyContact.delete({
      where: { contact_id: parseInt(contactId) }
    });

    return res.status(200).json({
      success: true,
      message: "Emergency contact deleted successfully"
    });
  } catch (error) {
    console.error("Delete emergency contact error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

module.exports = {
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact
};
