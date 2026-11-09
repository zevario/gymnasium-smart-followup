import pool from '../../database/pool.js';
import { withTransaction } from '../../database/transaction.js';

const AuthenticationRepositories = {
  async findUserByEmail(email) {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);

    return result.rows[0];
  },

  async saveSession(userId, tokenHash, expiresAt, passwordHash) {
    return withTransaction(async (db) => {
      const locked = await db.query(
        'SELECT id FROM users WHERE id=$1 AND is_active AND password_hash=$2 FOR UPDATE',
        [userId, passwordHash],
      );
      if (!locked.rowCount) return null;

      const result = await db.query(
        `INSERT INTO sessions
       (user_id, refresh_token_hash, expires_at)
       SELECT id, $2, $3 FROM users WHERE id=$1 AND is_active AND password_hash=$4
       RETURNING id`,
        [userId, tokenHash, expiresAt, passwordHash],
      );

      return result.rows[0];
    });
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

  async revokeSession(tokenHash, userId) {
    return pool.query(
      `UPDATE sessions SET revoked_at = NOW()
       WHERE refresh_token_hash = $1 AND user_id=$2
       AND revoked_at IS NULL`,
      [tokenHash, userId],
    );
  },

  async rotateSession(oldHash, userId, newHash, expiresAt, passwordHash) {
    return withTransaction(async (db) => {
      const locked = await db.query(
        'SELECT id FROM users WHERE id=$1 AND is_active AND password_hash=$2 FOR UPDATE',
        [userId, passwordHash],
      );
      if (!locked.rowCount) return null;

      // One atomic statement: concurrent refreshes can consume the old token only once.
      const result = await db.query(
        `WITH consumed AS (
        UPDATE sessions SET revoked_at=NOW()
        WHERE refresh_token_hash=$1 AND user_id=$2 AND revoked_at IS NULL AND expires_at>NOW()
        RETURNING user_id
      ) INSERT INTO sessions(user_id,refresh_token_hash,expires_at)
        SELECT u.id,$3,$4 FROM consumed c JOIN users u ON u.id=c.user_id
        WHERE u.is_active AND u.password_hash=$5 RETURNING id`,
        [oldHash, userId, newHash, expiresAt, passwordHash],
      );
      return result.rows[0];
    });
  },

  async findUserById(id) {
    const result = await pool.query(
      `SELECT id, name, email, role, is_active, password_hash
       FROM users WHERE id = $1`,
      [id],
    );

    return result.rows[0];
  },
};

export default AuthenticationRepositories;
