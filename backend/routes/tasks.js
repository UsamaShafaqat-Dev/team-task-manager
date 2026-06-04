const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { ensureAuth } = require("../middleware/auth");

// @route   POST /tasks
// @desc    Create a new task (Protected Route)
router.post("/", ensureAuth, async (req, res) => {
  try {
    const { title, description, dueDate } = req.body;

    // Task database mein save kar rahe hain, aur 'assigned_to' mein logged-in user ki ID dal rahe hain
    const newTask = await pool.query(
      "INSERT INTO tasks (title, description, due_date, assigned_to) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, description, dueDate, req.user.id],
    );

    res.status(201).json({
      message: "Task created successfully!",
      task: newTask.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error while creating task" });
  }
});

// @route   GET /tasks
// @desc    Get all tasks for logged-in user (Protected Route)
router.get("/", ensureAuth, async (req, res) => {
  try {
    const tasks = await pool.query(
      "SELECT * FROM tasks WHERE assigned_to = $1",
      [req.user.id],
    );
    res.json(tasks.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error while fetching tasks" });
  }
});

module.exports = router;
