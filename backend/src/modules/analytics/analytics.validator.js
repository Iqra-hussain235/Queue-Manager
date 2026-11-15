import Joi from "joi";

export const analyticsQuerySchema = Joi.object({
  from: Joi.date().iso(),
  to: Joi.date().iso().min(Joi.ref("from")),
}).with("from", "to").with("to", "from");
