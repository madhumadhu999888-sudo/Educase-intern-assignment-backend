// db.js - MySQL Database Connection Setup

const mysql = require("mysql2/promise");
require("dotenv").config();

// Create a connection pool to MySQL
// A pool manages multiple connections so we don't open/close for every query
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "github_analyzer",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // max 10 connections at a time
});

module.exports = pool;
