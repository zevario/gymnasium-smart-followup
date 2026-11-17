import Joi from 'joi';

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

export const customerIdParamSchema = Joi.object({
  id: uuid.required(),
});

export const listCatalogSchema = Joi.object({
  include_inactive: Joi.boolean().default(false),
});

export const assignPackageSchema = Joi.object({
  package_id: uuid.required(),
  purchased_at: Joi.date().iso().raw().optional(),
});

export const listExpiringSchema = Joi.object({
  days: Joi.number().integer().min(1).max(60).default(7),
});
