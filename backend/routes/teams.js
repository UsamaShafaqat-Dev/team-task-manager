const express = require("express");
const router = express.Router();
const Joi = require("joi"); // Joi import kiya
const pool = require("../config/db");
const { ensureAuth } = require("../middleware/auth");

// Joi Validation Schemas (Teams)
const teamSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Team name cannot be empty",
    "string.min": "Team name must be at least 3 characters long",
  }),
});

const addMemberSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Please provide a valid email to invite",
    "string.empty": "Email cannot be empty",
  }),
});

// @route   POST /teams
router.post("/", ensureAuth, async (req, res) => {
  try {
    // Input validation
    const { error, value } = teamSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { name } = value;
    const newTeam = await pool.query(
      "INSERT INTO teams (name, created_by) VALUES ($1, $2) RETURNING *",
      [name, req.user.id],
    );
    res
      .status(201)
      .json({ message: "Team created successfully!", team: newTeam.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error while creating team" });
  }
});

// @route   GET /teams
router.get("/", ensureAuth, async (req, res) => {
  try {
    const teams = await pool.query(
      `SELECT DISTINCT t.* FROM teams t 
       LEFT JOIN team_members tm ON t.id = tm.team_id 
       WHERE t.created_by = $1 OR tm.user_id = $1`,
      [req.user.id],
    );
    res.json(teams.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error while fetching teams" });
  }
});

// @route   POST /teams/:id/members
router.post("/:id/members", ensureAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Input validation
    const { error, value } = addMemberSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { email } = value;

    const teamCheck = await pool.query(
      "SELECT * FROM teams WHERE id = $1 AND created_by = $2",
      [id, req.user.id],
    );
    if (teamCheck.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Only team creator can add members" });
    }

    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email],
    );
    if (userResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "User with this email not found" });
    }
    const memberId = userResult.rows[0].id;

    const memberCheck = await pool.query(
      "SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2",
      [id, memberId],
    );
    if (memberCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "User is already a member of this team" });
    }

    await pool.query(
      "INSERT INTO team_members (team_id, user_id) VALUES ($1, $2) RETURNING *",
      [id, memberId],
    );

    res.status(200).json({ message: "Member added to team successfully!" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error while adding member" });
  }
});

// @route   GET /teams/:id/members
router.get("/:id/members", ensureAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const members = await pool.query(
      `SELECT u.id, u.full_name, u.email 
       FROM users u 
       JOIN team_members tm ON u.id = tm.user_id 
       WHERE tm.team_id = $1`,
      [id],
    );
    res.json(members.rows);
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ message: "Server error while fetching team members" });
  }
});

// @route   DELETE /teams/:id
router.delete("/:id", ensureAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const deleteTeam = await pool.query(
      "DELETE FROM teams WHERE id = $1 AND created_by = $2 RETURNING *",
      [id, req.user.id],
    );
    if (deleteTeam.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Only the team creator can delete this team." });
    }
    res.json({ message: "Team deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error while deleting team" });
  }
});

// @route   PUT /teams/:id
router.put("/:id", ensureAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Input validation for updates
    const { error, value } = teamSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { name } = value;

    const updateTeam = await pool.query(
      "UPDATE teams SET name = $1 WHERE id = $2 AND created_by = $3 RETURNING *",
      [name, id, req.user.id],
    );

    if (updateTeam.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Only the team creator can edit this team." });
    }

    res.json({
      message: "Team updated successfully",
      team: updateTeam.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error while updating team" });
  }
});

module.exports = router;
