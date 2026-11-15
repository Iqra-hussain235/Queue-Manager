import app from "./app.js";
import sequelize from "./config/database.js";
import env from "./config/environment.js";

try {
  await sequelize.authenticate();
  app.listen(env.port, () => console.log(`Queue Manager API listening on port ${env.port}`));
} catch (error) {
  console.error("Unable to start the API because the database connection failed:", error);
  process.exitCode = 1;
}
