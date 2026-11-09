import { Router } from 'express';
import authentication from '../../middleware/authentication.js';
import authorization from '../../middleware/authorization.js';
import {
  getDraftGeneratorStatus,
  getNotifications,
  getReminderEvents,
  getReminders,
  markNotificationRead,
  markReminderSent,
  reviewReminder,
  setReminderResponse,
} from './reminder.controller.js';
import {
  listRemindersSchema,
  reminderIdSchema,
  reminderNoteSchema,
  reviewReminderSchema,
} from './reminder.schema.js';

const router = Router();

const validate =
  (schema, source = 'body') =>
  (req, res, next) => {
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

const validateId = validate(reminderIdSchema, 'params');

router.use(authentication, authorization('admin', 'spv', 'staff'));
router.get('/', validate(listRemindersSchema, 'query'), getReminders);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', validateId, markNotificationRead);
router.get('/draft-status', getDraftGeneratorStatus);
router.get('/:id/history', validateId, getReminderEvents);
router.patch(
  '/:id/review',
  authorization('admin', 'spv'),
  validateId,
  validate(reviewReminderSchema),
  reviewReminder,
);
router.post('/:id/send', authorization('staff'), validateId, markReminderSent);
router.post('/:id/responded', validateId, validate(reminderNoteSchema), setReminderResponse);
router.post('/:id/no-response', validateId, validate(reminderNoteSchema), setReminderResponse);

export default router;
