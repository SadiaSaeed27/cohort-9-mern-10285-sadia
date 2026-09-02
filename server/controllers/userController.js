const User = require("../models/User");

// @desc    Get current user's profile
// @route   GET /api/users/me
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).select(
      "_id name email createdAt",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update current user's profile
// @route   PATCH /api/users/me
const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;

    if (typeof name !== "string") {
      return res.status(400).json({
        success: false,
        message: "Name must be a string",
      });
    }

    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Name must be at least 2 characters",
      });
    }

    if (trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Name cannot exceed 50 characters",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name: trimmedName },
      {
        new: true,
        runValidators: true,
      },
    ).select("_id name email createdAt");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Notify all tabs/devices belonging to this user
    const io = req.app.get("io");

    if (io) {
      io.to(`user:${req.user.userId}`).emit("user:updated", user);
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};
