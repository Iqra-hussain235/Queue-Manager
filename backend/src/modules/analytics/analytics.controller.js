import AnalyticsService from "./analytics.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";

const service = new AnalyticsService();
export default {
  dashboard: async (req, res) => sendSuccess(res, "Analytics loaded successfully", await service.getDashboard(req.user.id, req.validatedQuery)),
};
