
const path = require("node:path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env"),
});

const databaseConfig = {
  use_env_variable: "DATABASE_URL",
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: true,
    },
  },
};

module.exports = {
  development: databaseConfig,
  test: databaseConfig,
  production: databaseConfig,
};
