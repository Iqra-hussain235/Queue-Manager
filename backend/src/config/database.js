import { Sequelize } from "sequelize";
import env from "./environment.js";

const sequelize = new Sequelize(env.databaseUrl, {
  dialect: "postgres",
  logging: env.nodeEnv === "development" ? false : false,
  define: { underscored: true, timestamps: true },
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
});

export default sequelize;
