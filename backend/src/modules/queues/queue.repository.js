import { Op, fn, col } from "sequelize";
import { Queue, Token } from "../../models/index.js";

export default class QueueRepository {
  findOwned(queueId, managerId, options = {}) {
    return Queue.findOne({ where: { id: queueId, managerId }, ...options });
  }
  findAllOwned(managerId) {
    return Queue.findAll({ where: { managerId }, order: [["createdAt", "DESC"]] });
  }
  create(values) {
    return Queue.create(values);
  }
  update(queue, values, options = {}) {
    return queue.update(values, options);
  }
  async countTokens(queueIds) {
    if (!queueIds.length) return {};
    const records = await Token.findAll({
      attributes: ["queueId", "status", [fn("COUNT", col("id")), "count"]],
      where: { queueId: { [Op.in]: queueIds } },
      group: ["queueId", "status"],
      raw: true,
    });
    return records.reduce((result, record) => {
      result[record.queueId] ??= {};
      result[record.queueId][record.status] = Number(record.count);
      return result;
    }, {});
  }
  countByStatus(queueId) {
    return Token.findAll({
      attributes: ["status", [fn("COUNT", col("id")), "count"]],
      where: { queueId },
      group: ["status"],
      raw: true,
    });
  }
  countAnyTokens(queueId, options = {}) {
    return Token.count({ where: { queueId }, ...options });
  }
  destroy(queue, options = {}) {
    return queue.destroy(options);
  }
}
