import Joi from "joi";

const emailSchema = Joi.string().email({ tlds: { allow: false } }).required();

export const registerSchema = Joi.object({
  fullName: Joi.string().min(3).max(120).required(),
  email: emailSchema,
  password: Joi.string().min(8).max(64).required(),
  role: Joi.string().valid("ADMIN", "SECURITY_ANALYST").default("SECURITY_ANALYST")
});

export const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required(),
  twoFaCode: Joi.string().length(6).optional()
});

export const refreshSchema = Joi.object({
  refreshToken: Joi.string().required()
});

export const logoutSchema = Joi.object({
  refreshToken: Joi.string().required()
});

export const verifyTwoFaSchema = Joi.object({
  code: Joi.string().length(6).required()
});
