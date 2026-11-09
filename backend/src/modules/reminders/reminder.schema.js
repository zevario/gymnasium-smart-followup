import Joi from 'joi';

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

export const reminderIdSchema = Joi.object({
  id: uuid.required(),
});

export const listRemindersSchema = Joi.object({
  status: Joi.string()
    .valid('scheduled', 'sent', 'responded', 'no_response', 'cancelled')
    .optional(),
  approval_status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
  search: Joi.string().allow('').default(''),
});

export const reviewReminderSchema = Joi.object({
  decision: Joi.string().valid('approve', 'reject').required(),
  message: Joi.string()
    .trim()
    .max(10000)
    .when('decision', {
      is: 'approve',
      then: Joi.string().trim().min(1).max(10000).required(),
      otherwise: Joi.string().allow('').default(''),
    }),
  assigned_to: uuid.when('decision', {
    is: 'approve',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  note: Joi.string().allow('').max(2000).default(''),
});

export const reminderNoteSchema = Joi.object({
  note: Joi.string().allow('').max(2000).default(''),
});
