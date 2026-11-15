import AnalyticsRepository from "./analytics.repository.js";

const DAY = 24 * 60 * 60 * 1000;
const average = (values) => values.length
  ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
  : 0;
const duration = (start, end) => start && end
  ? Math.max(0, Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 1000))
  : null;
const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

export default class AnalyticsService {
  constructor(repository = new AnalyticsRepository()) {
    this.repository = repository;
  }
  async getDashboard(managerId, filters = {}) {
    const [queues, filtered, all] = await Promise.all([
      this.repository.getQueues(managerId),
      this.repository.getTokens(managerId, filters),
      this.repository.getAllTokens(managerId),
    ]);
    const stats = Object.fromEntries(["WAITING", "CALLED", "SERVING", "COMPLETED", "CANCELLED"].map((key) => [key, 0]));
    for (const token of all) stats[token.status] = (stats[token.status] || 0) + 1;
    const waitingTimes = all
      .filter((token) => this.inRange(token.calledAt, filters))
      .map((token) => duration(token.createdAt, token.calledAt))
      .filter((value) => value !== null);
    const serviceTimes = all
      .filter((token) => token.status === "COMPLETED" && this.inRange(token.completedAt, filters))
      .map((token) => duration(token.serviceStartedAt, token.completedAt))
      .filter((value) => value !== null);
    const today = dayKey(new Date());
    const todayCount = all.filter((token) => dayKey(token.createdAt) === today).length;

    return {
      overview: {
        totalQueues: queues.length,
        totalTokensToday: todayCount,
        currentlyWaiting: stats.WAITING,
        currentlyCalled: stats.CALLED,
        currentlyServing: stats.SERVING,
        completedTokens: all.filter((token) => this.inRange(token.completedAt, filters)).length,
        cancelledTokens: all.filter((token) => this.inRange(token.cancelledAt, filters)).length,
        averageWaitingTimeSeconds: average(waitingTimes),
        averageServiceTimeSeconds: average(serviceTimes),
      },
      queueLength: this.queueLengthTrend(all, filters),
      tokenStatistics: this.dailyStatistics(all, filters),
      waitingTime: this.waitingTimeByQueue(all, queues, filters),
      tokenDistribution: Object.entries(stats).map(([status, value]) => ({ status, count: value })),
    };
  }

  queueLengthTrend(tokens, filters) {
    const end = filters.to ? new Date(filters.to) : new Date();
    const start = filters.from ? new Date(filters.from) : new Date(end.getTime() - 6 * DAY);
    const boundedDays = Math.min(90, Math.max(1, Math.ceil((end - start) / DAY) + 1));
    const rows = [];
    for (let i = 0; i < boundedDays; i += 1) {
      const date = new Date(start.getTime() + i * DAY);
      const cutoff = new Date(date.getTime() + DAY);
      const count = tokens.filter((token) => {
        const created = new Date(token.createdAt);
        const ended = token.cancelledAt || token.completedAt;
        return created < cutoff && (!ended || new Date(ended) >= cutoff);
      }).length;
      rows.push({ date: dayKey(date), queueLength: count });
    }
    return rows;
  }

  inRange(value, filters) {
    if (!value) return false;
    const time = new Date(value).getTime();
    return (!filters.from || time >= new Date(filters.from).getTime())
      && (!filters.to || time <= new Date(filters.to).getTime());
  }

  dailyStatistics(tokens, filters) {
    const grouped = new Map();
    for (const token of tokens) {
      for (const [field, key] of [["createdAt", "created"], ["completedAt", "completed"], ["cancelledAt", "cancelled"]]) {
        const occurredAt = token[field];
        if (!this.inRange(occurredAt, filters)) continue;
        const date = dayKey(occurredAt);
        if (!grouped.has(date)) grouped.set(date, { date, created: 0, completed: 0, cancelled: 0 });
        grouped.get(date)[key] += 1;
      }
    }
    return [...grouped.values()];
  }

  waitingTimeByQueue(tokens, queues, filters) {
    return queues.map((queue) => {
      const times = tokens
        .filter((token) => token.queueId === queue.id && this.inRange(token.calledAt, filters))
        .map((token) => duration(token.createdAt, token.calledAt))
        .filter((value) => value !== null);
      return { queueId: queue.id, queueName: queue.name, averageWaitingTimeSeconds: average(times), sampleSize: times.length };
    });
  }
}
