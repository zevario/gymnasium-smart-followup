import { Router } from 'express';

import authenticationRoutes from '../services/authentication/routes/index.js';
import userRoutes from '../services/users/routes/index.js';
import customerRoutes from '../services/customers/routes/index.js';
import scheduleRoutes from '../services/schedules/routes/index.js';
import attendanceRoutes from '../services/attendances/routes/index.js';
import followupRoutes from '../services/followups/routes/index.js';
import reminderRoutes from '../services/reminders/routes/index.js';
import reportRoutes from '../services/reports/routes/index.js';

const router = Router();

router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Gymnasyum API is running',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authenticationRoutes);
router.use('/users', userRoutes);
router.use('/customers', customerRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/attendances', attendanceRoutes);
router.use('/followups', followupRoutes);
router.use('/reminders', reminderRoutes);
router.use('/reports', reportRoutes);

export default router;