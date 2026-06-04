const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Agar cloud DB use karenge toh SSL zaroori hota hai
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("PostgreSQL Connection Error:", err.stack);
  } else {
    console.log("PostgreSQL Connected Successfully! 🚀");
    release();
  }
});

module.exports = pool;
