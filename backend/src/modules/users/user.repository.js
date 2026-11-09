import pool from '../../database/pool.js';
import { withTransaction } from '../../database/transaction.js';

const UserRepositories = {
  async getAll() {
    const result = await pool.query(
      `SELECT id, name, email, role, is_active, created_at
       FROM users ORDER BY created_at DESC`,
    );

    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      `SELECT id, name, email, role, is_active, created_at
       FROM users WHERE id = $1`,
      [id],
    );

    return result.rows[0];
  },

  async findByEmail(email, excludeId) {
    const values = [email.toLowerCase()];
    const excludeClause = excludeId ? 'AND id <> $2' : '';

    if (excludeId) values.push(excludeId);

    const result = await pool.query(
      `SELECT id FROM users
       WHERE LOWER(email) = $1 ${excludeClause}
       LIMIT 1`,
      values,
    );

    return result.rows[0] || null;
  },

  async getPasswordHash(id) {
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1 AND is_active = TRUE',
      [id],
    );
    return result.rows[0]?.password_hash || null;
  },

  async updateOwnProfile(id, { name, email }) {
    const result = await pool.query(
      `UPDATE users
       SET name = $1, email = $2, updated_at = NOW()
       WHERE id = $3 AND is_active = TRUE
       RETURNING id, name, email, role, is_active`,
      [name, email, id],
    );
    return result.rows[0] || null;
  },

  async updatePasswordHash(id, passwordHash) {
    return withTransaction(async (db) => {
      const result = await db.query(
        `UPDATE users
       SET password_hash = $1, updated_at = NOW()
       WHERE id = $2 AND is_active = TRUE
       RETURNING id`,
        [passwordHash, id],
      );
      if (result.rowCount > 0)
        await db.query(
          'UPDATE sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL',
          [id],
        );

      return result.rowCount > 0;
    });
  },

  async updateOwnProfilePhoto(id, buffer, mimeType) {
    const result = await pool.query(
      `UPDATE users
       SET profile_photo = $1, profile_photo_mime_type = $2, updated_at = NOW()
       WHERE id = $3 AND is_active = TRUE
       RETURNING id`,
      [buffer, mimeType, id],
    );
    return result.rowCount > 0;
  },

  async getOwnProfilePhoto(id) {
    const result = await pool.query(
      `SELECT profile_photo, profile_photo_mime_type
       FROM users
       WHERE id = $1 AND is_active = TRUE`,
      [id],
    );
    return result.rows[0] || null;
  },

  async getProfilePhoto(id) {
    const result = await pool.query(
      `SELECT profile_photo, profile_photo_mime_type
       FROM users
       WHERE id = $1`,
      [id],
    );
    return result.rows[0] || null;
  },

  async deleteOwnProfilePhoto(id) {
    const result = await pool.query(
      `UPDATE users
       SET profile_photo = NULL, profile_photo_mime_type = NULL, updated_at = NOW()
       WHERE id = $1 AND is_active = TRUE
       RETURNING id`,
      [id],
    );
    return result.rowCount > 0;
  },

  async create(data, pilotLocation = null) {
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, pilot_location)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role, is_active`,
      [data.name, data.email, data.password_hash, data.role, pilotLocation],
    );

    return result.rows[0];
  },

  async update(id, data) {
    return withTransaction(async (db) => {
      const allowedFields = new Set(['name', 'email', 'password_hash', 'role', 'is_active']);
      const fields = Object.keys(data).filter((field) => allowedFields.has(field));

      const values = fields.map((field) => data[field]);

      const assignments = fields.map((field, index) => `${field} = $${index + 1}`);

      assignments.push('updated_at = NOW()');
      values.push(id);

      const result = await db.query(
        `UPDATE users SET ${assignments.join(', ')}
       WHERE id = $${values.length}
       RETURNING id, name, email, role, is_active`,
        values,
      );

      if (result.rowCount > 0 && ('password_hash' in data || 'role' in data || 'is_active' in data))
        await db.query(
          'UPDATE sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL',
          [id],
        );

      return result.rows[0];
    });
  },

  async deactivate(id) {
    return withTransaction(async (db) => {
      const result = await db.query(
        `UPDATE users SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, email, role, is_active`,
        [id],
      );

      if (result.rowCount > 0)
        await db.query(
          'UPDATE sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL',
          [id],
        );

      return result.rows[0];
    });
  },

  async delete(id) {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    return result.rows[0] || null;
  },
};

export default UserRepositories;
