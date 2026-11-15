import express from "express";
import cors from "cors";
import helmet from "helmet";
import env from "./config/environment.js";
import sequelize from "./config/database.js";
import authRoutes from "./modules/auth/auth.routes.js";
import queueRoutes from "./modules/queues/queue.routes.js";
import tokenRoutes from "./modules/tokens/token.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";
import AppError from "./utils/AppError.js";

const app = express();
const allowedOrigins = new Set([env.frontendUrl]);
if (env.nodeEnv === "development") allowedOrigins.add("http://localhost:3000");

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new AppError(403, "Origin is not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: "1mb" }));
app.get("/api/v1/health", (req, res) => res.json({ success: true, message: "OK", data: { status: "healthy" }, meta: {} }));
app.get("/api/v1/health/ready", async (req, res) => {
  try {
    await sequelize.authenticate();
    return res.json({ success: true, message: "Ready", data: { status: "ready", database: "connected" }, meta: {} });
  } catch (error) {
    console.error("Database readiness check failed", {
      name: error.name,
      code: error.original?.code || error.parent?.code || error.code,
    });
    return res.status(503).json({
      success: false,
      message: "Service unavailable",
      data: { status: "not_ready", database: "unavailable" },
      meta: {},
    });
  }
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/queues", queueRoutes);
app.use("/api/v1", tokenRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
