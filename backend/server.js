const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
require("dotenv").config();

const app = express();

// Connect to Database
require("./config/db");

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Express Session Setup
app.use(
  session({
    secret: process.env.SESSION_SECRET || "super_secret_key_for_assessment",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
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
const teamRoutes = require('./routes/teams');

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);
app.use('/teams', teamRoutes);

app.get("/", (req, res) => {
  res.send("Team Task Manager API is running securely...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
