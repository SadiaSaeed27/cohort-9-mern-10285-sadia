const express = require("express");

const verifyToken = require("../middleware/verifyToken");

const {
  getProfile,
  updateProfile,
} = require("../controllers/userController");

const router = express.Router();

// Get current user's profile
router.get("/me", verifyToken, getProfile);

// Update current user's profile
router.patch("/me", verifyToken, updateProfile);

module.exports = router;