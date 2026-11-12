import { Router } from 'express';
import authentication from '../../middleware/authentication.js';
import authorization from '../../middleware/authorization.js';
import validate from '../../middleware/validate.js';
import {
  createSchedule,
  deleteSchedule,
  getScheduleById,
  getSchedules,
  updateSchedule,
} from './schedule.controller.js';
import {
  createScheduleSchema,
  listSchedulesSchema,
  scheduleIdSchema,
  updateScheduleSchema,
} from './schedule.schema.js';

const router = Router();

router.use(authentication);
router.get('/', validate(listSchedulesSchema, 'query'), getSchedules);
router.get('/:id', validate(scheduleIdSchema, 'params'), getScheduleById);
router.post('/', authorization('admin', 'spv'), validate(createScheduleSchema), createSchedule);
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
