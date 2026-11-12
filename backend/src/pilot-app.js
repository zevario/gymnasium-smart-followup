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
  await pool.query('SELECT 1 FROM pilot_cycles LIMIT 1');
  res.json({ data: { status: 'ok', location: PILOT_LOCATION, channel: 'manual' } });
});
app.use('/api/auth', auth);
app.get('/api/session', authentication, pilotScope, (req, res) =>
  res.json({ data: { user: req.user } }),
);
app.use('/api/users', authentication, pilotScope, pilotUsers);
app.use('/api/pilot', pilot);
app.use('/api', (_req, res) => res.status(404).json({ message: 'Endpoint tidak ditemukan.' }));
const dist = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));
app.use(express.static(dist));
app.get('/', (_req, res) => res.sendFile('index.html', { root: dist }));
app.use(createErrorHandler({ includeStatus: false }));

export default app;
