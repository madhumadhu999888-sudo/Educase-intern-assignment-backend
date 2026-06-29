-- Create the database (run this first)
CREATE DATABASE IF NOT EXISTS github_analyzer;

-- Use the database
USE github_analyzer;

-- Create the table to store GitHub profile insights
CREATE TABLE IF NOT EXISTS github_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    bio TEXT,
    public_repos INT DEFAULT 0,
    public_gists INT DEFAULT 0,
    followers INT DEFAULT 0,
    following INT DEFAULT 0,
    location VARCHAR(255),
    blog VARCHAR(255),
    company VARCHAR(255),
    twitter_username VARCHAR(255),
    account_created_at DATETIME,
    profile_url TEXT,

    -- Computed Insights (calculated by our app)
    account_age_days INT DEFAULT 0,
    avg_repos_per_year FLOAT DEFAULT 0,
    followers_following_ratio FLOAT DEFAULT 0,
    profile_score FLOAT DEFAULT 0,

    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
