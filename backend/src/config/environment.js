import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").required(),
  PORT: Joi.when("NODE_ENV", {
    is: "production",
    then: Joi.number().port().required(),
    otherwise: Joi.number().port().default(4000),
  }),
  DATABASE_URL: Joi.string().uri({ scheme: ["postgres", "postgresql"] }).required(),
  JWT_SECRET: Joi.when("NODE_ENV", {
    is: "production",
    then: Joi.string().min(32).invalid("replace-this-with-a-long-random-secret").required(),
    otherwise: Joi.string().min(32).required(),
  }),
  JWT_EXPIRES_IN: Joi.when("NODE_ENV", {
    is: "production",
    then: Joi.string().required(),
    otherwise: Joi.string().default("12h"),
  }),
  FRONTEND_URL: Joi.when("NODE_ENV", {
    is: "production",
    then: Joi.string().uri({ scheme: ["https"] }).required(),
    otherwise: Joi.string().uri({ scheme: ["http", "https"] }).default("http://localhost:3000"),
  }),
}).unknown(true);

const { value, error } = schema.validate(process.env, { convert: true });
if (error) throw new Error(`Invalid environment configuration: ${error.message}`);

if (value.NODE_ENV === "production") {
  const databaseUrl = new URL(value.DATABASE_URL);
  if (["localhost", "127.0.0.1", "::1"].includes(databaseUrl.hostname)) {
    throw new Error("Invalid environment configuration: DATABASE_URL must use a remote database in production");
  }
  if (databaseUrl.searchParams.get("sslmode") !== "verify-full") {
    throw new Error("Invalid environment configuration: production DATABASE_URL must include sslmode=verify-full");
  }
  const frontendUrl = new URL(value.FRONTEND_URL);
  if (["localhost", "127.0.0.1", "::1"].includes(frontendUrl.hostname)) {
    throw new Error("Invalid environment configuration: FRONTEND_URL must use the deployed frontend in production");
  }
}

export default Object.freeze({
  nodeEnv: value.NODE_ENV,
  port: value.PORT,
  databaseUrl: value.DATABASE_URL,
  jwtSecret: value.JWT_SECRET,
  jwtExpiresIn: value.JWT_EXPIRES_IN,
  frontendUrl: new URL(value.FRONTEND_URL).origin,
});
