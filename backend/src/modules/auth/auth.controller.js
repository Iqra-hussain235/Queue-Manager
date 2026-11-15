import AuthService from "./auth.service.js";
import { sendSuccess } from "../../utils/apiResponse.js";

const service = new AuthService();
export default {
  register: async (req, res) => sendSuccess(res, "Account created successfully", await service.register(req.body)),
  login: async (req, res) => sendSuccess(res, "Signed in successfully", await service.login(req.body)),
  me: async (req, res) => sendSuccess(res, "Profile loaded successfully", {
    id: req.user.id, name: req.user.name, email: req.user.email, role: req.user.role, createdAt: req.user.createdAt,
  }),
  updateProfile: async (req, res) => sendSuccess(res, "Profile updated successfully", await service.updateProfile(req.user, req.body)),
  changePassword: async (req, res) => {
    await service.changePassword(req.user, req.body);
    return sendSuccess(res, "Password changed. Please sign in again.");
  },
  logout: async (req, res) => {
    await service.logout(req.user);
    return sendSuccess(res, "Signed out successfully");
  },
};
