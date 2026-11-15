import TokenService from "./token.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";

const service = new TokenService();
export default {
  create: async (req, res) => res.status(201).json({
    success: true,
    message: "Token created successfully",
    data: await service.create(req.params.queueId, req.user.id, req.body),
    meta: {},
  }),
  list: async (req, res) => {
    const result = await service.list(req.params.queueId, req.user.id, req.validatedQuery);
    return sendSuccess(res, "Tokens loaded successfully", result.items, result.meta);
  },
  get: async (req, res) => sendSuccess(res, "Token loaded successfully", await service.get(req.params.tokenId, req.user.id)),
  move: async (req, res) => sendSuccess(res, "Token position updated successfully", await service.move(req.params.tokenId, req.user.id, req.body.direction)),
  callNext: async (req, res) => sendSuccess(res, "Next token called successfully", await service.callNext(req.params.queueId, req.user.id)),
  start: async (req, res) => sendSuccess(res, "Service started successfully", await service.transition(req.params.tokenId, req.user.id, "start")),
  complete: async (req, res) => sendSuccess(res, "Token completed successfully", await service.transition(req.params.tokenId, req.user.id, "complete")),
  cancel: async (req, res) => sendSuccess(res, "Token cancelled successfully", await service.transition(req.params.tokenId, req.user.id, "cancel")),
};
