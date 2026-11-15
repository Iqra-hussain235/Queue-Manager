import test from "node:test";
import assert from "node:assert/strict";

process.env.DATABASE_URL ||= "postgres://postgres:postgres@localhost:5432/queue_manager_test";
process.env.JWT_SECRET ||= "unit-test-secret-that-is-at-least-thirty-two-characters";

const [{ default: TokenService }, { default: sequelize }] = await Promise.all([
  import("../src/modules/tokens/token.service.js"),
  import("../src/config/database.js"),
]);

test("token flow numbers, reorders, calls, starts, completes, and cancels safely", async (t) => {
  const queue = { id: "queue-1", managerId: "manager-1", status: "ACTIVE" };
  const tokens = [];
  let nextId = 0;
  const repository = {
    findQueue: async (id, managerId) => id === queue.id && managerId === queue.managerId ? queue : null,
    findToken: async (id, managerId) => tokens.find((token) => token.id === id && managerId === queue.managerId) || null,
    getMaxTokenNumber: async () => tokens.length,
    waitingTokens: async (queueId) => tokens.filter((token) => token.queueId === queueId && token.status === "WAITING")
      .sort((a, b) => a.position - b.position),
    activeTokens: async (queueId) => tokens.find((token) => token.queueId === queueId && ["CALLED", "SERVING"].includes(token.status)) || null,
    create: async (values) => {
      const token = { id: `token-${++nextId}`, ...values, createdAt: new Date(), calledAt: null, serviceStartedAt: null, completedAt: null, cancelledAt: null };
      tokens.push(token);
      return token;
    },
    updateToken: async (token, values) => Object.assign(token, values),
    updateWaitingPositions: async (waiting) => Promise.all(waiting.map((token, index) => Object.assign(token, { position: index + 1 }))),
  };
  const originalTransaction = sequelize.transaction;
  sequelize.transaction = async (callback) => callback({ LOCK: { UPDATE: "UPDATE" } });
  t.after(() => { sequelize.transaction = originalTransaction; });
  const service = new TokenService(repository);

  const first = await service.create(queue.id, queue.managerId, { personName: "Ada" });
  const second = await service.create(queue.id, queue.managerId, { personName: "Grace" });
  const third = await service.create(queue.id, queue.managerId, { personName: "Lin" });
  assert.deepEqual([first.tokenNumber, second.tokenNumber, third.tokenNumber], ["Q001", "Q002", "Q003"]);

  await service.move(first.id, queue.managerId, "down");
  assert.deepEqual(tokens.filter((token) => token.status === "WAITING")
    .sort((a, b) => a.position - b.position)
    .map((token) => [token.personName, token.position]), [
    ["Grace", 1], ["Ada", 2], ["Lin", 3],
  ]);
  const called = await service.callNext(queue.id, queue.managerId);
  assert.equal(called.personName, "Grace");
  await assert.rejects(service.callNext(queue.id, queue.managerId), /currently called token/);
  await service.transition(called.id, queue.managerId, "start");
  await service.transition(called.id, queue.managerId, "complete");
  await assert.rejects(service.transition(called.id, queue.managerId, "cancel"), /Cannot cancel/);

  await service.transition(third.id, queue.managerId, "cancel");
  assert.equal(tokens.find((token) => token.id === third.id).status, "CANCELLED");
  assert.equal(tokens.find((token) => token.id === first.id).position, 1);
  await assert.rejects(service.get(first.id, "another-manager"), /Token not found/);
});
