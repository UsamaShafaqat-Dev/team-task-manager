module.exports = {
  ensureAuth: (req, res, next) => {
    // PassportJS req.isAuthenticated() provide karta hai
    if (req.isAuthenticated()) {
      return next(); // Agar logged in hai, toh aage jane do
    }
    // Agar logged in nahi hai, toh error bhej do
    res
      .status(401)
      .json({ message: "Unauthorized access! Please log in first." });
  },
};
