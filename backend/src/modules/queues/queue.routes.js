import { Router } from "express";
import controller from "./queue.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { createQueueSchema, queueParamsSchema, queueStatusSchema, updateQueueSchema } from "./queue.validator.js";

const router = Router();
router.use(authenticate);
router.get("/", asyncHandler(controller.list));
router.post("/", validate(createQueueSchema), asyncHandler(controller.create));
router.get("/:queueId", validate(queueParamsSchema, "params"), asyncHandler(controller.get));
router.put("/:queueId", validate(queueParamsSchema, "params"), validate(updateQueueSchema), asyncHandler(controller.update));
router.patch("/:queueId/status", validate(queueParamsSchema, "params"), validate(queueStatusSchema), asyncHandler(controller.setStatus));
router.delete("/:queueId", validate(queueParamsSchema, "params"), asyncHandler(controller.remove));
export default router;
