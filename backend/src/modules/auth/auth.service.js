import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sequelize from "../../config/database.js";
import env from "../../config/environment.js";
import AppError from "../../utils/AppError.js";
import AuthRepository from "./auth.repository.js";
import { toUserOutput } from "./auth.mapper.js";

export default class AuthService {
  constructor(repository = new AuthRepository()) {
    this.repository = repository;
  }

  issue(user) {
    const accessToken = jwt.sign(
      { version: user.tokenVersion },
      env.jwtSecret,
      { subject: user.id, expiresIn: env.jwtExpiresIn },
    );
    return { accessToken, user: toUserOutput(user) };
  }

  async register(input) {
    const existing = await this.repository.findByEmail(input.email);
    if (existing) throw new AppError(409, "An account with this email already exists");
    const password = await bcrypt.hash(input.password, 12);
    const user = await this.repository.create({ ...input, password, role: "MANAGER" });
    return this.issue(user);
  }

  async login(input) {
    const user = await this.repository.findByEmail(input.email);
    if (!user || !(await bcrypt.compare(input.password, user.password))) {
      throw new AppError(401, "Email or password is incorrect");
    }
    return this.issue(user);
  }

  async logout(user) {
    await sequelize.transaction(async (transaction) => this.repository.revokeSessions(user, transaction));
  }

  async updateProfile(user, input) {
    await this.repository.update(user, { name: input.name });
    return toUserOutput(user);
  }

  async changePassword(user, input) {
    if (!(await bcrypt.compare(input.currentPassword, user.password))) {
      throw new AppError(400, "Current password is incorrect");
    }
    if (input.currentPassword === input.newPassword) {
      throw new AppError(400, "Choose a password different from your current password");
    }
    await sequelize.transaction(async (transaction) => {
      await this.repository.update(user, { password: await bcrypt.hash(input.newPassword, 12) }, { transaction });
      await this.repository.revokeSessions(user, transaction);
    });
  }
}
