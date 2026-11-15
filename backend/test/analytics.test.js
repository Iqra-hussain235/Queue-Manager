import test from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ||= "postgres://postgres:postgres@localhost:5432/queue_manager_test";
process.env.JWT_SECRET ||= "unit-test-secret-that-is-at-least-thirty-two-characters";
process.env.NODE_ENV ||= "test";

const { default: AnalyticsService } = await import("../src/modules/analytics/analytics.service.js");

test("analytics aggregates actual timestamps and ignores missing durations", async () => {
  const queue = { id: "queue-1", name: "Front desk" };
  const tokens = [
    {
      id: "1", queueId: "queue-1", status: "COMPLETED",
      createdAt: "2026-11-14T10:00:00.000Z",
      calledAt: "2026-11-14T10:05:00.000Z",
      serviceStartedAt: "2026-11-14T10:06:00.000Z",
      completedAt: "2026-11-14T10:16:00.000Z",
      cancelledAt: null,
    },
    {
      id: "2", queueId: "queue-1", status: "WAITING",
      createdAt: "2026-11-14T10:10:00.000Z",
      calledAt: null, serviceStartedAt: null, completedAt: null, cancelledAt: null,
    },
    {
      id: "3", queueId: "queue-1", status: "CANCELLED",
      createdAt: "2026-11-14T10:12:00.000Z",
      calledAt: null, serviceStartedAt: null, completedAt: null,
      cancelledAt: "2026-11-14T10:13:00.000Z",
    },
  ];
  const repository = {
    getQueues: async () => [queue],
    getTokens: async () => tokens,
    getAllTokens: async () => tokens,
  };
  const result = await new AnalyticsService(repository).getDashboard("manager-1", {});

  assert.equal(result.overview.totalQueues, 1);
  assert.equal(result.overview.averageWaitingTimeSeconds, 300);
  assert.equal(result.overview.averageServiceTimeSeconds, 600);
  assert.equal(result.overview.completedTokens, 1);
  assert.equal(result.overview.cancelledTokens, 1);
  assert.equal(result.waitingTime[0].sampleSize, 1);
  assert.deepEqual(result.tokenDistribution.map(({ status, count }) => [status, count]), [
    ["WAITING", 1], ["CALLED", 0], ["SERVING", 0], ["COMPLETED", 1], ["CANCELLED", 1],
  ]);
});

test("analytics returns zeros for empty data", async () => {
  const repository = {
    getQueues: async () => [],
    getTokens: async () => [],
    getAllTokens: async () => [],
  };
  const result = await new AnalyticsService(repository).getDashboard("manager-1", {});
  assert.equal(result.overview.averageWaitingTimeSeconds, 0);
  assert.equal(result.overview.averageServiceTimeSeconds, 0);
  assert.equal(result.overview.totalTokensToday, 0);
  assert.deepEqual(result.tokenStatistics, []);
});
