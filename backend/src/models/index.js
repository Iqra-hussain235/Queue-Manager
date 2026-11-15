import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

export const User = sequelize.define("User", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(254), allowNull: false, unique: true, validate: { isEmail: true } },
  password: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM("MANAGER"), allowNull: false, defaultValue: "MANAGER" },
  tokenVersion: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: "token_version" },
});

export const Queue = sequelize.define("Queue", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  name: { type: DataTypes.STRING(120), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  managerId: { type: DataTypes.UUID, allowNull: false, field: "manager_id" },
  status: { type: DataTypes.ENUM("ACTIVE", "INACTIVE"), allowNull: false, defaultValue: "ACTIVE" },
});

export const Token = sequelize.define("Token", {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  tokenNumber: { type: DataTypes.STRING(32), allowNull: false, field: "token_number" },
  personName: { type: DataTypes.STRING(120), allowNull: false, field: "person_name" },
  personContact: { type: DataTypes.STRING(40), allowNull: true, field: "person_contact" },
  queueId: { type: DataTypes.UUID, allowNull: false, field: "queue_id" },
  position: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
  status: {
    type: DataTypes.ENUM("WAITING", "CALLED", "SERVING", "COMPLETED", "CANCELLED"),
    allowNull: false,
    defaultValue: "WAITING",
  },
  calledAt: { type: DataTypes.DATE, allowNull: true, field: "called_at" },
  serviceStartedAt: { type: DataTypes.DATE, allowNull: true, field: "service_started_at" },
  completedAt: { type: DataTypes.DATE, allowNull: true, field: "completed_at" },
  cancelledAt: { type: DataTypes.DATE, allowNull: true, field: "cancelled_at" },
});

User.hasMany(Queue, { as: "queues", foreignKey: "managerId", onDelete: "CASCADE" });
Queue.belongsTo(User, { as: "manager", foreignKey: "managerId" });
Queue.hasMany(Token, { as: "tokens", foreignKey: "queueId", onDelete: "RESTRICT" });
Token.belongsTo(Queue, { as: "queue", foreignKey: "queueId" });

export { sequelize };
