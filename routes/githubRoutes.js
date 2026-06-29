const express = require("express");
const router = express.Router();

const {
  analyzeProfile,
  getAllProfiles,
  getProfileByUsername,
} = require("../controllers/githubController");

router.post("/github/:username", analyzeProfile);
router.get("/profiles", getAllProfiles);
router.get("/profiles/:username", getProfileByUsername);

module.exports = router;
