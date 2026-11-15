import env from "../config/environment.js";

export function notFound(req, res) {
  return res.status(404).json({ success: false, message: "Route not found", data: null, meta: {} });
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.status || error.statusCode
    || (error.type === "entity.parse.failed" ? 400 : 0)
    || (error.name === "SequelizeUniqueConstraintError" ? 409 : 500);
  const isProductionServerError = status >= 500 && env.nodeEnv === "production";
  const cause = error.original || error.parent || error;
  if (status >= 500) {
    console.error("API request failed", {
      name: error.name,
      code: cause.code,
      method: req.method,
      path: req.path,
      stack: error.stack?.split("\n").slice(1).join("\n"),
      ...(env.nodeEnv !== "production"
        ? { message: error.message, sql: error.sql, parameters: error.parameters }
        : {}),
    });
  }
  const message = isProductionServerError ? "Internal server error" : error.message;
  return res.status(status).json({
    success: false,
    message,
    data: null,
    meta: error.details && !isProductionServerError ? { details: error.details } : {},
  });
}
