import pool from '../../database/pool.js';
import authorization from '../../middleware/authorization.js';
import { Router } from 'express';
import userRoutes from '../users/user.routes.js';
import { PILOT_LOCATION } from './pilot.constants.js';

export function pilotScope(req, res, next) {
  if (req.user?.pilot_location !== PILOT_LOCATION)
    return res.status(403).json({ message: 'Akun belum ditugaskan ke Gymnasyum Bintaro.' });
  req.pilotLocation = PILOT_LOCATION;
  next();
}
export const pilotUsers = Router();
pilotUsers.get('/', authorization('admin'), async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id,name,email,role,is_active FROM users WHERE pilot_location=$1 ORDER BY name,id',
    [req.pilotLocation],
  );
  res.json({ data: rows });
});
pilotUsers.use('/:target', async (req, res, next) => {
  if (req.params.target === 'me') return next();
  if (req.user.role !== 'admin') return res.sendStatus(403);
  const exists = await pool.query('SELECT 1 FROM users WHERE id::text=$1 AND pilot_location=$2', [
    req.params.target,
    req.pilotLocation,
  ]);
  if (!exists.rowCount)
    return res.status(404).json({ message: 'Akun tidak ditemukan di lokasi ini.' });
  next();
});
pilotUsers.use(userRoutes);
