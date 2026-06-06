const express = require("express");
const router = express.Router();
const Joi = require("joi");
const bcrypt = require("bcrypt");
const passport = require("passport");
const pool = require("../config/db");

// Joi Validation Schemas (Input Validation & Sanitization)
const registerSchema = Joi.object({
  // trim() se extra spaces sanitize hongi, aur strict rules lagaye hain
  fullName: Joi.string().trim().min(3).max(50).required().messages({
    "string.empty": "Full Name cannot be empty",
    "string.min": "Full Name must be at least 3 characters long",
  }),
  email: Joi.string().trim().email().lowercase().required().messages({
    "string.email": "Please provide a valid email address",
  }),
  password: Joi.string().min(6).max(255).required().messages({
    "string.min": "Password must be at least 6 characters long",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().trim().email().lowercase().required(),
  password: Joi.string().required(),
});

// @route   POST /auth/register
router.post("/register", async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error)
      return res.status(400).json({ message: error.details[0].message });

    const { fullName, email, password } = value; // Sanitized values use hongi

    const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (userExist.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      "INSERT INTO users (full_name, email, password) VALUES ($1, $2, $3) RETURNING id, full_name, email",
      [fullName, email, hashedPassword],
    );

    res.status(201).json({
      message: "Account created successfully! 🎉",
      user: newUser.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   POST /auth/login
router.post("/login", (req, res, next) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.details[0].message });

  // req.body ki jagah sanitized value bhejte hain
  req.body = value;

  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(500).json({ message: "Server error" });

    if (!user) return res.status(400).json({ message: info.message });

    req.logIn(user, (err) => {
      if (err) return res.status(500).json({ message: "Login session error" });

      return res.status(200).json({
        message: "Logged in successfully! 🚀",
        user: { id: user.id, name: user.full_name, email: user.email },
      });
    });
  })(req, res, next);
});

// @route   POST /auth/logout
router.post("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: "Logout error" });

    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });
});

module.exports = router;
