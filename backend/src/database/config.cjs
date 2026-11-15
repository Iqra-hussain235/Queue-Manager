const path = require("node:path");

require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

module.exports = {
  development: { use_env_variable: "DATABASE_URL", dialect: "postgres" },
  test: { use_env_variable: "DATABASE_URL", dialect: "postgres" },
  production: { use_env_variable: "DATABASE_URL", dialect: "postgres" },
};
