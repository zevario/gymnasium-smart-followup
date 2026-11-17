import 'dotenv/config';
import express from 'express';
import { configureSecurity } from './config/security.js';
import { apiLimiter } from './middleware/rate-limit.js';
import { createErrorHandler } from './middleware/error-handler.js';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import auth from './modules/authentication/authentication.routes.js';
import authentication from './middleware/authentication.js';
import { PILOT_LOCATION } from './modules/pilot/pilot.constants.js';
import { pilotScope, pilotUsers } from './modules/pilot/pilot.scope.js';
import pilot from './modules/pilot/pilot.routes.js';
import pool from './database/pool.js';

import memberRoutes, { staffRequests } from './modules/members/member.routes.js';

// Route aplikasi MVP. Dipasang di server yang sama dengan frontend supaya
// antarmuka cukup memanggil /api tanpa base URL kedua. '/api/auth' dan
// '/api/users' tetap milik pilot, jadi tidak ada jalur yang bertabrakan.
import customerRoutes from './modules/customers/customer.routes.js';
import scheduleRoutes from './modules/schedules/schedule.routes.js';
import attendanceRoutes from './modules/attendances/attendance.routes.js';
import followupRoutes from './modules/followups/followup.routes.js';
import reminderRoutes from './modules/reminders/reminder.routes.js';
import reportRoutes from './modules/reports/report.routes.js';
import packageRoutes, { customerPackageRouter } from './modules/packages/package.routes.js';
import accountEmailRoutes from './modules/authentication/account-email.routes.js';
const app = express();
configureSecurity(app);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", 'data:', 'blob:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  }),
);
app.use('/api', apiLimiter);
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', async (_req, res) => {
  await pool.query(
    'SELECT 1 FROM pilot_cycles, member_accounts, member_sessions, member_requests, account_email_links LIMIT 0',
  );
  res.json({ data: { status: 'ok', location: PILOT_LOCATION, channel: 'manual' } });
});
app.use('/api/auth', auth, accountEmailRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/member-requests', staffRequests);
app.get('/api/session', authentication, pilotScope, (req, res) =>
  res.json({ data: { user: req.user } }),
);
app.use('/api/users', authentication, pilotScope, pilotUsers);
app.use('/api/pilot', pilot);
app.use('/api/customers/:id/packages', customerPackageRouter);
app.use('/api/customers', customerRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/attendances', attendanceRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api', (_req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan.' }));
const dist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
app.use(express.static(dist));
app.get(['/', '/customer', '/forgot-password', '/reset-password', '/activate-email'], (_req, res) =>
  res.sendFile('index.html', { root: dist }),
);
app.use(createErrorHandler({ includeStatus: false }));

export default app;
