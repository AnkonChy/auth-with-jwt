
import app from "./app.js";
import dotenv from "dotenv";
import pool from "./config/db.js";

dotenv.config();
const port = process.env.PORT || 5000;

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`);
// });


async function startServer() {
  try {
    // ✅ Check DB connection
    await pool.query("SELECT 1");
    console.log("PostgreSQL connected ✅");

    // ✅ Start server only if DB is OK
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });

  } catch (err) {
    console.error("DB connection failed ❌", err);
  }
}

startServer();