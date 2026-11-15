import app from "./app.js";
import sequelize from "./config/database.js";
import env from "./config/environment.js";

try {
  await sequelize.authenticate();
  await new Promise((resolve, reject) => {
    const server = app.listen(env.port, "0.0.0.0", () => {
      console.log(`Queue Manager API listening on port ${env.port}`);
      resolve(server);
    });
    server.once("error", reject);
  });
} catch (error) {
  const cause = error.original || error.parent || error;
  console.error("Unable to start the API", {
    name: error.name,
    code: cause.code,
    stack: error.stack?.split("\n").slice(1).join("\n"),
    ...(env.nodeEnv !== "production" ? { message: error.message } : {}),
  });
  process.exitCode = 1;
}
