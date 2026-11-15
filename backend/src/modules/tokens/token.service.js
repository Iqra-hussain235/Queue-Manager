import { Op } from "sequelize";
import sequelize from "../../config/database.js";
import AppError from "../../utils/AppError.js";
import TokenRepository from "./token.repository.js";
import { toTokenOutput } from "./token.mapper.js";

export default class TokenService {
  constructor(repository = new TokenRepository()) {
    this.repository = repository;
  }

  async create(queueId, managerId, input) {
    const token = await sequelize.transaction(async (transaction) => {
      const queue = await this.requireQueue(queueId, managerId, { transaction, lock: transaction.LOCK.UPDATE });
      if (queue.status !== "ACTIVE") throw new AppError(409, "Cannot add a person to an inactive queue");
      const max = await this.repositoryMaxTokenNumber(queue.id, transaction);
      const waiting = await this.repository.waitingTokens(queue.id, transaction, true);
      return this.repository.create({
        ...input,
        queueId: queue.id,
        tokenNumber: `Q${String(max + 1).padStart(3, "0")}`,
        position: waiting.length + 1,
        status: "WAITING",
      }, { transaction });
    });
    return toTokenOutput(token);
  }

  async list(queueId, managerId, query) {
    await this.requireQueue(queueId, managerId);
    const where = { queueId };
    if (query.status) where.status = query.status;
    if (query.search) where.personName = { [Op.iLike]: `%${query.search}%` };
    const result = await this.repository.list(queueId, {
      where,
      order: [[query.sort, query.order], ["createdAt", "ASC"]],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    });
    return {
      items: result.rows.map(toTokenOutput),
      meta: { page: query.page, limit: query.limit, total: result.count, pages: Math.ceil(result.count / query.limit) },
    };
  }

  async get(tokenId, managerId) {
    const token = await this.repository.findToken(tokenId, managerId);
    if (!token) throw new AppError(404, "Token not found");
    return toTokenOutput(token);
  }

  async move(tokenId, managerId, direction) {
    const result = await sequelize.transaction(async (transaction) => {
      const initial = await this.requireToken(tokenId, managerId, { transaction });
      await this.requireQueue(initial.queueId, managerId, { transaction, lock: transaction.LOCK.UPDATE });
      const token = await this.requireToken(tokenId, managerId, { transaction, lock: transaction.LOCK.UPDATE });
      if (token.status !== "WAITING") throw new AppError(409, "Only waiting tokens can be reordered");
      const tokens = await this.repository.waitingTokens(token.queueId, transaction, true);
      const index = tokens.findIndex(({ id }) => id === token.id);
      const target = direction === "up" ? index - 1 : index + 1;
      if (target < 0 || target >= tokens.length) return token;
      [tokens[index], tokens[target]] = [tokens[target], tokens[index]];
      await this.repository.updateWaitingPositions(tokens, transaction);
      token.position = target + 1;
      return token;
    });
    return toTokenOutput(result);
  }

  async callNext(queueId, managerId) {
    const token = await sequelize.transaction(async (transaction) => {
      const queue = await this.requireQueue(queueId, managerId, { transaction, lock: transaction.LOCK.UPDATE });
      if (queue.status !== "ACTIVE") throw new AppError(409, "Cannot call a person from an inactive queue");
      if (await this.repository.activeTokens(queue.id, transaction)) {
        throw new AppError(409, "Finish or complete the currently called token before calling the next person");
      }
      const waiting = await this.repository.waitingTokens(queue.id, transaction, true);
      if (!waiting.length) throw new AppError(404, "There are no waiting tokens");
      const next = waiting[0];
      await this.repository.updateToken(next, { status: "CALLED", calledAt: new Date() }, transaction);
      await this.repository.updateWaitingPositions(waiting.slice(1), transaction);
      return next;
    });
    return toTokenOutput(token);
  }

  async transition(tokenId, managerId, action) {
    const token = await sequelize.transaction(async (transaction) => {
      const initial = await this.requireToken(tokenId, managerId, { transaction });
      await this.requireQueue(initial.queueId, managerId, { transaction, lock: transaction.LOCK.UPDATE });
      const current = await this.requireToken(tokenId, managerId, { transaction, lock: transaction.LOCK.UPDATE });
      const now = new Date();
      const changes = {
        start: { from: "CALLED", to: "SERVING", field: "serviceStartedAt" },
        complete: { from: "SERVING", to: "COMPLETED", field: "completedAt" },
        cancel: { from: ["WAITING", "CALLED", "SERVING"], to: "CANCELLED", field: "cancelledAt" },
      }[action];
      const allowed = Array.isArray(changes.from) ? changes.from.includes(current.status) : current.status === changes.from;
      if (!allowed) throw new AppError(409, `Cannot ${action} a token with status ${current.status}`);
      await this.repository.updateToken(current, { status: changes.to, [changes.field]: now }, transaction);
      if (current.status === "WAITING") {
        const waiting = await this.repository.waitingTokens(current.queueId, transaction, true);
        await this.repository.updateWaitingPositions(waiting.filter(({ id }) => id !== current.id), transaction);
      }
      return current;
    });
    return toTokenOutput(token);
  }

  async requireQueue(queueId, managerId, options) {
    const queue = await this.repository.findQueue(queueId, managerId, options);
    if (!queue) throw new AppError(404, "Queue not found");
    return queue;
  }
  async requireToken(tokenId, managerId, options) {
    const token = await this.repository.findToken(tokenId, managerId, options);
    if (!token) throw new AppError(404, "Token not found");
    return token;
  }
  repositoryMaxTokenNumber(queueId, transaction) {
    return this.repository.getMaxTokenNumber(queueId, transaction);
  }
}
