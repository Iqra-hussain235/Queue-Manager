import { Op } from "sequelize";
import { Queue, Token } from "../../models/index.js";

export default class AnalyticsRepository {
  getQueues(managerId) {
    return Queue.findAll({
      where: { managerId },
      attributes: ["id", "name"],
      order: [["name", "ASC"]],
    });
  }
  getTokens(managerId, filters = {}) {
    const where = {};
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt[Op.gte] = filters.from;
      if (filters.to) where.createdAt[Op.lte] = filters.to;
    }
    return Token.findAll({
      where,
      include: [{ model: Queue, as: "queue", where: { managerId }, attributes: ["id", "name"] }],
      order: [["createdAt", "ASC"]],
    });
  }
  getAllTokens(managerId) {
    return Token.findAll({
      include: [{ model: Queue, as: "queue", where: { managerId }, attributes: ["id", "name"] }],
    });
  }
}
