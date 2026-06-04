const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const pool = require("./db");

module.exports = function (passport) {
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          // 1. Check user in DB
          const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email],
          );
          if (result.rows.length === 0) {
            return done(null, false, {
              message: "That email is not registered",
            });
          }

          const user = result.rows[0];

          // 2. Match password
          const isMatch = await bcrypt.compare(password, user.password);
          if (isMatch) {
            return done(null, user); // Password sahi hai, user return karo
          } else {
            return done(null, false, { message: "Password incorrect" }); // Ghalt password
          }
        } catch (err) {
          return done(err);
        }
      },
    ),
  );

  // Serialize user (Session mein user ki ID save karna)
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user (Session ID se DB se user nikalna)
  passport.deserializeUser(async (id, done) => {
    try {
      const result = await pool.query(
        "SELECT id, full_name, email FROM users WHERE id = $1",
        [id],
      );
      done(null, result.rows[0]);
    } catch (err) {
      done(err, null);
    }
  });
};
