import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";

process.env.NODE_ENV = "production";
process.env.PORT = "4000";
process.env.DATABASE_URL = "postgresql://test:test@db.example.com/queue_manager?sslmode=verify-full";
process.env.JWT_SECRET = "production-test-secret-that-is-at-least-thirty-two-characters";
process.env.JWT_EXPIRES_IN = "12h";
process.env.FRONTEND_URL = "https://queuemanager-liart.vercel.app";

const [{ default: app }, { default: sequelize }] = await Promise.all([
  import("../src/app.js"),
  import("../src/config/database.js"),
]);

test("production health and CORS behavior", async (t) => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  }));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const productionOrigin = "https://queuemanager-liart.vercel.app";

  await t.test("health endpoint returns liveness with the allowed frontend origin", async () => {
    const response = await fetch(`${baseUrl}/api/v1/health`, {
      headers: { Origin: productionOrigin },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), productionOrigin);
    assert.equal(body.data.status, "healthy");
  });

  await t.test("preflight permits required methods and headers without cookies", async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "OPTIONS",
      headers: {
        Origin: productionOrigin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
      },
    });
    const methods = response.headers.get("access-control-allow-methods").split(",").map((method) => method.trim());
    const headers = response.headers.get("access-control-allow-headers").toLowerCase().split(",").map((header) => header.trim());

    assert.equal(response.status, 204);
    assert.ok(["GET", "POST", "PUT", "PATCH", "DELETE"].every((method) => methods.includes(method)));
    assert.ok(["authorization", "content-type"].every((header) => headers.includes(header)));
    assert.equal(response.headers.get("access-control-allow-credentials"), null);
  });

  await t.test("production rejects localhost and other unlisted origins", async () => {
    for (const origin of ["http://localhost:3000", "https://untrusted.example"]) {
      const response = await fetch(`${baseUrl}/api/v1/health`, { headers: { Origin: origin } });
      assert.equal(response.status, 403);
      assert.equal(response.headers.get("access-control-allow-origin"), null);
    }
  });

  await t.test("malformed JSON receives a client error response", async () => {
    const response = await fetch(`${baseUrl}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.success, false);
  });

  await t.test("readiness endpoint distinguishes database availability", async () => {
    const originalAuthenticate = sequelize.authenticate;
    try {
      sequelize.authenticate = async () => {};
      let response = await fetch(`${baseUrl}/api/v1/health/ready`);
      assert.equal(response.status, 200);
      assert.equal((await response.json()).data.database, "connected");

      sequelize.authenticate = async () => {
        const error = new Error("connection failed");
        error.code = "ECONNREFUSED";
        throw error;
      };
      response = await fetch(`${baseUrl}/api/v1/health/ready`);
      assert.equal(response.status, 503);
      assert.equal((await response.json()).data.database, "unavailable");
    } finally {
      sequelize.authenticate = originalAuthenticate;
    }
  });
});
