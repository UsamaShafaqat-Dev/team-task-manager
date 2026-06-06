const express = require("express");
const cors = require("cors");
const session = require("express-session");
// PDF Requirement: PostgreSQL Session setup
const pgSession = require("connect-pg-simple")(session);
const passport = require("passport");
require("dotenv").config();

const app = express();

// Database Pool import (Session aur Routes ke liye)
const pool = require("./config/db");

// 1. TRUST PROXY SETUP (Render par secure cookies ke liye lazmi hai)
app.set("trust proxy", 1);

// 2. CORS UPDATE (Local aur Vercel dono links allow kar diye hain)
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://team-task-manager-zeta-pink.vercel.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// PDF Strict Rule: Store session in PostgreSQL, fallback to memory in dev
const sessionStore =
  process.env.NODE_ENV === "production"
    ? new pgSession({
        pool: pool,
        tableName: "session", // Postgres mein 'session' table use karega
      })
    : new session.MemoryStore(); // Dev environment ke liye memory store

// 3. EXPRESS SESSION SETUP (Cross-domain cookies fix)
app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "super_secret_key_for_assessment",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Production mein true
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // Vercel aur Render connect karne ke liye
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  }),
);

// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// Passport Config
require("./config/passport")(passport);

// Routes Setup
const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const teamRoutes = require("./routes/teams");

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/teams", teamRoutes);

app.get("/", (req, res) => {
  res.send("Team Task Manager API is running securely...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
