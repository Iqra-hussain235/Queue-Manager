import env from "../config/environment.js";

export function notFound(req, res) {
  return res.status(404).json({ success: false, message: "Route not found", data: null, meta: {} });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.status || (error.name === "SequelizeUniqueConstraintError" ? 409 : 500);
  const message = status === 500 && env.nodeEnv === "production" ? "Internal server error" : error.message;
  if (status >= 500) console.error(error);
  return res.status(status).json({
    success: false,
    message,
    data: null,
    meta: error.details ? { details: error.details } : {},
  });
}
