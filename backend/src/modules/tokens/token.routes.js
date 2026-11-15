import { Router } from "express";
import controller from "./token.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { validate } from "../../middlewares/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import {
  createTokenSchema, listTokensSchema, moveTokenSchema, queueParamsSchema, tokenParamsSchema,
} from "./token.validator.js";

const router = Router();
router.use(authenticate);
router.get("/queues/:queueId/tokens", validate(queueParamsSchema, "params"), validate(listTokensSchema, "query"), asyncHandler(controller.list));
router.post("/queues/:queueId/tokens", validate(queueParamsSchema, "params"), validate(createTokenSchema), asyncHandler(controller.create));
router.post("/queues/:queueId/call-next", validate(queueParamsSchema, "params"), asyncHandler(controller.callNext));
router.get("/tokens/:tokenId", validate(tokenParamsSchema, "params"), asyncHandler(controller.get));
router.patch("/tokens/:tokenId/move", validate(tokenParamsSchema, "params"), validate(moveTokenSchema), asyncHandler(controller.move));
router.patch("/tokens/:tokenId/start-service", validate(tokenParamsSchema, "params"), asyncHandler(controller.start));
router.patch("/tokens/:tokenId/complete", validate(tokenParamsSchema, "params"), asyncHandler(controller.complete));
router.patch("/tokens/:tokenId/cancel", validate(tokenParamsSchema, "params"), asyncHandler(controller.cancel));
export default router;
