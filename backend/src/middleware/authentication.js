import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

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

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET,
    );

    const result = await pool.query(
      `SELECT id, name, email, role, is_active, pilot_location
       FROM users WHERE id = $1`,
      [decoded.sub],
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