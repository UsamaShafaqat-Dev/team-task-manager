const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { ensureAuth } = require("../middleware/auth");

// @route   POST /teams
// @desc    Create a new team (Protected Route)
router.post("/", ensureAuth, async (req, res) => {
  try {
    const { name } = req.body;

    // Nayi team database mein save ho rahi hai, aur created_by mein logged-in user ki ID jayegi
    const newTeam = await pool.query(
      "INSERT INTO teams (name, created_by) VALUES ($1, $2) RETURNING *",
      [name, req.user.id],
    );

    res.status(201).json({
      message: "Team created successfully!",
      team: newTeam.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error while creating team" });
  }
});

// @route   GET /teams
// @desc    Get all teams for logged-in user
router.get("/", ensureAuth, async (req, res) => {
  try {
    const teams = await pool.query(
      "SELECT * FROM teams WHERE created_by = $1",
      [req.user.id],
    );
    res.json(teams.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error while fetching teams" });
  }
});

module.exports = router;
