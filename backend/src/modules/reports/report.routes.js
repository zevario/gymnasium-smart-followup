import { Router } from 'express';
import authentication from '../../middleware/authentication.js';
import authorization from '../../middleware/authorization.js';
import validate from '../../middleware/validate.js';
import getReport from './report.controller.js';
import { reportPeriodSchema } from './report.schema.js';

const router = Router();

router.use(authentication, authorization('admin', 'spv'));
router.get('/', validate(reportPeriodSchema, 'query'), getReport);

export default router;
