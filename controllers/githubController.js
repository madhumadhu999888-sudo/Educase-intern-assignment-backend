const axios = require("axios");
const db = require("../db");

function calculateInsights(data) {
  const createdDate = new Date(data.created_at);
  const today = new Date();
  const accountAgeDays = Math.floor(
    (today - createdDate) / (1000 * 60 * 60 * 24)
  );

  const accountAgeYears = accountAgeDays / 365;
  const avgReposPerYear =
    accountAgeYears > 0
      ? parseFloat((data.public_repos / accountAgeYears).toFixed(2))
      : 0;

  const followersFollowingRatio =
    data.following > 0
      ? parseFloat((data.followers / data.following).toFixed(2))
      : data.followers;

  let score = 0;
  if (data.public_repos > 0) score += Math.min(data.public_repos * 2, 30);
  if (data.followers > 0) score += Math.min(data.followers * 0.1, 30);
  if (data.bio) score += 10;
  if (data.blog) score += 10;
  if (data.company) score += 10;
  if (data.location) score += 10;
  const profileScore = parseFloat(Math.min(score, 100).toFixed(2));

  return {
    accountAgeDays,
    avgReposPerYear,
    followersFollowingRatio,
    profileScore,
  };
}

const analyzeProfile = async (req, res) => {
  try {
    const { username } = req.params;

    const githubResponse = await axios.get(
      `https://api.github.com/users/${username}`
    );
    const data = githubResponse.data;

    const insights = calculateInsights(data);

    let mysqlDate = null;
    if (data.created_at) {
      mysqlDate = data.created_at.replace("T", " ").replace("Z", "");
    }

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

    res.status(200).json({
      message: "Profile analyzed and stored successfully!",
      profile: profileData,
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
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

const getAllProfiles = async (req, res) => {
  try {
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

const getProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    const [rows] = await db.execute(
      "SELECT * FROM github_profiles WHERE username = ?",
      [username]
    );

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

module.exports = {
  analyzeProfile,
  getAllProfiles,
  getProfileByUsername,
};
