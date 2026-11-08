import pool from '../../../config/database.js';

const AuthenticationRepositories = {
  async findUserByEmail(email) {
    const result = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email],
    );

    return result.rows[0];
  },

  async saveSession(userId, tokenHash, expiresAt) {
    const result = await pool.query(
      `INSERT INTO sessions
       (user_id, refresh_token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [userId, tokenHash, expiresAt],
    );

    return result.rows[0];
  },

  async findSession(tokenHash) {
    const result = await pool.query(
      `SELECT * FROM sessions
       WHERE refresh_token_hash = $1
       AND revoked_at IS NULL
       AND expires_at > NOW()`,
      [tokenHash],
    );

    return result.rows[0];
  },

  async revokeSession(tokenHash) {
    return pool.query(
      `UPDATE sessions SET revoked_at = NOW()
       WHERE refresh_token_hash = $1
       AND revoked_at IS NULL`,
      [tokenHash],
    );
  },

  async findUserById(id) {
    const result = await pool.query(
      `SELECT id, name, email, role, is_active
       FROM users WHERE id = $1`,
      [id],
    );

    return result.rows[0];
  },
};

export default AuthenticationRepositories;