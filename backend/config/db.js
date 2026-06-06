const { Pool } = require("pg");
require("dotenv").config();

// 1. Debugging: Check karenge ke .env se URL aa bhi raha hai ya nahi
console.log(
  "-> Checking URL:",
  process.env.DATABASE_URL ? "✅ Loaded" : "❌ Missing!",
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  family: 4, // 🚀 YEH SAB SE ZAROORI HAI: Forces IPv4 (Network Timeout fix)
  connectionTimeoutMillis: 15000,
});

pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err.message);
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("❌ PostgreSQL Connection Error:", err.message);
  } else {
    console.log("✅ PostgreSQL Connected Successfully! 🚀");
    release();
  }
});

module.exports = pool;
