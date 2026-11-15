import Joi from "joi";

export const createQueueSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  description: Joi.string().trim().max(1000).allow("", null).default(null),
});
export const updateQueueSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120),
  description: Joi.string().trim().max(1000).allow("", null),
}).min(1);
export const queueStatusSchema = Joi.object({
  status: Joi.string().valid("ACTIVE", "INACTIVE").required(),
});
export const queueParamsSchema = Joi.object({ queueId: Joi.string().uuid().required() });
