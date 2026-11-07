import Joi from 'joi';

export const reportPeriodSchema = Joi.object({
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
}).custom((value, helpers) => {
  if (value.from && value.to && value.from > value.to) {
    return helpers.error('any.invalid');
  }
  return value;
}).messages({
  'any.invalid': '"from" must be earlier than or equal to "to"',
});
