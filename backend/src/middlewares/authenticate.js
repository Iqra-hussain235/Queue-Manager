import jwt from "jsonwebtoken";
import { User } from "../models/index.js";
import env from "../config/environment.js";

export async function authenticate(req, res, next) {
  try {
    const header = req.get("authorization");
    const [scheme, token] = header?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ success: false, message: "Authentication required", data: null, meta: {} });
    }
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findByPk(payload.sub);
    if (!user || user.tokenVersion !== payload.version) {
      return res.status(401).json({ success: false, message: "Session expired. Please sign in again.", data: null, meta: {} });
    }
    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired. Please sign in again.", data: null, meta: {} });
    }
    return next(error);
  }
}
