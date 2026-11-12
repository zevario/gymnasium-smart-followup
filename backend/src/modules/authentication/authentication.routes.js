import { Router } from 'express';
import { login, me, logout, refresh } from './authentication.controller.js';
import authentication from '../../middleware/authentication.js';
import { loginLimiter, refreshLimiter } from '../../middleware/rate-limit.js';
import validate from '../../middleware/validate.js';
import { loginSchema, refreshSchema } from './authentication.schema.js';

const router = Router();

router.post('/login', loginLimiter, validate(loginSchema), login);
router.post('/refresh', refreshLimiter, validate(refreshSchema), refresh);
router.post('/logout', refreshLimiter, validate(refreshSchema), logout);
router.get('/me', authentication, me);

export default router;
