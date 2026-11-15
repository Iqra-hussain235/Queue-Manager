import express from "express";
import cors from "cors";
import helmet from "helmet";
import env from "./config/environment.js";
import authRoutes from "./modules/auth/auth.routes.js";
import queueRoutes from "./modules/queues/queue.routes.js";
import tokenRoutes from "./modules/tokens/token.routes.js";
import analyticsRoutes from "./modules/analytics/analytics.routes.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: env.frontendUrl }));
app.use(express.json({ limit: "1mb" }));
app.get("/api/v1/health", (req, res) => res.json({ success: true, message: "OK", data: { status: "healthy" }, meta: {} }));
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/queues", queueRoutes);
app.use("/api/v1", tokenRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use(notFound);
app.use(errorHandler);

export default app;
