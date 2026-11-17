import { Router } from 'express';

import authenticationRoutes from '../modules/authentication/authentication.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import customerRoutes from '../modules/customers/customer.routes.js';
import scheduleRoutes from '../modules/schedules/schedule.routes.js';
import attendanceRoutes from '../modules/attendances/attendance.routes.js';
import followupRoutes from '../modules/followups/followup.routes.js';
import reminderRoutes from '../modules/reminders/reminder.routes.js';
import reportRoutes from '../modules/reports/report.routes.js';
import packageRoutes, { customerPackageRouter } from '../modules/packages/package.routes.js';

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
// Dipasang sebelum '/customers' agar jalur paket pelanggan tidak tertelan
// router pelanggan.
router.use('/customers/:id/packages', customerPackageRouter);
router.use('/customers', customerRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/attendances', attendanceRoutes);
router.use('/followups', followupRoutes);
router.use('/reminders', reminderRoutes);
router.use('/reports', reportRoutes);
router.use('/packages', packageRoutes);

export default router;
