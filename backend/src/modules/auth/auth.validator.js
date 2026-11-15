import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().lowercase().email().max(254).required(),
  password: Joi.string().min(8).max(72).required(),
});
export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(1).max(72).required(),
});
export const updateProfileSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
});
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().min(1).max(72).required(),
  newPassword: Joi.string().min(8).max(72).required(),
});
