import { Router } from 'express';
import authentication from '../../middleware/authentication.js';
import authorization from '../../middleware/authorization.js';
import { createAttendance, getAttendances } from './attendance.controller.js';
import { createAttendanceSchema, listAttendancesSchema } from './attendance.schema.js';

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

router.use(authentication, authorization('admin', 'spv', 'staff'));
router.get('/', validate(listAttendancesSchema, 'query'), getAttendances);
router.post('/', validate(createAttendanceSchema), createAttendance);

export default router;
