import { Router } from 'express';
import authentication from '../../../middleware/authentication.js';
import authorization from '../../../middleware/authorization.js';
import getReport from '../controller/report-controller.js';
import { reportPeriodSchema } from '../validator/schema.js';

const router = Router();

router.use(authentication, authorization('admin', 'spv'));
router.get('/', (req, res, next) => {
  const { error, value } = reportPeriodSchema.validate(req.query);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message,
    });
  }
  req.validated = value;
  return next();
}, getReport);

export default router;
