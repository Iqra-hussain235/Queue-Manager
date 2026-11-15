import dotenv from "dotenv";
import Joi from "joi";

dotenv.config();

const schema = Joi.object({
  NODE_ENV: Joi.string().valid("development", "test", "production").default("development"),
  PORT: Joi.number().port().default(4000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default("12h"),
  FRONTEND_URL: Joi.string().uri().default("http://localhost:3000"),
}).unknown(true);

const { value, error } = schema.validate(process.env, { convert: true });
if (error) throw new Error(`Invalid environment configuration: ${error.message}`);

export default Object.freeze({
  nodeEnv: value.NODE_ENV,
  port: value.PORT,
  databaseUrl: value.DATABASE_URL,
  jwtSecret: value.JWT_SECRET,
  jwtExpiresIn: value.JWT_EXPIRES_IN,
  frontendUrl: value.FRONTEND_URL,
});
