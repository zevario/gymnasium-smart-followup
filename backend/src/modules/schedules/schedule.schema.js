import Joi from 'joi';

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

const scheduleFields = {
  title: Joi.string().trim().min(2).max(150),
  description: Joi.string().allow('', null),
  type: Joi.string().valid('group_class', 'personal_training'),
  customer_id: uuid.allow(null),
  member_ids: Joi.array().items(uuid).unique().default([]),
  trainer_name: Joi.string().trim().max(150).allow('', null),
  location: Joi.string().trim().max(150).allow('', null),
  starts_at: Joi.date().iso(),
  ends_at: Joi.date().iso(),
  status: Joi.string().valid('scheduled', 'completed', 'cancelled'),
  reminder_2h_enabled: Joi.boolean().default(false),
};

const validateSchedule = (value, helpers) => {
  if (value.starts_at && value.ends_at && value.ends_at <= value.starts_at) {
    return helpers.error('any.invalid');
  }
  if (value.type === 'personal_training' && !value.customer_id) {
    return helpers.error('any.invalid');
  }
  if (value.type === 'group_class' && value.customer_id) {
    return helpers.error('any.invalid');
  }
  if (value.type === 'personal_training' && value.member_ids?.length) {
    return helpers.error('any.invalid');
  }
  return value;
};

const scheduleMessages = {
  'any.invalid': 'Tipe jadwal, pelanggan, dan waktu mulai/selesai tidak sesuai.',
};

export const scheduleIdSchema = Joi.object({
  id: uuid.required(),
});

export const listSchedulesSchema = Joi.object({
  upcoming: Joi.boolean().truthy('true').falsy('false').default(false),
});

export const createScheduleSchema = Joi.object({
  ...scheduleFields,
  title: scheduleFields.title.required(),
  type: scheduleFields.type.required(),
  starts_at: scheduleFields.starts_at.required(),
  ends_at: scheduleFields.ends_at.required(),
  status: scheduleFields.status.default('scheduled'),
})
  .custom(validateSchedule)
  .messages(scheduleMessages);

export const updateScheduleSchema = Joi.object(scheduleFields)
  .fork(['title', 'type', 'starts_at', 'ends_at'], (schema) => schema.required())
  .custom(validateSchedule)
  .messages(scheduleMessages);
