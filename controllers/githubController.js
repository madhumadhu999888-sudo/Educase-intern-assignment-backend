// controllers/githubController.js - All the logic for our API endpoints

const axios = require("axios");
const db = require("../db");

// ============================================
// Helper: Calculate extra insights from profile data
// ============================================
// This makes our analyzer more useful than just storing raw data

function calculateInsights(data) {
  // Calculate how old the GitHub account is (in days)
  const createdDate = new Date(data.created_at);
  const today = new Date();
  const accountAgeDays = Math.floor(
    (today - createdDate) / (1000 * 60 * 60 * 24)
  );

  // Calculate average repositories per year
  const accountAgeYears = accountAgeDays / 365;
  const avgReposPerYear =
    accountAgeYears > 0
      ? parseFloat((data.public_repos / accountAgeYears).toFixed(2))
      : 0;

  // Calculate followers to following ratio
  const followersFollowingRatio =
    data.following > 0
      ? parseFloat((data.followers / data.following).toFixed(2))
      : data.followers; // if following is 0, ratio is just the follower count

  // Calculate a simple profile score (out of 100)
  // This is our own custom metric to rate how active/popular a profile is
  let score = 0;
  if (data.public_repos > 0) score += Math.min(data.public_repos * 2, 30); // max 30 points for repos
  if (data.followers > 0) score += Math.min(data.followers * 0.1, 30); // max 30 points for followers
  if (data.bio) score += 10; // 10 points for having a bio
  if (data.blog) score += 10; // 10 points for having a blog/website
  if (data.company) score += 10; // 10 points for listing a company
  if (data.location) score += 10; // 10 points for listing location
  const profileScore = parseFloat(Math.min(score, 100).toFixed(2));

  return {
    accountAgeDays,
    avgReposPerYear,
    followersFollowingRatio,
    profileScore,
  };
}

// ============================================
// Controller 1: Analyze a GitHub Profile
// ============================================
// This function fetches data from GitHub API and stores it in our database

const analyzeProfile = async (req, res) => {
  try {
    const { username } = req.params;

    // Step 1: Fetch profile data from GitHub public API
    const githubResponse = await axios.get(
      `https://api.github.com/users/${username}`
    );
    const data = githubResponse.data;

    // Step 2: Calculate extra insights
    const insights = calculateInsights(data);

    // Step 3: Convert GitHub date format to MySQL format
    // GitHub gives: "2011-09-03T15:26:22Z"
    // MySQL needs: "2011-09-03 15:26:22"
    let mysqlDate = null;
    if (data.created_at) {
      mysqlDate = data.created_at.replace("T", " ").replace("Z", "");
    }

    // Step 4: Prepare all the data we want to store
    const profileData = {
      username: data.login,
      name: data.name || null,
      avatar_url: data.avatar_url || null,
      bio: data.bio || null,
      public_repos: data.public_repos || 0,
      public_gists: data.public_gists || 0,
      followers: data.followers || 0,
      following: data.following || 0,
      location: data.location || null,
      blog: data.blog || null,
      company: data.company || null,
      twitter_username: data.twitter_username || null,
      account_created_at: mysqlDate,
      profile_url: data.html_url || null,
      account_age_days: insights.accountAgeDays,
      avg_repos_per_year: insights.avgReposPerYear,
      followers_following_ratio: insights.followersFollowingRatio,
      profile_score: insights.profileScore,
    };

    // Step 5: Store insights in MySQL database
    // Using INSERT ... ON DUPLICATE KEY UPDATE so that:
    // - If username is new → insert a new row
    // - If username already exists → update the existing row
    const query = `
      INSERT INTO github_profiles 
        (username, name, avatar_url, bio, public_repos, public_gists, followers, following, 
         location, blog, company, twitter_username, account_created_at, profile_url,
         account_age_days, avg_repos_per_year, followers_following_ratio, profile_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        avatar_url = VALUES(avatar_url),
        bio = VALUES(bio),
        public_repos = VALUES(public_repos),
        public_gists = VALUES(public_gists),
        followers = VALUES(followers),
        following = VALUES(following),
        location = VALUES(location),
        blog = VALUES(blog),
        company = VALUES(company),
        twitter_username = VALUES(twitter_username),
        account_created_at = VALUES(account_created_at),
        profile_url = VALUES(profile_url),
        account_age_days = VALUES(account_age_days),
        avg_repos_per_year = VALUES(avg_repos_per_year),
        followers_following_ratio = VALUES(followers_following_ratio),
        profile_score = VALUES(profile_score)
    `;

    const values = [
      profileData.username,
      profileData.name,
      profileData.avatar_url,
      profileData.bio,
      profileData.public_repos,
      profileData.public_gists,
      profileData.followers,
      profileData.following,
      profileData.location,
      profileData.blog,
      profileData.company,
      profileData.twitter_username,
      profileData.account_created_at,
      profileData.profile_url,
      profileData.account_age_days,
      profileData.avg_repos_per_year,
      profileData.followers_following_ratio,
      profileData.profile_score,
    ];

    await db.execute(query, values);

    // Step 6: Send success response
    res.status(200).json({
      message: "Profile analyzed and stored successfully!",
      profile: profileData,
    });
  } catch (error) {
    // Handle errors
    if (error.response && error.response.status === 404) {
      // GitHub user not found
      return res.status(404).json({
        error: "GitHub user not found. Please check the username.",
      });
    }

    console.error("Error analyzing profile:", error.message);
    res.status(500).json({
      error: "Something went wrong while analyzing the profile.",
    });
  }
};

// ============================================
// Controller 2: Get All Stored Profiles
// ============================================
// This function returns all profiles we have analyzed so far

const getAllProfiles = async (req, res) => {
  try {
    // Fetch all profiles, newest first
    const [rows] = await db.execute(
      "SELECT * FROM github_profiles ORDER BY analyzed_at DESC"
    );

    res.status(200).json({
      message: "All analyzed profiles fetched successfully!",
      count: rows.length,
      profiles: rows,
    });
  } catch (error) {
    console.error("Error fetching profiles:", error.message);
    res.status(500).json({
      error: "Something went wrong while fetching profiles.",
    });
  }
};

// ============================================
// Controller 3: Get a Single Profile by Username
// ============================================
// This function returns one specific profile from our database

const getProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    // Find the profile in our database
    const [rows] = await db.execute(
      "SELECT * FROM github_profiles WHERE username = ?",
      [username]
    );

    // Check if profile exists in our database
    if (rows.length === 0) {
      return res.status(404).json({
        error:
          "Profile not found. Please analyze this user first using POST /api/github/:username",
      });
    }

    res.status(200).json({
      message: "Profile fetched successfully!",
      profile: rows[0],
    });
  } catch (error) {
    console.error("Error fetching profile:", error.message);
    res.status(500).json({
      error: "Something went wrong while fetching the profile.",
    });
  }
};

// Export all controller functions
module.exports = {
  analyzeProfile,
  getAllProfiles,
  getProfileByUsername,
};
