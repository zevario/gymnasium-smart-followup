import { Router } from 'express';
import {
  login,
  me,
  logout,
  refresh,
} from '../controller/authentication-controller.js';
import authentication from '../../../middleware/authentication.js';
import { loginSchema, refreshSchema } from '../validator/schema.js';

const router = Router();

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);

  if (error) return next(error);

  req.validated = value;
  next();
};

router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', authentication, logout);
router.get('/me', authentication, me);

export default router;