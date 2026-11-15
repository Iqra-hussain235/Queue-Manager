import Joi from "joi";

export const queueParamsSchema = Joi.object({ queueId: Joi.string().uuid().required() });
export const tokenParamsSchema = Joi.object({ tokenId: Joi.string().uuid().required() });
export const createTokenSchema = Joi.object({
  personName: Joi.string().trim().min(1).max(120).required(),
  personContact: Joi.string().trim().max(40).allow("", null).default(null),
});
export const moveTokenSchema = Joi.object({ direction: Joi.string().valid("up", "down").required() });
export const listTokensSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  status: Joi.string().valid("WAITING", "CALLED", "SERVING", "COMPLETED", "CANCELLED"),
  search: Joi.string().trim().max(120).allow(""),
  sort: Joi.string().valid("position", "createdAt").default("position"),
  order: Joi.string().valid("ASC", "DESC").default("ASC"),
});
