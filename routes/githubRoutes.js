// routes/githubRoutes.js - All API routes for our application

const express = require("express");
const router = express.Router();

// Import controller functions
const {
  analyzeProfile,
  getAllProfiles,
  getProfileByUsername,
} = require("../controllers/githubController");

// Route 1: Analyze a GitHub profile and store insights
// POST /api/github/:username
router.post("/github/:username", analyzeProfile);

// Route 2: Get all stored analyzed profiles
// GET /api/profiles
router.get("/profiles", getAllProfiles);

// Route 3: Get a single stored profile by username
// GET /api/profiles/:username
router.get("/profiles/:username", getProfileByUsername);

module.exports = router;
