import Joi from 'joi';

const loginSchema = Joi.object({
  email: Joi.string().trim().max(150).email().required(),
  password: Joi.string().max(1024).required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().max(2048).required(),
});

export const memberPassword = Joi.string().min(10).max(72, 'utf8').required();
export const accountEmail = Joi.string()
  .trim()
  .lowercase()
  .email({ tlds: false })
  .max(254)
  .required();
export { loginSchema, refreshSchema };
