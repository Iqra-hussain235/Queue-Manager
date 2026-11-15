import { Router } from "express";
import controller from "./analytics.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { analyticsQuerySchema } from "./analytics.validator.js";

const router = Router();
router.use(authenticate, validate(analyticsQuerySchema, "query"));
router.get("/overview", asyncHandler(controller.dashboard));
router.get("/queue-length", asyncHandler(controller.dashboard));
router.get("/token-statistics", asyncHandler(controller.dashboard));
router.get("/waiting-time", asyncHandler(controller.dashboard));
router.get("/token-distribution", asyncHandler(controller.dashboard));
export default router;
