import QueueService from "./queue.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";

const service = new QueueService();
export default {
  list: async (req, res) => sendSuccess(res, "Queues loaded successfully", await service.list(req.user.id)),
  get: async (req, res) => sendSuccess(res, "Queue loaded successfully", await service.get(req.params.queueId, req.user.id)),
  create: async (req, res) => res.status(201).json({
    success: true, message: "Queue created successfully", data: await service.create(req.user.id, req.body), meta: {},
  }),
  update: async (req, res) => sendSuccess(res, "Queue updated successfully", await service.update(req.params.queueId, req.user.id, req.body)),
  setStatus: async (req, res) => sendSuccess(res, "Queue status updated successfully", await service.setStatus(req.params.queueId, req.user.id, req.body.status)),
  remove: async (req, res) => {
    await service.remove(req.params.queueId, req.user.id);
    return sendSuccess(res, "Queue deleted successfully");
  },
};
