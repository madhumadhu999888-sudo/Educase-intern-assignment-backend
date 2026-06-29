# GitHub Profile Analyzer API

A backend service built with **Node.js**, **Express.js**, and **MySQL** that analyzes GitHub user profiles using the GitHub public API and stores useful insights in a database.

---

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Database
- **Axios** - HTTP client for GitHub API calls
- **dotenv** - Environment variable management
- **cors** - Cross-origin resource sharing

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd github-profile-analyzer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup MySQL Database

Make sure MySQL is installed and running on your system. Then run the schema file:

```bash
mysql -u root -p < schema.sql
```

Or open MySQL Workbench / terminal and run the commands from `schema.sql` manually.

### 4. Configure Environment Variables

Edit the `.env` file in the root directory and update your MySQL credentials:

```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=github_analyzer
DB_PORT=3306
```

### 5. Start the Server

```bash
# For development (auto-restarts on file changes)
npm run dev

# For production
npm start
```

The server will start at `http://localhost:5000`

---

## API Endpoints

### 1. Analyze a GitHub Profile

**POST** `/api/github/:username`

Fetches the GitHub profile data, calculates useful insights, and stores everything in the database.

**Example:**
```
POST http://localhost:5000/api/github/torvalds
```

**Response:**
```json
{
  "message": "Profile analyzed and stored successfully!",
  "profile": {
    "username": "torvalds",
    "name": "Linus Torvalds",
    "public_repos": 12,
    "followers": 309267,
    "following": 0,
    "location": "Portland, OR",
    "company": "Linux Foundation",
    "account_age_days": 5413,
    "avg_repos_per_year": 0.81,
    "followers_following_ratio": 309267,
    "profile_score": 74
  }
}
```

---

### 2. Get All Analyzed Profiles

**GET** `/api/profiles`

Returns all stored GitHub profiles from the database.

**Example:**
```
GET http://localhost:5000/api/profiles
```

**Response:**
```json
{
  "message": "All analyzed profiles fetched successfully!",
  "count": 2,
  "profiles": [ ... ]
}
```

---

### 3. Get a Single Profile

**GET** `/api/profiles/:username`

Returns a single stored profile by username.

**Example:**
```
GET http://localhost:5000/api/profiles/torvalds
```

**Response:**
```json
{
  "message": "Profile fetched successfully!",
  "profile": {
    "id": 1,
    "username": "torvalds",
    "name": "Linus Torvalds",
    ...
  }
}
```

---

## Database Schema

| Column                      | Type         | Description                              |
| --------------------------- | ------------ | ---------------------------------------- |
| id                          | INT (PK)     | Auto-increment primary key               |
| username                    | VARCHAR(100) | GitHub username (unique)                 |
| name                        | VARCHAR(255) | Display name                             |
| avatar_url                  | TEXT         | Profile picture URL                      |
| bio                         | TEXT         | User bio                                 |
| public_repos                | INT          | Number of public repositories            |
| public_gists                | INT          | Number of public gists                   |
| followers                   | INT          | Number of followers                      |
| following                   | INT          | Number of users they follow              |
| location                    | VARCHAR(255) | User location                            |
| blog                        | VARCHAR(255) | Blog/website URL                         |
| company                     | VARCHAR(255) | Company name                             |
| twitter_username            | VARCHAR(255) | Twitter handle                           |
| account_created_at          | DATETIME     | GitHub account creation date             |
| profile_url                 | TEXT         | Link to GitHub profile                   |
| account_age_days            | INT          | How old the account is (in days)         |
| avg_repos_per_year          | FLOAT        | Average repositories created per year    |
| followers_following_ratio   | FLOAT        | Followers ÷ Following ratio              |
| profile_score               | FLOAT        | Custom profile activity score (out of 100)|
| analyzed_at                 | TIMESTAMP    | When we first analyzed this profile      |
| updated_at                  | TIMESTAMP    | When the record was last updated         |

### Computed Insights (Extra Features)

The API doesn't just store raw GitHub data — it also calculates these insights:

- **account_age_days**: How many days since the GitHub account was created
- **avg_repos_per_year**: Total public repos ÷ account age in years
- **followers_following_ratio**: Followers ÷ Following (measures influence)
- **profile_score**: A custom score out of 100 based on repos, followers, bio, blog, company, and location

---

## Error Handling

| Status Code | Description                                |
| ----------- | ------------------------------------------ |
| 200         | Success                                    |
| 404         | GitHub user not found / Profile not in DB  |
| 500         | Server error                               |

---

## Project Structure

```
├── server.js                  # Express app entry point
├── db.js                      # MySQL connection pool
├── routes/
│   └── githubRoutes.js        # API route definitions
├── controllers/
│   └── githubController.js    # Business logic & GitHub API calls
├── schema.sql                 # Database schema
├── .env                       # Environment variables
├── .gitignore                 # Git ignore rules
├── package.json               # Dependencies
└── README.md                  # This file
```

---

## Author

Built as a Node.js backend assignment.
