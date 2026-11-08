import Joi from 'joi';

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

export const attendanceIdSchema = Joi.object({
  id: uuid.required(),
});

export const listAttendancesSchema = Joi.object({
  search: Joi.string().allow('').default(''),
});

export const createAttendanceSchema = Joi.object({
  schedule_id: uuid.required(),
  customer_id: uuid.required(),
});
