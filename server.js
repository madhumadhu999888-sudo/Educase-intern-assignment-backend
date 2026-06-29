const express = require("express");
const cors = require("cors");
require("dotenv").config();

const githubRoutes = require("./routes/githubRoutes");
const db = require("./db");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to GitHub Profile Analyzer API",
    endpoints: {
      analyzeProfile: "POST /api/github/:username",
      getAllProfiles: "GET /api/profiles",
      getSingleProfile: "GET /api/profiles/:username",
    },
  });
});

app.use("/api", githubRoutes);

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await db.execute("SELECT 1");
    console.log("MySQL Database connected successfully!");

    const server = app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`\n❌ Error: Port ${PORT} is already in use by another program!`);
        console.error("   To fix this, either:");
        console.error(`   1. Stop the application/service currently running on port ${PORT}`);
        console.error("   2. Edit your `.env` file and change PORT to another number (e.g. PORT=3001)\n");
      } else {
        console.error("Server error:", err.message);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to connect to MySQL Database!");
    console.error("Error:", error.message);
    console.error("");
    console.error("Please check:");
    console.error("  1. MySQL is running on your computer");
    console.error("  2. Your .env file has the correct password");
    console.error("  3. The database 'github_analyzer' exists");
    process.exit(1);
  }
}

startServer();
