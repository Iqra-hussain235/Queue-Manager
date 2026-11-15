import { Router } from "express";
import controller from "./auth.controller.js";
import { changePasswordSchema, loginSchema, registerSchema, updateProfileSchema } from "./auth.validator.js";
import { validate } from "../../middlewares/validate.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router = Router();
router.post("/register", validate(registerSchema), asyncHandler(controller.register));
router.post("/login", validate(loginSchema), asyncHandler(controller.login));
router.post("/logout", authenticate, asyncHandler(controller.logout));
router.get("/me", authenticate, asyncHandler(controller.me));
router.patch("/me", authenticate, validate(updateProfileSchema), asyncHandler(controller.updateProfile));
router.put("/password", authenticate, validate(changePasswordSchema), asyncHandler(controller.changePassword));
export default router;
