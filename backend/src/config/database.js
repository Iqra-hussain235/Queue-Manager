import { Sequelize } from "sequelize";
import env from "./environment.js";

// Keep TLS settings in DATABASE_URL so the app and Sequelize CLI use the same connection policy.
const sequelize = new Sequelize(env.databaseUrl, {
  dialect: "postgres",
  logging: false,
  define: { underscored: true, timestamps: true },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});

export default sequelize;
