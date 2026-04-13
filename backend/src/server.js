import app from "./app.js";
import dotenv from "dotenv";
import sequelize from "./config/sequelize.js";

dotenv.config();
const port = process.env.PORT || 5000;

async function startServer() {
  try {
    // Check DB connection
    await sequelize.authenticate();
    console.log("PostgreSQL connected via Sequelize ✅");

    // Start server only if DB is OK
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (err) {
    console.error("DB connection failed ❌", err);
  }
}

startServer();