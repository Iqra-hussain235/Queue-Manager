import { User } from "../../models/index.js";

export default class AuthRepository {
  findByEmail(email) {
    return User.findOne({ where: { email } });
  }
  findById(id) {
    return User.findByPk(id);
  }
  create(values) {
    return User.create(values);
  }
  update(user, values, options = {}) {
    return user.update(values, options);
  }
  async revokeSessions(user, transaction) {
    user.tokenVersion += 1;
    await user.save({ transaction });
  }
}
