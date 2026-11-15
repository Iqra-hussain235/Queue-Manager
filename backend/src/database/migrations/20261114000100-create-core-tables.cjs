"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(100), allowNull: false },
      email: { type: Sequelize.STRING(254), allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.ENUM("MANAGER"), allowNull: false, defaultValue: "MANAGER" },
      token_version: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable("queues", {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING(120), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      manager_id: {
        type: Sequelize.UUID, allowNull: false, references: { model: "users", key: "id" }, onUpdate: "CASCADE", onDelete: "CASCADE",
      },
      status: { type: Sequelize.ENUM("ACTIVE", "INACTIVE"), allowNull: false, defaultValue: "ACTIVE" },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.createTable("tokens", {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      token_number: { type: Sequelize.STRING(32), allowNull: false },
      person_name: { type: Sequelize.STRING(120), allowNull: false },
      person_contact: { type: Sequelize.STRING(40), allowNull: true },
      queue_id: {
        type: Sequelize.UUID, allowNull: false, references: { model: "queues", key: "id" }, onUpdate: "CASCADE", onDelete: "RESTRICT",
      },
      position: { type: Sequelize.INTEGER, allowNull: false },
      status: { type: Sequelize.ENUM("WAITING", "CALLED", "SERVING", "COMPLETED", "CANCELLED"), allowNull: false, defaultValue: "WAITING" },
      called_at: { type: Sequelize.DATE, allowNull: true },
      service_started_at: { type: Sequelize.DATE, allowNull: true },
      completed_at: { type: Sequelize.DATE, allowNull: true },
      cancelled_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });
    await queryInterface.addIndex("queues", ["manager_id", "status"]);
    await queryInterface.addIndex("tokens", ["queue_id", "token_number"], { unique: true });
    await queryInterface.addIndex("tokens", ["queue_id", "status", "position"]);
    await queryInterface.addIndex("tokens", ["created_at"]);
  },
  async down(queryInterface) {
    await queryInterface.dropTable("tokens");
    await queryInterface.dropTable("queues");
    await queryInterface.dropTable("users");
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_tokens_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_queues_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  },
};
