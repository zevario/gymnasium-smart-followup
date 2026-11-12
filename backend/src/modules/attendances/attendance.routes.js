import { Router } from 'express';
import authentication from '../../middleware/authentication.js';
import authorization from '../../middleware/authorization.js';
import validate from '../../middleware/validate.js';
import { createAttendance, getAttendances } from './attendance.controller.js';
import { createAttendanceSchema, listAttendancesSchema } from './attendance.schema.js';

const router = Router();

router.use(authentication, authorization('admin', 'spv', 'staff'));
router.get('/', validate(listAttendancesSchema, 'query'), getAttendances);
router.post('/', validate(createAttendanceSchema), createAttendance);

export default router;
