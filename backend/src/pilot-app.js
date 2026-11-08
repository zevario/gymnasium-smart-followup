import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { fileURLToPath } from 'node:url';
import auth from './services/authentication/routes/index.js';
import authentication from './middleware/authentication.js';
import { pilotScope, pilotUsers } from './services/pilot/scope.js';
import pilot from './services/pilot/routes.js';
import pool from './config/database.js';

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", 'data:', 'blob:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        upgradeInsecureRequests: null,
      },
    },
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});
app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1 FROM pilot_cycles LIMIT 1');
  res.json({ data: { status: 'ok', location: 'bintaro', channel: 'manual' } });
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
app.use((err, _req, res, _next) => {
  if (res.headersSent) return _next(err);
  const status = err.isJoi
    ? 400
    : err.statusCode ||
      (['JsonWebTokenError', 'TokenExpiredError'].includes(err.name) ? 401 : 0) ||
      (err.code === '23505' ? 409 : 500);
  if (status >= 500) console.error('Pilot API error', err.code || err.name);
  res
    .status(status)
    .json({
      message:
        status >= 500
          ? 'Layanan belum tersedia.'
          : err.isJoi
            ? err.details[0].message
            : err.code === '23505'
              ? 'Data sudah tercatat.'
              : err.message,
    });
});

export default app;
