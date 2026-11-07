import Joi from 'joi';

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

export const customerIdSchema = Joi.object({
  customerId: uuid.required(),
});

export const listFollowupsSchema = Joi.object({
  search: Joi.string().allow('').default(''),
});

export const updateFollowupStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'in_progress', 'completed', 'no_response', 'postponed', 'blocked')
    .required(),
});

export const createFollowupActivitySchema = Joi.object({
  channel: Joi.string().valid('WhatsApp', 'Telepon', 'Kunjungan').required(),
  note: Joi.string().trim().min(1).max(5000).required(),
  result: Joi.string().allow('').max(5000).default(''),
});

export const recommendationIdSchema = Joi.object({
  id: uuid.required(),
});

export const approveRecommendationSchema = Joi.object({
  assigned_to: uuid.required(),
  draft_message: Joi.string().allow('').max(10000).default(''),
});

export const dismissRecommendationSchema = Joi.object({
  note: Joi.string().allow('').max(2000).default(''),
});
