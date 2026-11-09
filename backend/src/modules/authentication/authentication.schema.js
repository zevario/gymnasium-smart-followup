import Joi from 'joi';

const loginSchema = Joi.object({
  email: Joi.string().trim().max(150).email().required(),
  password: Joi.string().max(1024).required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().max(2048).required(),
});

export { loginSchema, refreshSchema };
