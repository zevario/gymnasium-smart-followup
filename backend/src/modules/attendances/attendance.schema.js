import Joi from 'joi';

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

export const listAttendancesSchema = Joi.object({
  search: Joi.string().allow('').default(''),
});

export const createAttendanceSchema = Joi.object({
  schedule_id: uuid.required(),
  customer_id: uuid.required(),
});

export const attendanceIdSchema = Joi.object({
  id: Joi.string()
    .guid({ version: ['uuidv4', 'uuidv5'] })
    .required(),
});

export const updateAttendanceStatusSchema = Joi.object({
  status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
});
