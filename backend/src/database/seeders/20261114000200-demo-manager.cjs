"use strict";

const bcrypt = require("bcryptjs");
const { randomUUID } = require("node:crypto");

module.exports = {
  async up(queryInterface) {
    const email = process.env.DEMO_MANAGER_EMAIL;
    const plainPassword = process.env.DEMO_MANAGER_PASSWORD;
    if (!email || !plainPassword) {
      throw new Error("Set DEMO_MANAGER_EMAIL and DEMO_MANAGER_PASSWORD before running the development seeder.");
    }
    const existing = await queryInterface.rawSelect("users", { where: { email } }, ["id"]);
    if (existing) return;
    const now = new Date();
    await queryInterface.bulkInsert("users", [{
      id: randomUUID(),
      name: "Demo Manager",
      email,
      password: await bcrypt.hash(plainPassword, 12),
      role: "MANAGER",
      token_version: 0,
      created_at: now,
      updated_at: now,
    }]);
  },
  async down(queryInterface) {
    const email = process.env.DEMO_MANAGER_EMAIL;
    if (email) await queryInterface.bulkDelete("users", { email });
  },
};
