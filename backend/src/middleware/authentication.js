import { verifyToken } from '../modules/authentication/token.service.js';
import pool from '../database/pool.js';

const authentication = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
      });
    }

    const token = authorization.split(' ')[1];

    const decoded = verifyToken(token, 'access');

    const result = await pool.query(
      `SELECT id, name, email, role, is_active, pilot_location
       FROM users WHERE id = $1 AND EXISTS (
         SELECT 1 FROM sessions WHERE user_id=users.id AND refresh_token_hash=$2
         AND revoked_at IS NULL AND expires_at>NOW()
       )`,
      [decoded.sub, decoded.sid],
    );

    if (!result.rowCount || !result.rows[0].is_active) {
      return res.status(401).json({
        status: 'error',
        message: 'Account not found or inactive',
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (
      error.name === 'TokenExpiredError' ||
      error.name === 'JsonWebTokenError' ||
      error.name === 'NotBeforeError'
    ) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired access token',
      });
    }

    next(error);
  }
};

export default authentication;
