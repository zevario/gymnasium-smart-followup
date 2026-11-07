import { Router } from 'express';
import authentication from '../../../middleware/authentication.js';
import authorization from '../../../middleware/authorization.js';
import {
  createSchedule,
  deleteSchedule,
  getScheduleById,
  getSchedules,
  updateSchedule,
} from '../controller/schedule-controller.js';
import {
  createScheduleSchema,
  listSchedulesSchema,
  scheduleIdSchema,
  updateScheduleSchema,
} from '../validator/schema.js';

const router = Router();

const validate = (schema, source = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[source]);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message,
    });
  }
  req.validated = value;
  return next();
};

router.use(authentication);
router.get('/', validate(listSchedulesSchema, 'query'), getSchedules);
router.get('/:id', validate(scheduleIdSchema, 'params'), getScheduleById);
router.post(
  '/',
  authorization('admin', 'spv'),
  validate(createScheduleSchema),
  createSchedule,
);
router.put(
  '/:id',
  authorization('admin', 'spv'),
  validate(scheduleIdSchema, 'params'),
  validate(updateScheduleSchema),
  updateSchedule,
);
router.delete(
  '/:id',
  authorization('admin', 'spv'),
  validate(scheduleIdSchema, 'params'),
  deleteSchedule,
);

export default router;
