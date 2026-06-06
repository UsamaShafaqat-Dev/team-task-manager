const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const { ensureAuth } = require("../middleware/auth");

// @route   POST /tasks
// @desc    Create a new task (Protected Route)
router.post("/", ensureAuth, async (req, res) => {
  try {
    // 1. Frontend se assigned_to bhi receive karein
    const { title, description, dueDate, teamId, assigned_to } = req.body;

    const taskTeamId = teamId ? teamId : null;

    // 2. Agar user ne kisi ko assign kiya hai toh uska ID, warna by default khud ko assign karo
    const finalAssignee = assigned_to ? assigned_to : req.user.id;

    const newTask = await pool.query(
      "INSERT INTO tasks (title, description, due_date, assigned_to, team_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [title, description, dueDate, finalAssignee, taskTeamId],
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
// @desc    Get all tasks for logged-in user (Personal or Team tasks)
router.get("/", ensureAuth, async (req, res) => {
  try {
    const tasks = await pool.query(
      `SELECT DISTINCT t.* FROM tasks t 
       LEFT JOIN teams tm ON t.team_id = tm.id 
       LEFT JOIN team_members tmem ON tm.id = tmem.team_id
       WHERE t.assigned_to = $1 OR tm.created_by = $1 OR tmem.user_id = $1`,
      [req.user.id],
    );
    res.json(tasks.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error while fetching tasks" });
  }
});

// @route   PUT /tasks/:id
// @desc    Update a task (Protected Route)
router.put("/:id", ensureAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dueDate, status, teamId, assigned_to } =
      req.body;

    const taskTeamId = teamId ? teamId : null;
    const finalAssignee = assigned_to ? assigned_to : req.user.id;

    // 3. Security Update: Task wo update kar sakta hai jo task ka assignee ho YA team ka creator ho
    const updateTask = await pool.query(
      `UPDATE tasks 
       SET title = $1, description = $2, due_date = $3, status = COALESCE($4, status), team_id = $5, assigned_to = $6 
       WHERE id = $7 AND (assigned_to = $8 OR team_id IN (SELECT id FROM teams WHERE created_by = $8))
       RETURNING *`,
      [
        title,
        description,
        dueDate,
        status,
        taskTeamId,
        finalAssignee,
        id,
        req.user.id,
      ],
    );

    if (updateTask.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Task not found or unauthorized to edit" });
    }

    res.json({
      message: "Task updated successfully",
      task: updateTask.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error while updating task" });
  }
});

// @route   DELETE /tasks/:id
// @desc    Delete a task (Protected Route)
router.delete("/:id", ensureAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Same Security Update for Delete
    const deleteTask = await pool.query(
      `DELETE FROM tasks 
       WHERE id = $1 AND (assigned_to = $2 OR team_id IN (SELECT id FROM teams WHERE created_by = $2))
       RETURNING *`,
      [id, req.user.id],
    );

    if (deleteTask.rows.length === 0) {
      return res
        .status(403)
        .json({ message: "Task not found or unauthorized to delete" });
    }

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error while deleting task" });
  }
});

module.exports = router;
