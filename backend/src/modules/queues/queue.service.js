import AppError from "../../utils/AppError.js";
import sequelize from "../../config/database.js";
import QueueRepository from "./queue.repository.js";
import { toQueueOutput } from "./queue.mapper.js";

export default class QueueService {
  constructor(repository = new QueueRepository()) {
    this.repository = repository;
  }
  async list(managerId) {
    const queues = await this.repository.findAllOwned(managerId);
    const grouped = await this.repository.countTokens(queues.map(({ id }) => id));
    return queues.map((queue) => toQueueOutput(queue, grouped[queue.id]));
  }
  async get(queueId, managerId) {
    const queue = await this.requireQueue(queueId, managerId);
    const rows = await this.repository.countByStatus(queue.id);
    const counts = Object.fromEntries(rows.map(({ status, count }) => [status, count]));
    return toQueueOutput(queue, counts);
  }
  async create(managerId, input) {
    const queue = await this.repository.create({ ...input, managerId });
    return toQueueOutput(queue);
  }
  async update(queueId, managerId, input) {
    const queue = await this.requireQueue(queueId, managerId);
    await this.repository.update(queue, input);
    return toQueueOutput(queue);
  }
  async setStatus(queueId, managerId, status) {
    return sequelize.transaction(async (transaction) => {
      const queue = await this.requireQueue(queueId, managerId, { transaction, lock: transaction.LOCK.UPDATE });
      await this.repository.update(queue, { status }, { transaction });
      return toQueueOutput(queue);
    });
  }
  async remove(queueId, managerId) {
    await sequelize.transaction(async (transaction) => {
      const queue = await this.requireQueue(queueId, managerId, { transaction, lock: transaction.LOCK.UPDATE });
      if (await this.repository.countAnyTokens(queue.id, { transaction })) {
        throw new AppError(409, "This queue has token history and cannot be deleted. Deactivate it instead.");
      }
      await this.repository.destroy(queue, { transaction });
    });
  }
  async requireQueue(queueId, managerId, options = {}) {
    const queue = await this.repository.findOwned(queueId, managerId, options);
    if (!queue) throw new AppError(404, "Queue not found");
    return queue;
  }
}
