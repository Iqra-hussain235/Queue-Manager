import { Op } from "sequelize";
import { Queue, Token } from "../../models/index.js";

export default class TokenRepository {
  findQueue(queueId, managerId, options = {}) {
    return Queue.findOne({ where: { id: queueId, managerId }, ...options });
  }
  findToken(tokenId, managerId, options = {}) {
    return Token.findOne({
      where: { id: tokenId },
      include: [{ model: Queue, as: "queue", where: { managerId }, attributes: [] }],
      ...options,
    });
  }
  create(values, options) {
    return Token.create(values, options);
  }
  getMaxTokenNumber(queueId, transaction) {
    return Token.count({ where: { queueId }, transaction });
  }
  list(queueId, options) {
    return Token.findAndCountAll({
      where: options.where,
      order: options.order,
      limit: options.limit,
      offset: options.offset,
    });
  }
  waitingTokens(queueId, transaction, lock = false) {
    return Token.findAll({
      where: { queueId, status: "WAITING" },
      order: [["position", "ASC"], ["createdAt", "ASC"]],
      transaction,
      ...(lock ? { lock: transaction.LOCK.UPDATE } : {}),
    });
  }
  activeTokens(queueId, transaction) {
    return Token.findOne({
      where: { queueId, status: { [Op.in]: ["CALLED", "SERVING"] } },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }
  updateToken(token, values, transaction) {
    return token.update(values, { transaction });
  }
  updateWaitingPositions(tokens, transaction) {
    return Promise.all(tokens.map((token, index) => token.update({ position: index + 1 }, { transaction })));
  }
}
